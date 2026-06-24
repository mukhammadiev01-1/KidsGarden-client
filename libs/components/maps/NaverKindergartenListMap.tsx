import React, { useEffect, useMemo, useRef, useState } from 'react';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
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
	searchLocation?: MapLocation | null;
	searchLocationLabel?: string;
	onLocateMe?: () => void;
	locateMeDisabled?: boolean;
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const GWANGJU_FALLBACK_CENTER = {
	latitude: 35.1595,
	longitude: 126.8526,
};
const KOREA_MAP_BOUNDS = {
	minLatitude: 33,
	maxLatitude: 39,
	minLongitude: 124,
	maxLongitude: 132,
};
const FALLBACK_ZOOM = 12;
const SINGLE_MARKER_ZOOM = 15;
const MIN_USEFUL_FIT_ZOOM = 7;

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
const isUsefulCoordinatePair = (latitude: number, longitude: number): boolean => !(latitude === 0 && longitude === 0);
const isSupportedKindergartenCoordinate = (latitude: number, longitude: number): boolean =>
	latitude >= KOREA_MAP_BOUNDS.minLatitude &&
	latitude <= KOREA_MAP_BOUNDS.maxLatitude &&
	longitude >= KOREA_MAP_BOUNDS.minLongitude &&
	longitude <= KOREA_MAP_BOUNDS.maxLongitude;
const isValidMapLocation = (location?: MapLocation | null): location is MapLocation => {
	if (!location) return false;
	const latitude = toCoordinate(location.latitude);
	const longitude = toCoordinate(location.longitude);

	return (
		latitude !== null &&
		longitude !== null &&
		isValidLatitude(latitude) &&
		isValidLongitude(longitude) &&
		isUsefulCoordinatePair(latitude, longitude)
	);
};

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

const NaverKindergartenListMap = ({
	kindergartens,
	userLocation,
	searchLocation,
	searchLocationLabel,
	onLocateMe,
	locateMeDisabled,
}: NaverKindergartenListMapProps) => {
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
					!isValidLongitude(longitude) ||
					!isUsefulCoordinatePair(latitude, longitude) ||
					!isSupportedKindergartenCoordinate(latitude, longitude)
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
		const markers: any[] = [];
		const infoWindows: any[] = [];
		const eventListeners: any[] = [];

		const renderMap = async () => {
			if (!NAVER_MAPS_KEY_ID) {
				setMapReady(false);
				setFallbackText(getFallbackText('missing key'));
				return;
			}

			try {
				await loadNaverMapSdk();
				if (disposed || !mapRef.current || !window.naver?.maps) return;

				mapRef.current.innerHTML = '';

				const safeUserLocation = isValidMapLocation(userLocation) ? userLocation : null;
				const safeSearchLocation = isValidMapLocation(searchLocation) ? searchLocation : null;
				const firstMarker = validKindergartens[0];
				const centerSource = safeUserLocation || safeSearchLocation || firstMarker || GWANGJU_FALLBACK_CENTER;
				const center = new window.naver.maps.LatLng(centerSource.latitude, centerSource.longitude);
				const map = new window.naver.maps.Map(mapRef.current, {
					center,
					zoom: firstMarker ? SINGLE_MARKER_ZOOM : FALLBACK_ZOOM,
					minZoom: MIN_USEFUL_FIT_ZOOM,
				});
				const bounds = new window.naver.maps.LatLngBounds();
				let boundsPointCount = 0;
				let openInfoWindow: any = null;

				const extendBounds = (position: any) => {
					bounds.extend(position);
					boundsPointCount += 1;
				};

				if (safeUserLocation) {
					const userPosition = new window.naver.maps.LatLng(safeUserLocation.latitude, safeUserLocation.longitude);
					extendBounds(userPosition);
					const userMarker = new window.naver.maps.Marker({
						map,
						position: userPosition,
						title: 'Your location',
						icon: {
							content: '<div class="kg-list-map-user-marker">You</div>',
							anchor: new window.naver.maps.Point(18, 18),
						},
					});
					markers.push(userMarker);
				}

				if (safeSearchLocation) {
					const searchPosition = new window.naver.maps.LatLng(safeSearchLocation.latitude, safeSearchLocation.longitude);
					extendBounds(searchPosition);
					const safeSearchLabel = escapeHtml(searchLocationLabel || 'Searched area');
					const searchMarker = new window.naver.maps.Marker({
						map,
						position: searchPosition,
						title: searchLocationLabel || 'Searched area',
						icon: {
							content: `<div class="kg-list-map-search-marker">${safeSearchLabel}</div>`,
							anchor: new window.naver.maps.Point(18, 18),
						},
					});
					markers.push(searchMarker);
				}

				validKindergartens.forEach((kindergarten) => {
					const position = new window.naver.maps.LatLng(kindergarten.latitude, kindergarten.longitude);
					extendBounds(position);

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
					markers.push(marker);
					infoWindows.push(infoWindow);

					const clickListener = window.naver.maps.Event.addListener(marker, 'click', () => {
						if (openInfoWindow) openInfoWindow.close();
						infoWindow.open(map, marker);
						openInfoWindow = infoWindow;
					});
					eventListeners.push(clickListener);
				});

				if (boundsPointCount > 1) {
					map.fitBounds(bounds);
					const nextZoom = map.getZoom?.();
					if (typeof nextZoom === 'number' && nextZoom < MIN_USEFUL_FIT_ZOOM) {
						map.setCenter(center);
						map.setZoom(FALLBACK_ZOOM);
					}
				} else if (boundsPointCount === 1) {
					map.setCenter(center);
					map.setZoom(firstMarker ? SINGLE_MARKER_ZOOM : FALLBACK_ZOOM);
				} else {
					map.setCenter(new window.naver.maps.LatLng(GWANGJU_FALLBACK_CENTER.latitude, GWANGJU_FALLBACK_CENTER.longitude));
					map.setZoom(FALLBACK_ZOOM);
				}
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
			eventListeners.forEach((listener) => {
				try {
					window.naver?.maps?.Event?.removeListener(listener);
				} catch (_err) {
					// Ignore stale SDK listeners during route/search changes.
				}
			});
			infoWindows.forEach((infoWindow) => {
				try {
					infoWindow.close();
				} catch (_err) {
					// Ignore stale SDK windows during route/search changes.
				}
			});
			markers.forEach((marker) => {
				try {
					marker.setMap(null);
				} catch (_err) {
					// Ignore stale SDK markers during route/search changes.
				}
			});
			if (mapRef.current) {
				mapRef.current.innerHTML = '';
			}
		};
	}, [validKindergartens, userLocation, searchLocation, searchLocationLabel]);

	return (
		<div className="kg-list-map-shell">
			<div ref={mapRef} className="kg-list-map-canvas" aria-label="Kindergarten listing map" />
			{onLocateMe && (
				<button
					type="button"
					className={`kg-map-locate-button ${isValidMapLocation(userLocation) ? 'active' : ''}`}
					onClick={onLocateMe}
					disabled={locateMeDisabled}
					aria-label="Use my current location"
					title="Use my current location"
				>
					<MyLocationRoundedIcon fontSize="small" />
				</button>
			)}
			{!mapReady && <div className="kg-list-map-fallback">{fallbackText || 'Loading map...'}</div>}
		</div>
	);
};

export default NaverKindergartenListMap;
