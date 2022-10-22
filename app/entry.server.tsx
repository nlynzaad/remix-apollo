import { PassThrough, Transform, Readable } from 'stream';
import type { EntryContext } from '@remix-run/node';
import { Response } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import isbot from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { getDataFromTree } from '@apollo/client/react/ssr';
const ABORT_DELAY = 5000;

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	return isbot(request.headers.get('user-agent'))
		? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext)
		: handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}

function handleBotRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	return new Promise((resolve, reject) => {
		let didError = false;

		const { pipe, abort } = renderToPipeableStream(<RemixServer context={remixContext} url={request.url} />, {
			onAllReady() {
				const body = new PassThrough();

				responseHeaders.set('Content-Type', 'text/html');

				resolve(
					new Response(body, {
						headers: responseHeaders,
						status: didError ? 500 : responseStatusCode,
					})
				);

				pipe(body);
			},
			onShellError(error: unknown) {
				reject(error);
			},
			onError(error: unknown) {
				didError = true;

				console.error(error);
			},
		});

		setTimeout(abort, ABORT_DELAY);
	});
}

function handleBrowserRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	return new Promise(async (resolve, reject) => {
		const client = new ApolloClient({
			ssrMode: true,
			cache: new InMemoryCache(),
			link: createHttpLink({
				uri: 'https://flyby-gateway.herokuapp.com/', // from Apollo's Voyage tutorial series (https://www.apollographql.com/tutorials/voyage-part1/)
				headers: request.headers,
				credentials: request.credentials ?? 'include', // or "same-origin" if your backend server is the same domain
			}),
		});

		let didError = false;

		const App = (
			<ApolloProvider client={client}>
				<RemixServer context={remixContext} url={request.url} />
			</ApolloProvider>
		);
		await getDataFromTree(App);

		const { pipe, abort } = renderToPipeableStream(App, {
			onShellReady() {
				const body = new PassThrough();

				var state = new Transform({
					transform(chunk, encoding, callback) {
						callback(null, chunk);
					},
					flush(callback) {
						// Extract the entirety of the Apollo Client cache's current state
						const initialState = client.extract();

						this.push(
							`<script>window.__APOLLO_STATE__=${JSON.stringify(initialState).replace(/</g, '\\u003c')}</script>`
						);
						callback();
					},
				});

				responseHeaders.set('Content-Type', 'text/html');

				resolve(
					new Response(body, {
						headers: responseHeaders,
						status: didError ? 500 : responseStatusCode,
					})
				);

				pipe(state).pipe(body);
			},
			onShellError(err: unknown) {
				reject(err);
			},
			onError(error: unknown) {
				didError = true;

				console.error(error);
			},
		});

		setTimeout(abort, ABORT_DELAY);
	});
}
