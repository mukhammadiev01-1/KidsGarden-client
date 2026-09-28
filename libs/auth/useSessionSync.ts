import { useEffect } from 'react';
import { applyRemoteLogout, getJwtToken, updateUserInfo } from './index';

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
				if (token) updateUserInfo(token);
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);
};
