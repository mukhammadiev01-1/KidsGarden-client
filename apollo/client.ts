import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, from, NormalizedCacheObject } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { REACT_APP_API_GRAPHQL_URL } from '../libs/config';
let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	// Apollo Server requires this for GraphQL multipart uploads.
	// It is safe for regular GraphQL operations and keeps all upload mutations on the shared client path.
	// @ts-ignore
	headers['apollo-require-preflight'] = 'true';
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => {
		return true;
	}, // @ts-ignore
	fetchAccessToken: () => {
		// execute refresh token
		return null;
	},
});

function createIsomorphicLink() {
	if (typeof window !== 'undefined') {
		const authLink = new ApolloLink((operation, forward) => {
			operation.setContext(({ headers = {} }) => ({
				headers: {
					...headers,
					...getHeaders(),
				},
			}));
			return forward(operation);
		});

		// @ts-ignore
		const link = new createUploadLink({
			uri: REACT_APP_API_GRAPHQL_URL,
		});

		const errorLink = onError(({ operation, graphQLErrors, networkError }) => {
			/**
			 * Only mutations surface a blocking alert. Queries also run as background
			 * refetches (chat inbox, notification polling, realtime-triggered refreshes),
			 * and a full-screen Swal for a transient background failure interrupts the
			 * user mid-task for something they never initiated.
			 *
			 * Errors are logged with console.error, NOT console.log: next.config.js strips
			 * console.log from production builds, so a console.log here would leave a failing
			 * query with no alert and no trace at all. error/warn are excluded from stripping
			 * precisely so diagnostics survive.
			 */
			const isMutation = operation.query.definitions.some(
				(definition) => definition.kind === 'OperationDefinition' && definition.operation === 'mutation',
			);

			if (graphQLErrors) {
				graphQLErrors.forEach(({ message, locations, path }) => {
					console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
					if (isMutation && !message.includes('input')) sweetErrorAlert(message);
				});
			}

			if (networkError) console.error(`[Network error]: ${networkError}`);
		});

		/**
		 * The backend exposes no GraphQL subscriptions. Realtime chat and notification
		 * events are delivered by the dedicated /realtime WebSocket gateway, driven by
		 * libs/realtime/realtimeClient.ts, so Apollo stays HTTP-only here.
		 */
		return from([errorLink, tokenRefreshLink, authLink.concat(link)]);
	}
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
