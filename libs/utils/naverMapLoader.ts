import { NAVER_MAPS_KEY_ID } from '../config';

declare global {
	interface Window {
		naver?: any;
		navermap_authFailure?: () => void;
	}
}

const NAVER_MAP_SCRIPT_ID = 'naver-map-sdk';

const hasNaverMaps = (): boolean => Boolean(window.naver?.maps);

export const loadNaverMapSdk = (): Promise<void> => {
	if (typeof window === 'undefined') return Promise.reject(new Error('NAVER Map is browser-only.'));
	if (!NAVER_MAPS_KEY_ID) return Promise.reject(new Error('missing key'));
	if (hasNaverMaps()) return Promise.resolve();

	return new Promise((resolve, reject) => {
		const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null;
		let settled = false;

		const finish = () => {
			if (settled) return;
			settled = true;

			if (hasNaverMaps()) resolve();
			else reject(new Error('naver maps unavailable'));
		};

		const fail = (message: string) => {
			if (settled) return;
			settled = true;
			reject(new Error(message));
		};

		window.navermap_authFailure = () => fail('naver map auth failed');

		if (existingScript) {
			if (existingScript.dataset.loaded === 'true' || hasNaverMaps()) {
				finish();
				return;
			}

			existingScript.addEventListener('load', finish, { once: true });
			existingScript.addEventListener('error', () => fail('script load failed'), { once: true });
			return;
		}

		const script = document.createElement('script');
		script.id = NAVER_MAP_SCRIPT_ID;
		script.async = true;
		script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_MAPS_KEY_ID)}`;
		script.onload = () => {
			script.dataset.loaded = 'true';
			finish();
		};
		script.onerror = () => fail('script load failed');
		document.head.appendChild(script);
	});
};
