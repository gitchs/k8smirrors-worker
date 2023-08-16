/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (request.method == 'GET') {
			switch(url.pathname) {
				case '/':
					return new Response(`request to / is not allowed\n`, {status: 404})
				case '/favicon.ico':
					return new Response(``, {status: 404})
				case '/robots.txt':
					return new Response('User-agent: *\nDisallow: /', {status: 200, headers: {'content-type': 'text/plain'}});
			}
		}

		const upstreamURL = `https://registry.k8s.io${url.pathname}${url.search}`;
		let upstreamHeaders = new Headers();

		let requestheaderIterator = request.headers.entries();
		while (true) {
			const header = requestheaderIterator.next();
			if (header.done) {
				break;
			}
			const headerKey = header.value[0].toLowerCase();
			if (headerKey == 'host') {
				continue;
			}
			upstreamHeaders.append(headerKey, header.value[1]);
		}

		let upstreamRequest = new Request(upstreamURL, {
			method: request.method,
			headers: upstreamHeaders,
			body: request.body,
			redirect: 'follow',
		});

		let nRedirect = 0;

		while (true) {
			let upstreamResponse = await fetch(upstreamRequest, request);
			if (nRedirect < 16 && upstreamResponse.status >= 300 && upstreamResponse.status < 400 && upstreamResponse.headers.has('location')) {
				const nextURL = upstreamResponse.headers.get('location');
				if (nextURL == null) {
					return upstreamResponse;
				}
				nRedirect += 1;
				upstreamRequest = new Request(nextURL, {});
				continue;
			}
			return upstreamResponse;
		}
	},
};
