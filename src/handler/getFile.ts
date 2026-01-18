import { Env } from '../index';

export async function handleGetFile(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url);
		const path = url.pathname;

		// 1. 解析路径：/temp/222.png -> bucketType: "temp", fileName: "222.png"
		const parts = path.split('/');
		const bucketType = parts[1];
		const fileName = parts.slice(2).join('/');

		if (!fileName) {
			return new Response('文件名缺失', { status: 400 });
		}

		// 2. 选择桶
		const bucket = bucketType === 'temp' ? env.TEMP_BUCKET : env.PERM_BUCKET;

		// 3. 执行读取（关键：加上 files/ 前缀）
		const storageKey = `files/${fileName}`;
		const object = await bucket.get(storageKey);

		// 4. 处理文件不存在
		if (object === null) {
			return new Response(JSON.stringify({ msg: '文件不存在', code: 404 }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 5. 返回文件流
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
		headers.set('Access-Control-Allow-Origin', '*'); // 允许跨域，方便前端调用

		return new Response(object.body, { headers });
	} catch (e: any) {
		return new Response(`读取异常: ${e.message}`, { status: 500 });
	}
}
