import { KAKAO_MAP_JS_KEY } from '../config';

declare global {
	interface Window {
		kakao?: any;
	}
}

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';

interface LoadKakaoMapSdkOptions {
	services?: boolean;
}

const hasRequestedLibraries = (script: HTMLScriptElement, options?: LoadKakaoMapSdkOptions): boolean => {
	if (!options?.services) return true;
	return script.dataset.services === 'true';
};

export const loadKakaoMapSdk = (options?: LoadKakaoMapSdkOptions): Promise<void> => {
	if (typeof window === 'undefined') return Promise.reject(new Error('Kakao Map is browser-only.'));
	if (!KAKAO_MAP_JS_KEY) return Promise.reject(new Error('missing key'));
	if (window.kakao?.maps && (!options?.services || window.kakao.maps.services)) return Promise.resolve();

	return new Promise((resolve, reject) => {
		const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;

		const handleLoaded = () => {
			if (window.kakao?.maps?.load) {
				window.kakao.maps.load(() => {
					if (options?.services && !window.kakao?.maps?.services) {
						reject(new Error('kakao services unavailable'));
						return;
					}
					resolve();
				});
				return;
			}

			if (window.kakao?.maps && (!options?.services || window.kakao.maps.services)) resolve();
			else reject(new Error('kakao maps unavailable'));
		};

		if (existingScript) {
			if (hasRequestedLibraries(existingScript, options)) {
				if (window.kakao?.maps || existingScript.dataset.loaded === 'true') {
					handleLoaded();
					return;
				}

				existingScript.addEventListener('load', handleLoaded, { once: true });
				existingScript.addEventListener('error', () => reject(new Error('script load failed')), { once: true });
				return;
			}

			existingScript.remove();
			window.kakao = undefined;
		}

		const script = document.createElement('script');
		script.id = KAKAO_MAP_SCRIPT_ID;
		script.async = true;
		script.dataset.services = options?.services ? 'true' : 'false';
		const libraries = options?.services ? '&libraries=services' : '';
		script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
			KAKAO_MAP_JS_KEY,
		)}&autoload=false${libraries}`;
		script.onload = () => {
			script.dataset.loaded = 'true';
			handleLoaded();
		};
		script.onerror = () => reject(new Error('script load failed'));
		document.head.appendChild(script);
	});
};
