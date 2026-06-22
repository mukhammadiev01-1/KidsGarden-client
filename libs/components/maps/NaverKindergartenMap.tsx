import React, { useEffect, useRef, useState } from 'react';
import { NAVER_MAPS_KEY_ID } from '../../config';
import { loadNaverMapSdk } from '../../utils/naverMapLoader';

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

const getFallbackText = (reason: string, address?: string): string => {
	if (reason === 'no coordinates') return `Map location will be added soon.${address ? ` ${address}` : ''}`;
	if (!isDevelopment) return address || 'Map location will be added soon.';
	return `${address || 'Map location will be added soon.'} (${reason})`;
};

const NaverKindergartenMap = ({ latitude, longitude, address, title }: NaverKindergartenMapProps) => {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const [mapReady, setMapReady] = useState(false);
	const [statusText, setStatusText] = useState('Loading map...');

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
				setStatusText(getFallbackText('no coordinates', address));
				return;
			}

			if (!NAVER_MAPS_KEY_ID) {
				setMapReady(false);
				setStatusText(getFallbackText('missing key', address));
				return;
			}

			try {
				await loadNaverMapSdk();
				if (disposed || !mapRef.current || !window.naver?.maps) return;

				const markerPosition = new window.naver.maps.LatLng(parsedLatitude, parsedLongitude);
				const map = new window.naver.maps.Map(mapRef.current, {
					center: markerPosition,
					zoom: 16,
				});

				new window.naver.maps.Marker({
					position: markerPosition,
					map,
					title: title || 'Kindergarten location',
				});

				setMapReady(true);
				setStatusText(address || '');
			} catch (err) {
				if (!disposed) {
					const reason = err instanceof Error ? err.message : 'script load failed';
					setMapReady(false);
					setStatusText(getFallbackText(reason, address));
				}
			}
		};

		renderMap();

		return () => {
			disposed = true;
		};
	}, [latitude, longitude, address, title]);

	return (
		<>
			<div ref={mapRef} className="kg-detail-map-placeholder" aria-label={title || 'Kindergarten map'}>
				{!mapReady && <span></span>}
			</div>
			{statusText && <p className="kg-map-helper-text">{statusText}</p>}
		</>
	);
};

export default NaverKindergartenMap;
