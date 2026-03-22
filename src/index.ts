import { handleUpload } from './handler/upload';
import { handleGetFile } from './handler/getFile';
import { withCors } from './utils/cors';

// 定义全局环境接口
export interface Env {
	TEMP_BUCKET: R2Bucket;
	PERM_BUCKET: R2Bucket;
	AUTH_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (request.method === 'OPTIONS') {
			return new Response(null, withCors(request, { status: 204 }));
		}

		// 1. 路由逻辑：如果是上传接口
		if (path === '/upload') {
			if (request.method === 'POST' || request.method === 'PUT') {
				return handleUpload(request, env);
			}
			return new Response(JSON.stringify({ msg: '上传请使用 POST 方法', code: 405 }), {
				status: 405,
				headers: withCors(request, {
					headers: { 'Content-Type': 'application/json' },
				}).headers,
			});
		}

		// 2. 路由逻辑：预览/查看逻辑 (匹配 /temp/* 或 /perm/*)
		const parts = path.split('/');
		const bucketType = parts[1]; // temp 或 perm
		if ((bucketType === 'temp' || bucketType === 'perm') && request.method === 'GET') {
			return handleGetFile(request, env);
		}

		// 3. 默认 404
		return new Response(JSON.stringify({ msg: '未找到路径', code: 404 }), {
			status: 404,
			headers: withCors(request, {
				headers: { 'Content-Type': 'application/json' },
			}).headers,
		});
	},
};
