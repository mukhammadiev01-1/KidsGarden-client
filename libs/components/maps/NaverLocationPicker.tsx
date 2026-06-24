import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NAVER_MAPS_KEY_ID } from '../../config';
import { loadNaverMapSdk } from '../../utils/naverMapLoader';

interface MapLocation {
	latitude: number;
	longitude: number;
}

interface NaverLocationPickerProps {
	latitude?: number | string | null;
	longitude?: number | string | null;
	address?: string;
	title?: string;
	onChange: (location: MapLocation) => void;
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const GWANGJU_FALLBACK_CENTER: MapLocation = {
	latitude: 35.1595,
	longitude: 126.8526,
};
const FALLBACK_ZOOM = 12;
const SELECTED_LOCATION_ZOOM = 16;
const MIN_USEFUL_ZOOM = 7;

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
const isValidCoordinates = (latitude: number, longitude: number): boolean =>
	Number.isFinite(latitude) && Number.isFinite(longitude) && isValidLatitude(latitude) && isValidLongitude(longitude);
const isValidLocation = (latitude?: number | string | null, longitude?: number | string | null): MapLocation | null => {
	const parsedLatitude = toCoordinate(latitude);
	const parsedLongitude = toCoordinate(longitude);

	if (
		parsedLatitude === null ||
		parsedLongitude === null ||
		!isValidLatitude(parsedLatitude) ||
		!isValidLongitude(parsedLongitude)
	) {
		return null;
	}

	return {
		latitude: parsedLatitude,
		longitude: parsedLongitude,
	};
};

const getFallbackText = (reason: string, address?: string): string => {
	if (reason === 'no coordinates') {
		return address || 'Search the address or choose the center location on the map.';
	}
	if (!isDevelopment) return 'Map picker is unavailable.';
	return `Map picker is unavailable (${reason}).`;
};

const mapCanvasStyle: React.CSSProperties = {
	position: 'relative',
	width: '100%',
	minHeight: 260,
	overflow: 'hidden',
	border: '1px solid #dfe9d9',
	borderRadius: 16,
	background: 'linear-gradient(135deg, #f7fbf2 0%, #fffdf8 100%)',
};

const fallbackStyle: React.CSSProperties = {
	position: 'absolute',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 14,
	borderRadius: 16,
	color: '#6b7280',
	fontSize: 14,
	fontWeight: 700,
	textAlign: 'center',
	pointerEvents: 'none',
};

const NaverLocationPicker = ({ latitude, longitude, address, title, onChange }: NaverLocationPickerProps) => {
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapInstanceRef = useRef<any>(null);
	const markerRef = useRef<any>(null);
	const listenerRefs = useRef<any[]>([]);
	const onChangeRef = useRef(onChange);
	const [mapReady, setMapReady] = useState(false);
	const [statusText, setStatusText] = useState('Loading map...');

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	const getLocationFromPosition = useCallback((position: any): MapLocation | null => {
		const nextLatitude = typeof position?.lat === 'function' ? position.lat() : Number(position?.y);
		const nextLongitude = typeof position?.lng === 'function' ? position.lng() : Number(position?.x);

		if (!isValidCoordinates(nextLatitude, nextLongitude)) return null;

		return {
			latitude: nextLatitude,
			longitude: nextLongitude,
		};
	}, []);

	const moveMarker = useCallback(
		(position: any, options: { notify?: boolean; recenter?: boolean } = {}) => {
			const location = getLocationFromPosition(position);
			if (!location || !markerRef.current || !mapInstanceRef.current) return;

			markerRef.current.setPosition(position);
			if (options.recenter !== false) mapInstanceRef.current.setCenter(position);
			if (options.notify) onChangeRef.current(location);
		},
		[getLocationFromPosition],
	);

	useEffect(() => {
		let disposed = false;

		const renderMap = async () => {
			if (!NAVER_MAPS_KEY_ID) {
				setMapReady(false);
				setStatusText(getFallbackText('missing key', address));
				return;
			}

			try {
				await loadNaverMapSdk();
				if (disposed || !mapContainerRef.current || !window.naver?.maps) return;

				const selectedLocation = isValidLocation(latitude, longitude);
				const centerSource = selectedLocation || GWANGJU_FALLBACK_CENTER;
				const center = new window.naver.maps.LatLng(centerSource.latitude, centerSource.longitude);

				const map = new window.naver.maps.Map(mapContainerRef.current, {
					center,
					zoom: selectedLocation ? SELECTED_LOCATION_ZOOM : FALLBACK_ZOOM,
					minZoom: MIN_USEFUL_ZOOM,
				});
				const marker = new window.naver.maps.Marker({
					map,
					position: center,
					title: title || 'Kindergarten location',
					draggable: true,
				});

				mapInstanceRef.current = map;
				markerRef.current = marker;

				const clickListener = window.naver.maps.Event.addListener(map, 'click', (event: any) => {
					if (event?.coord) moveMarker(event.coord, { notify: true });
				});
				const dragListener = window.naver.maps.Event.addListener(marker, 'dragend', () => {
					moveMarker(marker.getPosition(), { notify: true });
				});
				listenerRefs.current = [clickListener, dragListener];

				setMapReady(true);
				setStatusText(
					selectedLocation
						? 'Marker selected. Drag it or click the map to adjust the center location.'
						: 'Search the address or choose the center location on the map.',
				);
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
			listenerRefs.current.forEach((listener) => {
				try {
					window.naver?.maps?.Event?.removeListener(listener);
				} catch (_err) {
					// NAVER cleanup can run twice in React StrictMode.
				}
			});
			listenerRefs.current = [];
			if (markerRef.current) {
				try {
					markerRef.current.setMap(null);
				} catch (_err) {
					// Ignore stale SDK instances during route/category changes.
				}
			}
			markerRef.current = null;
			mapInstanceRef.current = null;
			if (mapContainerRef.current) {
				mapContainerRef.current.innerHTML = '';
			}
		};
	}, [moveMarker]);

	useEffect(() => {
		if (!mapReady || !window.naver?.maps || !mapInstanceRef.current || !markerRef.current) return;

		const selectedLocation = isValidLocation(latitude, longitude);
		if (!selectedLocation) return;

		const nextPosition = new window.naver.maps.LatLng(selectedLocation.latitude, selectedLocation.longitude);
		moveMarker(nextPosition, { recenter: true });
		setStatusText('Marker selected. Drag it or click the map to adjust the center location.');
	}, [latitude, longitude, mapReady, moveMarker]);

	return (
		<div className="kg-location-picker" style={{ position: 'relative', width: '100%' }}>
			<div
				ref={mapContainerRef}
				className="kg-location-picker-map"
				style={mapCanvasStyle}
				aria-label={title || 'Kindergarten location picker'}
			/>
			{!mapReady && (
				<div className="kg-location-picker-fallback" style={fallbackStyle}>
					{statusText}
				</div>
			)}
			<p className="kg-location-picker-helper">{statusText}</p>
		</div>
	);
};

export default NaverLocationPicker;
