import { Env } from '../index';

export async function handleGetFile(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url);
		// 【关键】：对 pathname 进行解码
		const path = decodeURIComponent(url.pathname);

		const parts = path.split('/');
		const bucketType = parts[1];
		const objectKeyFromUrl = parts.slice(2).join('/'); // 此时这里已经是带空格的原始名字了

		if (!objectKeyFromUrl) {
			return new Response(JSON.stringify({ msg: '路径不完整', code: 400 }), { status: 400 });
		}

		// 2. 选择桶
		const bucket = bucketType === 'temp' ? env.TEMP_BUCKET : env.PERM_BUCKET;

		// 3. 执行读取
		// 这里的 storageKey 就会变成 "files/9d31531b/1280X1280.PNG"
		// 这才是文件在 R2 里的真实位置
		const storageKey = `files/${objectKeyFromUrl}`;
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
		headers.set('Access-Control-Allow-Origin', '*');

		return new Response(object.body, { headers });
	} catch (e: any) {
		return new Response(`读取异常: ${e.message}`, { status: 500 });
	}
}
