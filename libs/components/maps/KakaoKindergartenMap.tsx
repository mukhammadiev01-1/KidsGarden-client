import React, { useEffect, useRef, useState } from 'react';
import { KAKAO_MAP_JS_KEY } from '../../config';
import { loadKakaoMapSdk } from '../../utils/kakaoMapLoader';

declare global {
	interface Window {
		kakao?: any;
	}
}

interface KakaoKindergartenMapProps {
	latitude?: number | string | null;
	longitude?: number | string | null;
	title?: string;
	locationText?: string;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

const fallbackMessage = (reason: string, locationText?: string): string => {
	const baseText = locationText || 'Map location is unavailable.';
	return isDevelopment ? `${baseText} (${reason})` : baseText;
};

const toCoordinate = (value?: number | string | null): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
};

const KakaoKindergartenMap = ({ latitude, longitude, title, locationText }: KakaoKindergartenMapProps) => {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const [statusText, setStatusText] = useState<string>('Loading map...');
	const [mapReady, setMapReady] = useState<boolean>(false);

	useEffect(() => {
		let disposed = false;

		const renderMap = async () => {
			const parsedLatitude = toCoordinate(latitude);
			const parsedLongitude = toCoordinate(longitude);

			if (parsedLatitude === null || parsedLongitude === null) {
				setMapReady(false);
				setStatusText('Map location not set yet.');
				return;
			}

			if (!KAKAO_MAP_JS_KEY) {
				setMapReady(false);
				setStatusText(fallbackMessage('missing key', locationText));
				return;
			}

			try {
				await loadKakaoMapSdk();
				if (disposed || !mapRef.current || !window.kakao?.maps) return;

				const markerPosition = new window.kakao.maps.LatLng(parsedLatitude, parsedLongitude);
				const map = new window.kakao.maps.Map(mapRef.current, {
					center: markerPosition,
					level: 4,
				});

				new window.kakao.maps.Marker({
					map,
					position: markerPosition,
					title: title || 'Kindergarten location',
				});

				setMapReady(true);
				setStatusText(locationText || '');
			} catch (_err) {
				if (!disposed) {
					setMapReady(false);
					const reason = _err instanceof Error ? _err.message : 'script load failed';
					setStatusText(fallbackMessage(reason, locationText));
				}
			}
		};

		renderMap();

		return () => {
			disposed = true;
		};
	}, [latitude, longitude, title, locationText]);

	return (
		<>
			<div ref={mapRef} className="kg-detail-map-placeholder" aria-label={title || 'Kindergarten map'}>
				{!mapReady && <span></span>}
			</div>
			{statusText && <p className="kg-map-helper-text">{statusText}</p>}
		</>
	);
};

export default KakaoKindergartenMap;
