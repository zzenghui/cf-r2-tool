import { Env } from '../index';

export async function handleUpload(request: Request, env: Env): Promise<Response> {
	// ... 前面的鉴权和校验逻辑保持不变 ...

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const bucketType = formData.get('bucket') as string;

		if (!file || !file.name) return new Response('文件错误', { status: 400 });

		// 1. 生成一个唯一的随机 ID (比如：8位字符)
		const uniqueId = crypto.randomUUID().split('-')[0]; // 取 UUID 的第一段

		// 2. 获取原始文件名
		const originalName = file.name;

		// 3. 【核心修改】：构造存储路径，加入随机 ID 文件夹
		// 这样 R2 里的路径是：files/a1b2c3d4/222.png
		const storageKey = `files/${uniqueId}/${originalName}`;

		const bucket = bucketType === 'temp' ? env.TEMP_BUCKET : env.PERM_BUCKET;

		await bucket.put(storageKey, file.stream(), {
			httpMetadata: { contentType: file.type || 'application/octet-stream' },
		});

		// 4. 生成返回链接
		// 用户访问的链接是：域名/temp/a1b2c3d4/222.png
		const origin = new URL(request.url).origin;
		const fullUrl = `${origin}/${bucketType}/${uniqueId}/${originalName}`;

		return new Response(
			JSON.stringify({
				code: 200,
				msg: '上传成功',
				url: fullUrl,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (e: any) {
		return new Response(`错误: ${e.message}`, { status: 500 });
	}
}
