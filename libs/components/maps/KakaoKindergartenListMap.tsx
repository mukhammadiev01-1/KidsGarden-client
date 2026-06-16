import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KAKAO_MAP_JS_KEY } from '../../config';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { loadKakaoMapSdk } from '../../utils/kakaoMapLoader';

declare global {
	interface Window {
		kakao?: any;
	}
}

interface ValidMapKindergarten {
	_id: string;
	title: string;
	address?: string;
	latitude: number;
	longitude: number;
}

interface KakaoKindergartenListMapProps {
	kindergartens: Kindergarten[];
}

const isDevelopment = process.env.NODE_ENV !== 'production';

const toCoordinate = (value?: number | string | null): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
};

const isValidLatitude = (value: number): boolean => value >= -90 && value <= 90;
const isValidLongitude = (value: number): boolean => value >= -180 && value <= 180;

const getFallbackText = (reason: string): string => {
	if (reason === 'no coordinates') return 'No map locations available yet.';
	if (!isDevelopment) return 'Map is unavailable.';
	return `Map is unavailable (${reason}).`;
};

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const KakaoKindergartenListMap = ({ kindergartens }: KakaoKindergartenListMapProps) => {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const [fallbackText, setFallbackText] = useState<string>('');
	const [mapReady, setMapReady] = useState<boolean>(false);

	const validKindergartens = useMemo<ValidMapKindergarten[]>(() => {
		return kindergartens
			.map((kindergarten) => {
				const latitude = toCoordinate(kindergarten.kindergartenLatitude);
				const longitude = toCoordinate(kindergarten.kindergartenLongitude);

				if (
					latitude === null ||
					longitude === null ||
					!isValidLatitude(latitude) ||
					!isValidLongitude(longitude)
				) {
					return null;
				}

				return {
					_id: kindergarten._id,
					title: kindergarten.kindergartenTitle || 'Kindergarten',
					address: kindergarten.kindergartenAddress || kindergarten.kindergartenLocation,
					latitude,
					longitude,
				};
			})
			.filter(Boolean) as ValidMapKindergarten[];
	}, [kindergartens]);

	useEffect(() => {
		let disposed = false;

		const renderMap = async () => {
			if (!validKindergartens.length) {
				setMapReady(false);
				setFallbackText(getFallbackText('no coordinates'));
				return;
			}

			if (!KAKAO_MAP_JS_KEY) {
				setMapReady(false);
				setFallbackText(getFallbackText('missing key'));
				return;
			}

			try {
				await loadKakaoMapSdk();
				if (disposed || !mapRef.current || !window.kakao?.maps) return;

				const first = validKindergartens[0];
				const map = new window.kakao.maps.Map(mapRef.current, {
					center: new window.kakao.maps.LatLng(first.latitude, first.longitude),
					level: validKindergartens.length > 1 ? 7 : 4,
				});
				const bounds = new window.kakao.maps.LatLngBounds();
				let openInfoWindow: any = null;

				validKindergartens.forEach((kindergarten) => {
					const position = new window.kakao.maps.LatLng(kindergarten.latitude, kindergarten.longitude);
					bounds.extend(position);

					const marker = new window.kakao.maps.Marker({
						map,
						position,
						title: kindergarten.title,
					});
					const detailHref = `/kindergartens/detail?id=${encodeURIComponent(kindergarten._id)}`;
					const safeTitle = escapeHtml(kindergarten.title);
					const safeAddress = kindergarten.address ? escapeHtml(kindergarten.address) : '';
					const infoWindow = new window.kakao.maps.InfoWindow({
						content: `
							<div class="kg-list-map-info">
								<a href="${detailHref}">${safeTitle}</a>
								${safeAddress ? `<p>${safeAddress}</p>` : ''}
							</div>
						`,
					});

					window.kakao.maps.event.addListener(marker, 'click', () => {
						if (openInfoWindow) openInfoWindow.close();
						infoWindow.open(map, marker);
						openInfoWindow = infoWindow;
					});
				});

				if (validKindergartens.length > 1) map.setBounds(bounds);
				setMapReady(true);
				setFallbackText('');
			} catch (err) {
				if (!disposed) {
					setMapReady(false);
					const reason = err instanceof Error ? err.message : 'script load failed';
					setFallbackText(getFallbackText(reason));
				}
			}
		};

		renderMap();

		return () => {
			disposed = true;
		};
	}, [validKindergartens]);

	return (
		<div className="kg-list-map-shell">
			<div ref={mapRef} className="kg-list-map-canvas" aria-label="Kindergarten listing map" />
			{!mapReady && <div className="kg-list-map-fallback">{fallbackText || 'Loading map...'}</div>}
		</div>
	);
};

export default KakaoKindergartenListMap;
