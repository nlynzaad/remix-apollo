import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

function hydrate() {
	const client = new ApolloClient({
		cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
		uri: 'https://flyby-gateway.herokuapp.com/', // the same uri in our entry.server file
	});

	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<ApolloProvider client={client}>
					<RemixBrowser />
				</ApolloProvider>
			</StrictMode>
		);
	});
}

if (window.requestIdleCallback) {
	window.requestIdleCallback(hydrate);
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	window.setTimeout(hydrate, 1);
}
