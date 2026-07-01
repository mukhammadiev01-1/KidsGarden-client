import React, { useEffect, useRef, useState } from 'react';
import { NAVER_MAPS_KEY_ID } from '../../config';
import { loadNaverMapSdk } from '../../utils/naverMapLoader';
import { useTranslation } from 'next-i18next';

interface NaverKindergartenMapProps {
	latitude?: number | string | null;
	longitude?: number | string | null;
	address?: string;
	title?: string;
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

const getFallbackText = (reason: string, t: (key: string) => string, address?: string): string => {
	if (reason === 'no coordinates') return `${t('map.locationSoon')}${address ? ` ${address}` : ''}`;
	if (!isDevelopment) return address || t('map.locationSoon');
	return `${address || t('map.locationSoon')} (${reason})`;
};

const NaverKindergartenMap = ({ latitude, longitude, address, title }: NaverKindergartenMapProps) => {
	const { t } = useTranslation('common');
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const markerRef = useRef<any>(null);
	const mapInstanceRef = useRef<any>(null);
	const [mapReady, setMapReady] = useState(false);
	const [statusText, setStatusText] = useState<string>(String(t('map.loading')));

	useEffect(() => {
		let disposed = false;

		const renderMap = async () => {
			const parsedLatitude = toCoordinate(latitude);
			const parsedLongitude = toCoordinate(longitude);

			if (
				parsedLatitude === null ||
				parsedLongitude === null ||
				!isValidLatitude(parsedLatitude) ||
				!isValidLongitude(parsedLongitude)
			) {
				setMapReady(false);
				setStatusText(getFallbackText('no coordinates', t, address));
				return;
			}

			if (!NAVER_MAPS_KEY_ID) {
				setMapReady(false);
				setStatusText(getFallbackText('missing key', t, address));
				return;
			}

			try {
				await loadNaverMapSdk();
				if (disposed || !mapContainerRef.current || !window.naver?.maps) return;

				const markerPosition = new window.naver.maps.LatLng(parsedLatitude, parsedLongitude);
				mapContainerRef.current.innerHTML = '';
				const map = new window.naver.maps.Map(mapContainerRef.current, {
					center: markerPosition,
					zoom: 16,
				});

				const marker = new window.naver.maps.Marker({
					position: markerPosition,
					map,
					title: title || t('map.kindergartenLocation'),
				});

				mapInstanceRef.current = map;
				markerRef.current = marker;
				setMapReady(true);
				setStatusText(address || '');
			} catch (err) {
				if (!disposed) {
					const reason = err instanceof Error ? err.message : 'script load failed';
					setMapReady(false);
					setStatusText(getFallbackText(reason, t, address));
				}
			}
		};

		renderMap();

		return () => {
			disposed = true;
			if (markerRef.current) {
				try {
					markerRef.current.setMap(null);
				} catch (_err) {
					// Ignore stale SDK instances during route changes.
				}
			}
			markerRef.current = null;
			mapInstanceRef.current = null;
			if (mapContainerRef.current) {
				mapContainerRef.current.innerHTML = '';
			}
		};
	}, [latitude, longitude, address, title, t]);

	return (
		<>
			<div ref={mapContainerRef} className="kg-detail-map-placeholder" aria-label={title || t('map.detailAria')} />
			{statusText && <p className="kg-map-helper-text">{statusText}</p>}
		</>
	);
};

export default NaverKindergartenMap;
