import { Env } from '../index';

export async function handleUpload(request: Request, env: Env): Promise<Response> {
	// 1. 鉴权：检查请求头中的 x-api-key 是否与 env 中的 AUTH_KEY 一致
	// 注意：env.AUTH_KEY 将读取你设置的 Secret 或 .dev.vars 中的值
	if (request.headers.get('x-api-key') !== env.AUTH_KEY) {
		return new Response(
			JSON.stringify({
				code: 401,
				msg: '鉴权失败：密码错误或未提供',
			}),
			{
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	// 2. 检查 Content-Type 是否为表单格式
	const contentType = request.headers.get('content-type') || '';
	if (!contentType.includes('multipart/form-data')) {
		return new Response(
			JSON.stringify({
				code: 400,
				msg: '请求格式错误，请使用 multipart/form-data 表单格式',
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}

	try {
		// 3. 解析表单数据
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const bucketType = formData.get('bucket') as string;

		// 4. 参数合法性检查
		if (!file || !file.name) {
			return new Response(JSON.stringify({ code: 400, msg: '未检测到上传文件' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (bucketType !== 'temp' && bucketType !== 'perm') {
			return new Response(JSON.stringify({ code: 400, msg: 'bucket 参数必须为 temp 或 perm' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 5. 生成唯一标识并确定存储路径
		// 生成一个 8 位的随机字符串作为文件夹名，防止文件名冲突
		const uniqueId = crypto.randomUUID().split('-')[0];
		const originalName = file.name;

		// 存储路径格式：files/随机ID/原始文件名
		const storageKey = `files/${uniqueId}/${originalName}`;

		// 6. 执行上传
		const bucket = bucketType === 'temp' ? env.TEMP_BUCKET : env.PERM_BUCKET;

		await bucket.put(storageKey, file.stream(), {
			httpMetadata: {
				contentType: file.type || 'application/octet-stream',
			},
		});

		// 7. 生成返回给前端的完整访问链接
		const origin = new URL(request.url).origin;
		// 链接格式：https://域名/桶类型/随机ID/文件名
		const fullUrl = `${origin}/${bucketType}/${uniqueId}/${originalName}`;

		return new Response(
			JSON.stringify({
				code: 200,
				msg: 'success',
				url: fullUrl, // 直接返回完整可访问的 URL
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (e: any) {
		return new Response(
			JSON.stringify({
				code: 500,
				msg: `服务器内部错误: ${e.message}`,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
