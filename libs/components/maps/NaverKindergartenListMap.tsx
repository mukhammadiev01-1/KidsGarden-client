import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NAVER_MAPS_KEY_ID } from '../../config';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { loadNaverMapSdk } from '../../utils/naverMapLoader';

interface MapLocation {
	latitude: number;
	longitude: number;
}

interface ValidMapKindergarten {
	_id: string;
	title: string;
	address?: string;
	latitude: number;
	longitude: number;
}

interface NaverKindergartenListMapProps {
	kindergartens: Kindergarten[];
	userLocation?: MapLocation | null;
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

const NaverKindergartenListMap = ({ kindergartens, userLocation }: NaverKindergartenListMapProps) => {
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

			if (!NAVER_MAPS_KEY_ID) {
				setMapReady(false);
				setFallbackText(getFallbackText('missing key'));
				return;
			}

			try {
				await loadNaverMapSdk();
				if (disposed || !mapRef.current || !window.naver?.maps) return;

				const first = validKindergartens[0];
				const center = userLocation
					? new window.naver.maps.LatLng(userLocation.latitude, userLocation.longitude)
					: new window.naver.maps.LatLng(first.latitude, first.longitude);
				const map = new window.naver.maps.Map(mapRef.current, {
					center,
					zoom: validKindergartens.length > 1 ? 12 : 15,
				});
				const bounds = new window.naver.maps.LatLngBounds();
				let openInfoWindow: any = null;

				if (userLocation) {
					const userPosition = new window.naver.maps.LatLng(userLocation.latitude, userLocation.longitude);
					bounds.extend(userPosition);
					new window.naver.maps.Marker({
						map,
						position: userPosition,
						title: 'Your location',
						icon: {
							content: '<div class="kg-list-map-user-marker">You</div>',
							anchor: new window.naver.maps.Point(18, 18),
						},
					});
				}

				validKindergartens.forEach((kindergarten) => {
					const position = new window.naver.maps.LatLng(kindergarten.latitude, kindergarten.longitude);
					bounds.extend(position);

					const marker = new window.naver.maps.Marker({
						map,
						position,
						title: kindergarten.title,
					});
					const detailHref = `/kindergartens/detail?id=${encodeURIComponent(kindergarten._id)}`;
					const safeTitle = escapeHtml(kindergarten.title);
					const safeAddress = kindergarten.address ? escapeHtml(kindergarten.address) : '';
					const infoWindow = new window.naver.maps.InfoWindow({
						content: `
							<div class="kg-list-map-info">
								<a href="${detailHref}">${safeTitle}</a>
								${safeAddress ? `<p>${safeAddress}</p>` : ''}
							</div>
						`,
					});

					window.naver.maps.Event.addListener(marker, 'click', () => {
						if (openInfoWindow) openInfoWindow.close();
						infoWindow.open(map, marker);
						openInfoWindow = infoWindow;
					});
				});

				if (validKindergartens.length > 1 || userLocation) map.fitBounds(bounds);
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
	}, [validKindergartens, userLocation]);

	return (
		<div className="kg-list-map-shell">
			<div ref={mapRef} className="kg-list-map-canvas" aria-label="Kindergarten listing map" />
			{!mapReady && <div className="kg-list-map-fallback">{fallbackText || 'Loading map...'}</div>}
		</div>
	);
};

export default NaverKindergartenListMap;
