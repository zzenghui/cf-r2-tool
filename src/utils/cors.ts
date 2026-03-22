export function buildCorsHeaders(request: Request) {
	const origin = request.headers.get('Origin') || '*';

	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
		'Access-Control-Max-Age': '86400',
		Vary: 'Origin',
	};
}

export function withCors(request: Request, init?: ResponseInit): ResponseInit {
	const headers = new Headers(init?.headers);
	const corsHeaders = buildCorsHeaders(request);

	Object.entries(corsHeaders).forEach(([key, value]) => {
		headers.set(key, value);
	});

	return {
		...init,
		headers,
	};
}
