import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { UPLOAD_IMAGE_MIME_TYPES, prepareImageForUpload } from '../common/imageUpload';
import { useLazyQuery, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { TFunction } from 'next-i18next';
import axios from 'axios';
import { CREATE_KINDERGARTEN, UPDATE_KINDERGARTEN } from '../../../apollo/user/mutation';
import { GEOCODE_KINDERGARTEN_ADDRESS, GET_OWNER_KINDERGARTENS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { Kindergarten, KindergartenAddressLocation } from '../../types/kindergarten/kindergarten';
import { KindergartenInput } from '../../types/kindergarten/kindergarten.input';
import { KindergartenUpdate } from '../../types/kindergarten/kindergarten.update';
import {
	KindergartenLocation,
	KindergartenStatus,
	KindergartenType,
	MANAGE_KINDERGARTEN_TYPES,
} from '../../enums/kindergarten.enum';
import { MemberType } from '../../enums/member.enum';
import { getImageUrl, REACT_APP_API_GRAPHQL_URL } from '../../config';
import { getKindergartenTypeLabel } from '../../utils';
import { getJwtToken } from '../../auth';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { getStatusChipSx, getStatusLabel } from './dashboardUtils';
import NaverLocationPicker from '../maps/NaverLocationPicker';

const emptyForm: KindergartenInput = {
	kindergartenType: KindergartenType.PRIVATE_KINDERGARTEN,
	kindergartenLocation: KindergartenLocation.SEOUL,
	kindergartenAddress: '',
	kindergartenTitle: '',
	monthlyFee: 0,
	kindergartenCapacity: 1,
	kindergartenAgeRange: 1,
	kindergartenPrograms: 1,
	kindergartenImages: [],
	kindergartenDesc: '',
};

const maxKindergartenImages = 10;

const numericInputValue = (value?: number | null): number | '' => (typeof value === 'number' ? value : '');

const parseNumericInput = (value: string): number | undefined => {
	if (value === '') return undefined;

	const parsedValue = Number(value);
	return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const validateCoordinates = (t: TFunction, latitude?: number, longitude?: number): void => {
	const hasLatitude = typeof latitude === 'number';
	const hasLongitude = typeof longitude === 'number';

	if (hasLatitude !== hasLongitude) {
		throw new Error(t('mypageText.MyKindergarten.enterBothCoordinates'));
	}

	if (hasLatitude && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
		throw new Error(t('mypageText.MyKindergarten.latitudeRange'));
	}

	if (hasLongitude && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
		throw new Error(t('mypageText.MyKindergarten.longitudeRange'));
	}
};

const normalizeKindergartenTypeValue = (type: KindergartenType): KindergartenType => {
	switch (type) {
		case KindergartenType.APARTMENT:
			return KindergartenType.PRIVATE_KINDERGARTEN;
		case KindergartenType.VILLA:
			return KindergartenType.PUBLIC_KINDERGARTEN;
		case KindergartenType.HOUSE:
			return KindergartenType.DAYCARE_CENTER;
		default:
			return type;
	}
};

const MyKindergarten = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedId, setSelectedId] = useState<string>('');
	const [form, setForm] = useState<KindergartenInput>(emptyForm);
	const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');
	const [addressSearchLoading, setAddressSearchLoading] = useState<boolean>(false);
	const [addressSearchMessage, setAddressSearchMessage] = useState<string>('');
	const [addressSearchError, setAddressSearchError] = useState<boolean>(false);
	const [uploadingKindergartenImages, setUploadingKindergartenImages] = useState<boolean>(false);
	const [createKindergarten] = useMutation(CREATE_KINDERGARTEN);
	const [updateKindergarten] = useMutation(UPDATE_KINDERGARTEN);
	const [geocodeKindergartenAddress] = useLazyQuery<{ geocodeKindergartenAddress: KindergartenAddressLocation }>(
		GEOCODE_KINDERGARTEN_ADDRESS,
		{
			fetchPolicy: 'network-only',
		},
	);

	const queryInput = useMemo(
		() => ({
			page: 1,
			limit: 20,
			sort: 'createdAt',
			search: {
				kindergartenStatus: KindergartenStatus.ACTIVE,
			},
		}),
		[],
	);

	const { data, loading, refetch } = useQuery(GET_OWNER_KINDERGARTENS, {
		variables: { input: queryInput },
		fetchPolicy: 'network-only',
		skip: user.memberType !== MemberType.KINDERGARTEN_ADMIN,
		onError: (err) => sweetErrorHandling(err).then(),
	});

	const kindergartens: Kindergarten[] = data?.getOwnerKindergartens?.list ?? [];

	const updateForm = (name: keyof KindergartenInput, value: any) => {
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const saveKindergartenImages = async (kindergartenImages: string[]) => {
		if (!selectedId) return;

		await updateKindergarten({
			variables: {
				input: {
					_id: selectedId,
					kindergartenImages,
				},
			},
		});
		await refetch();
	};

	const uploadKindergartenImages = async (
		event: React.ChangeEvent<HTMLInputElement>,
		mode: 'main' | 'gallery' = 'gallery',
	) => {
		try {
			const selectedFiles = Array.from(event.target.files ?? []);
			if (!selectedFiles.length) return;
			if (selectedFiles.length > maxKindergartenImages) {
				throw new Error(t('mypageText.MyKindergarten.uploadLimit', { count: maxKindergartenImages }));
			}
			if (mode === 'main' && selectedFiles.length > 1) {
				throw new Error(t('mypageText.MyKindergarten.chooseOneMainImage'));
			}
			// The accept attribute only filters the dialog; check what was actually
			// chosen so a bad file is refused here instead of silently dropped by
			// the server-side uploader.
			for (const file of selectedFiles) {
				if (!UPLOAD_IMAGE_MIME_TYPES.includes(file.type)) throw new Error(t('mypageText.MyKindergarten.invalidImageType', { name: file.name }));
			}
			// Large photos are downscaled rather than refused (the API accepts them).
			const files = await Promise.all(selectedFiles.map(prepareImageForUpload));

			setUploadingKindergartenImages(true);

			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
						imagesUploader(files: $files, target: $target)
					}`,
					variables: {
						files: files.map(() => null),
						target: 'kindergarten',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify(
					files.reduce<Record<string, string[]>>((acc, _file, index) => {
						acc[`${index}`] = [`variables.files.${index}`];
						return acc;
					}, {}),
				),
			);
			files.forEach((file, index) => formData.append(`${index}`, file));

			const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${getJwtToken()}`,
				},
			});

			const responseImages: string[] = response.data?.data?.imagesUploader ?? [];
			if (!responseImages.length) throw new Error(t('article.imageUploadFailed'));

			const currentImages = form.kindergartenImages ?? [];
			const nextImages =
				mode === 'main'
					? [responseImages[0], ...currentImages.slice(1)].slice(0, maxKindergartenImages)
					: [...currentImages, ...responseImages].slice(0, maxKindergartenImages);

			setForm((prev) => ({
				...prev,
				kindergartenImages: nextImages,
			}));

			await saveKindergartenImages(nextImages);
			await sweetMixinSuccessAlert(selectedId ? t('mypageText.MyKindergarten.photosUpdated') : t('mypageText.MyKindergarten.photosAdded'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setUploadingKindergartenImages(false);
			// Always reset, so re-selecting the same file after an error fires onChange.
			event.target.value = '';
		}
	};

	const removeKindergartenImage = async (index: number) => {
		try {
			const nextImages = (form.kindergartenImages ?? []).filter((_image, imageIndex) => imageIndex !== index);
			setForm((prev) => ({
				...prev,
				kindergartenImages: nextImages,
			}));
			await saveKindergartenImages(nextImages);
			if (selectedId) await sweetMixinSuccessAlert(t('mypageText.MyKindergarten.photoRemoved'));
		} catch (err) {
			await sweetErrorHandling(err);
		}
	};

	const selectKindergarten = (kindergarten: Kindergarten) => {
		setSelectedId(kindergarten._id);
		setForm({
			kindergartenType: normalizeKindergartenTypeValue(kindergarten.kindergartenType),
			kindergartenLocation: kindergarten.kindergartenLocation,
			kindergartenAddress: kindergarten.kindergartenAddress,
			kindergartenTitle: kindergarten.kindergartenTitle,
			monthlyFee: kindergarten.monthlyFee ?? kindergarten.kindergartenPrice ?? 0,
			kindergartenCapacity: kindergarten.kindergartenCapacity,
			kindergartenAgeRange: kindergarten.kindergartenAgeRange,
			kindergartenPrograms: kindergarten.kindergartenPrograms,
			kindergartenImages: kindergarten.kindergartenImages ?? [],
			kindergartenDesc: kindergarten.kindergartenDesc ?? '',
			kindergartenLatitude: kindergarten.kindergartenLatitude,
			kindergartenLongitude: kindergarten.kindergartenLongitude,
			establishedAt: kindergarten.establishedAt,
		});
		setAddressSearchQuery(kindergarten.kindergartenAddress || '');
		setAddressSearchMessage('');
		setAddressSearchError(false);
	};

	const resetForm = () => {
		setSelectedId('');
		setForm(emptyForm);
		setAddressSearchQuery('');
		setAddressSearchMessage('');
		setAddressSearchError(false);
	};

	const searchAddress = async () => {
		const query = (addressSearchQuery || form.kindergartenAddress || '').trim();

		if (!query) {
			setAddressSearchMessage(t('mypageText.MyKindergarten.enterAddressToSearch'));
			setAddressSearchError(true);
			return;
		}

		if (query.length > 200) {
			setAddressSearchMessage(t('mypageText.MyKindergarten.addressTooLong'));
			setAddressSearchError(true);
			return;
		}

		try {
			setAddressSearchLoading(true);
			setAddressSearchMessage('');
			setAddressSearchError(false);
			const { data: geocodeData } = await geocodeKindergartenAddress({
				variables: {
					address: query,
				},
			});
			const result = geocodeData?.geocodeKindergartenAddress;
			if (!result) throw new Error(t('mypageText.MyKindergarten.addressNotFound'));

			const resolvedAddress = result.roadAddress || result.address || result.jibunAddress || query;
			setForm((prev) => ({
				...prev,
				kindergartenAddress: resolvedAddress,
				kindergartenLatitude: result.latitude,
				kindergartenLongitude: result.longitude,
			}));
			setAddressSearchQuery(resolvedAddress);
			setAddressSearchMessage(t('mypageText.MyKindergarten.addressSelected'));
			setAddressSearchError(false);
		} catch (err: any) {
			const fallbackMessage = t('mypageText.MyKindergarten.addressNotFound');
			const errorMessage = err?.message && err.message !== 'Bad Request' ? err.message : fallbackMessage;
			setAddressSearchMessage(errorMessage);
			setAddressSearchError(true);
		} finally {
			setAddressSearchLoading(false);
		}
	};

	const updateLocationFromMap = useCallback(({ latitude, longitude }: { latitude: number; longitude: number }) => {
		setForm((prev) => ({
			...prev,
			kindergartenLatitude: latitude,
			kindergartenLongitude: longitude,
		}));
		setAddressSearchMessage(t('mypageText.MyKindergarten.markerUpdated'));
		setAddressSearchError(false);
	}, [t]);

	const submitKindergarten = async () => {
		try {
			if (!form.kindergartenTitle?.trim() || !form.kindergartenAddress?.trim() || !form.kindergartenDesc?.trim()) {
				throw new Error(t('mypageText.MyKindergarten.fillRequired'));
			}
			if (!form.kindergartenImages.length) {
				throw new Error(t('mypageText.MyKindergarten.uploadAtLeastOnePhoto'));
			}
			validateCoordinates(t, form.kindergartenLatitude, form.kindergartenLongitude);

			if (selectedId) {
				const input: KindergartenUpdate = { _id: selectedId, ...form };
				delete input.kindergartenPrice;
				await updateKindergarten({ variables: { input } });
				await sweetMixinSuccessAlert(t('mypageText.MyKindergarten.profileUpdated'));
			} else {
				const input: KindergartenInput = { ...form };
				delete input.kindergartenPrice;
				await createKindergarten({ variables: { input } });
				await sweetMixinSuccessAlert(t('mypageText.MyKindergarten.profileCreated'));
			}

			resetForm();
			await refetch();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	// Role guard. Navigating during render (router.back() in the component
	// body) is a side effect React may run twice under StrictMode; do it in an
	// effect and render nothing meanwhile.
	const roleAllowed = !(user.memberType !== MemberType.KINDERGARTEN_ADMIN);
	useEffect(() => {
		if (!roleAllowed) router.back();
	}, [roleAllowed, router]);
	if (!roleAllowed) return null;

	return (
		<Stack className="admin-dashboard-screen admin-kindergarten-profile-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>{t('mypage.menu.myKindergarten')}</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					{t('mypageText.MyKindergarten.subtitle')}
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{t('mypageText.MyKindergarten.ownedCenters')}</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.MyKindergarten.ownedCentersSubtitle')}
						</Typography>
					</Stack>
					<Chip
						label={kindergartens.length === 1 ? t('mypageText.MyKindergarten.profileCountOne') : t('mypageText.MyKindergarten.profileCount', { count: kindergartens.length })}
						size="small"
						className="dashboard-count-chip"
					/>
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>{t('mypageText.MyKindergarten.loadingKindergartens')}</Typography>}
				{!loading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						{t('mypageText.MyKindergarten.noProfileYet')}
					</Typography>
				)}
				{kindergartens.map((kindergarten) => (
					<Stack
						key={kindergarten._id}
						className={`admin-selector-card ${selectedId === kindergarten._id ? 'is-selected' : ''}`}
						direction={'row'}
						spacing={2}
						alignItems={'center'}
					>
						<img loading="lazy"
							src={getImageUrl(kindergarten.kindergartenImages?.[0])}
							alt={kindergarten.kindergartenTitle}
							className="admin-selector-card-image"
						/>
						<Stack className="admin-selector-card-content">
							<Stack className="admin-selector-card-title-row">
								<Stack>
									<Typography className="dashboard-primary-text">{kindergarten.kindergartenTitle}</Typography>
								</Stack>
								<Chip
									label={getStatusLabel(kindergarten.kindergartenStatus)}
									size="small"
									sx={getStatusChipSx(kindergarten.kindergartenStatus)}
								/>
							</Stack>
							<Typography className="dashboard-muted-text">
								{getKindergartenTypeLabel(kindergarten.kindergartenType)} · {kindergarten.kindergartenLocation}
							</Typography>
							<Typography className="dashboard-muted-text">{kindergarten.kindergartenAddress}</Typography>
							<Stack className="admin-center-card-details">
								<Stack className="admin-meta-item">
									<Typography className="admin-meta-label">{t('adminTables.capacity')}</Typography>
									<Typography className="admin-meta-value">{kindergarten.kindergartenCapacity}</Typography>
								</Stack>
								<Stack className="admin-meta-item">
									<Typography className="admin-meta-label">{t('adminTables.ageRange')}</Typography>
									<Typography className="admin-meta-value">{kindergarten.kindergartenAgeRange}</Typography>
								</Stack>
								<Stack className="admin-meta-item">
									<Typography className="admin-meta-label">{t('adminTables.programs')}</Typography>
									<Typography className="admin-meta-value">{kindergarten.kindergartenPrograms}</Typography>
								</Stack>
							</Stack>
						</Stack>
						<Button variant="outlined" onClick={() => selectKindergarten(kindergarten)}>
							{t('common.edit')}
						</Button>
					</Stack>
				))}
			</Stack>

			<Stack className="dashboard-panel admin-profile-form-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
							{selectedId ? t('mypageText.MyKindergarten.editProfile') : t('mypageText.MyKindergarten.createProfile')}
						</Typography>
						<Typography className="dashboard-panel-subtitle">
							{t('mypageText.MyKindergarten.formSubtitle')}
						</Typography>
					</Stack>
					{selectedId && (
						<Button variant="text" onClick={resetForm}>
							{t('mypageText.MyKindergarten.newProfile')}
						</Button>
					)}
				</Stack>

				<Typography className="admin-form-section-title">{t('mypageText.MyKindergarten.basicInformation')}</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label={t('mypageText.MyKindergarten.kindergartenName')}
						value={form.kindergartenTitle ?? ''}
						onChange={(e) => updateForm('kindergartenTitle', e.target.value)}
					/>
					<TextField
						fullWidth
						label={t('adminTables.monthlyFee')}
						type="number"
						value={numericInputValue(form.monthlyFee)}
						onChange={(e) => updateForm('monthlyFee', parseNumericInput(e.target.value))}
					/>
				</Stack>

				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						SelectProps={{ native: true }}
						label={t('Center type')}
						value={form.kindergartenType ?? KindergartenType.PRIVATE_KINDERGARTEN}
						onChange={(e) => updateForm('kindergartenType', e.target.value as KindergartenType)}
					>
						{MANAGE_KINDERGARTEN_TYPES.map((type) => (
							<option key={type} value={type}>
								{getKindergartenTypeLabel(type)}
							</option>
						))}
					</TextField>
					<TextField
						fullWidth
						select
						SelectProps={{ native: true }}
						label={t('common.location')}
						value={form.kindergartenLocation ?? KindergartenLocation.SEOUL}
						onChange={(e) => updateForm('kindergartenLocation', e.target.value as KindergartenLocation)}
					>
						{Object.values(KindergartenLocation).map((location) => (
							<option key={location} value={location}>
								{location}
							</option>
						))}
					</TextField>
				</Stack>

				<TextField
					fullWidth
					label={t('profile.address')}
					value={form.kindergartenAddress ?? ''}
					onChange={(e) => {
						updateForm('kindergartenAddress', e.target.value);
						setAddressSearchQuery(e.target.value);
					}}
				/>

				<Stack className="admin-address-search-block" spacing={1}>
					<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
						<TextField
							fullWidth
							label={t('mypageText.MyKindergarten.searchAddress')}
							value={addressSearchQuery}
							onChange={(e) => setAddressSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									searchAddress().then();
								}
							}}
							placeholder={t('mypageText.MyKindergarten.searchAddress')}
						/>
						<Button
							variant="outlined"
							onClick={searchAddress}
							disabled={addressSearchLoading}
							sx={{ minWidth: { xs: '100%', md: 160 } }}
						>
							{addressSearchLoading ? t('kindergartens.searching') : t('mypageText.MyKindergarten.searchAddress')}
						</Button>
					</Stack>
					<Typography className="dashboard-muted-text">
						{t('mypageText.MyKindergarten.addressSearchHint')}
					</Typography>
					{addressSearchMessage && (
						<Typography className="dashboard-muted-text" sx={{ color: addressSearchError ? '#b42318' : '#2f7d4a' }}>
							{addressSearchMessage}
						</Typography>
					)}
				</Stack>

				<Typography className="admin-form-section-title">{t('mypageText.MyKindergarten.locationOnMap')}</Typography>
				<Stack className="admin-location-map-section" spacing={0.75}>
					<NaverLocationPicker
						latitude={form.kindergartenLatitude}
						longitude={form.kindergartenLongitude}
						address={form.kindergartenAddress}
						title={form.kindergartenTitle || t('map.kindergartenLocation')}
						onChange={updateLocationFromMap}
					/>
				</Stack>

				<Typography className="admin-form-section-title">{t('mypageText.MyKindergarten.centerDetails')}</Typography>
				<Stack className="admin-form-grid admin-center-details-grid" direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
					<TextField
						fullWidth
						label={t('adminTables.capacity')}
						type="number"
						value={numericInputValue(form.kindergartenCapacity)}
						onChange={(e) => updateForm('kindergartenCapacity', parseNumericInput(e.target.value))}
					/>
					<TextField
						fullWidth
						label={t('adminTables.ageRange')}
						type="number"
						value={numericInputValue(form.kindergartenAgeRange)}
						onChange={(e) => updateForm('kindergartenAgeRange', parseNumericInput(e.target.value))}
					/>
					<TextField
						fullWidth
						label={t('adminTables.programs')}
						type="number"
						value={numericInputValue(form.kindergartenPrograms)}
						onChange={(e) => updateForm('kindergartenPrograms', parseNumericInput(e.target.value))}
					/>
				</Stack>

				<TextField
					className="kindergarten-description-field"
					fullWidth
					multiline
					minRows={4}
					label={t('mypageText.MyKindergarten.description')}
					value={form.kindergartenDesc ?? ''}
					onChange={(e) => updateForm('kindergartenDesc', e.target.value)}
				/>

				<Typography className="admin-form-section-title">{t('mypageText.MyKindergarten.photos')}</Typography>
				<Stack spacing={1.5}>
					<Stack
						className="admin-photo-actions"
						direction={{ xs: 'column', sm: 'row' }}
						spacing={1.5}
						alignItems={{ xs: 'stretch', sm: 'center' }}
					>
						<Button
							variant="outlined"
							component="label"
							disabled={uploadingKindergartenImages}
							sx={{ width: { xs: '100%', sm: 'fit-content' } }}
						>
							{uploadingKindergartenImages ? t('profile.uploading') : t('mypageText.MyKindergarten.changeMainImage')}
							<input
								type="file"
								hidden
								accept="image/jpg, image/jpeg, image/png, image/webp"
								onChange={(event) => uploadKindergartenImages(event, 'main')}
							/>
						</Button>
						<Button
							variant="outlined"
							component="label"
							disabled={uploadingKindergartenImages}
							sx={{ width: { xs: '100%', sm: 'fit-content' } }}
						>
							{uploadingKindergartenImages ? t('profile.uploading') : t('mypageText.MyKindergarten.addGalleryImages')}
							<input
								type="file"
								hidden
								multiple
								accept="image/jpg, image/jpeg, image/png, image/webp"
								onChange={(event) => uploadKindergartenImages(event, 'gallery')}
							/>
						</Button>
						<Typography className="dashboard-muted-text">
							{t('mypageText.MyKindergarten.photosHint', { count: maxKindergartenImages })}
						</Typography>
					</Stack>

					{form.kindergartenImages.length > 0 && (
						<Stack direction="row" flexWrap="wrap" gap={1.5}>
							{form.kindergartenImages.map((image, index) => (
								<Stack
									key={`${image}-${index}`}
									spacing={1}
									sx={{
										width: 152,
										padding: '8px',
										border: '1px solid #d9e5dc',
										borderRadius: '12px',
										background: '#f8fbf7',
									}}
								>
									<img loading="lazy"
										src={getImageUrl(image)}
										alt={t('mypageText.MyKindergarten.photoAlt', { index: index + 1 })}
										style={{ width: '100%', height: 92, objectFit: 'cover', borderRadius: 10 }}
									/>
									<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
										<Chip label={index === 0 ? t('mypageText.MyKindergarten.main') : t('mypageText.MyKindergarten.gallery', { index: index + 1 })} size="small" color={index === 0 ? 'success' : 'default'} />
										<Button
											size="small"
											color="error"
											disabled={uploadingKindergartenImages}
											onClick={() => removeKindergartenImage(index)}
										>
											{t('messages.remove')}
										</Button>
									</Stack>
								</Stack>
							))}
						</Stack>
					)}
				</Stack>

				<Stack className="admin-form-actions">
					<Button variant="contained" onClick={submitKindergarten} sx={{ width: 'fit-content' }}>
						{selectedId ? t('mypageText.MyKindergarten.updateKindergarten') : t('mypageText.MyKindergarten.createKindergarten')}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default MyKindergarten;
