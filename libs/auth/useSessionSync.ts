import { useEffect } from 'react';
import { applyRemoteLogout, getJwtToken, updateUserInfo } from './index';
import { userVar } from '../../apollo/store';
import { initializeApollo } from '../../apollo/client';
import { realtimeClient } from '../realtime/realtimeClient';
import decodeJWT from 'jwt-decode';

/**
 * Keeps every open tab on the same session. updateStorage/deleteStorage have
 * written 'login' / 'logout' markers to localStorage since the start, but
 * nothing ever listened for them.
 */
export const useSessionSync = (): void => {
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const onStorage = (event: StorageEvent) => {
			if (event.key === 'logout') {
				applyRemoteLogout();
			} else if (event.key === 'login' || event.key === 'accessToken') {
				const token = getJwtToken();
				if (!token) return;
				const previousId = userVar()._id;
				updateUserInfo(token);
				// Someone signed in as a *different* member in another tab: drop the
				// previous member's cached data and re-authenticate the socket.
				const nextId = decodeJWT<{ _id?: string }>(token)?._id ?? '';
				if (previousId && nextId && previousId !== nextId) {
					initializeApollo().resetStore().catch(() => undefined);
					realtimeClient.disconnect();
					realtimeClient.connect();
				}
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);
};
