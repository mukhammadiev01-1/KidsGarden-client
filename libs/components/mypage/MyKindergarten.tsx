import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { CREATE_KINDERGARTEN, UPDATE_KINDERGARTEN } from '../../../apollo/user/mutation';
import { GET_OWNER_KINDERGARTENS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
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
import { getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';

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
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedId, setSelectedId] = useState<string>('');
	const [form, setForm] = useState<KindergartenInput>(emptyForm);
	const [uploadingKindergartenImages, setUploadingKindergartenImages] = useState<boolean>(false);
	const [createKindergarten] = useMutation(CREATE_KINDERGARTEN);
	const [updateKindergarten] = useMutation(UPDATE_KINDERGARTEN);

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
			const files = Array.from(event.target.files ?? []);
			if (!files.length) return;
			if (files.length > maxKindergartenImages) {
				throw new Error(`Please upload up to ${maxKindergartenImages} photos at once.`);
			}
			if (mode === 'main' && files.length > 1) {
				throw new Error('Please choose one main image.');
			}

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
			if (!responseImages.length) throw new Error('Image upload failed.');

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
			await sweetMixinSuccessAlert(selectedId ? 'Kindergarten photos updated' : 'Kindergarten photos added');
			event.target.value = '';
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setUploadingKindergartenImages(false);
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
			if (selectedId) await sweetMixinSuccessAlert('Kindergarten photo removed');
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
			establishedAt: kindergarten.establishedAt,
		});
	};

	const resetForm = () => {
		setSelectedId('');
		setForm(emptyForm);
	};

	const submitKindergarten = async () => {
		try {
			if (!form.kindergartenTitle || !form.kindergartenAddress || !form.kindergartenDesc) {
				throw new Error('Please fill title, address, and description.');
			}
			if (!form.kindergartenImages.length) {
				throw new Error('Please upload at least one kindergarten photo.');
			}

			if (selectedId) {
				const input: KindergartenUpdate = { _id: selectedId, ...form };
				delete input.kindergartenPrice;
				await updateKindergarten({ variables: { input } });
				await sweetMixinSuccessAlert('Kindergarten profile updated');
			} else {
				const input: KindergartenInput = { ...form };
				delete input.kindergartenPrice;
				await createKindergarten({ variables: { input } });
				await sweetMixinSuccessAlert('Kindergarten profile created');
			}

			resetForm();
			await refetch();
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (user.memberType !== MemberType.KINDERGARTEN_ADMIN) {
		router.back();
		return null;
	}

	return (
		<Stack className="admin-dashboard-screen admin-kindergarten-profile-dashboard" spacing={3} sx={{ width: '100%' }}>
			<Stack className="dashboard-page-header" spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>My Kindergarten</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Manage your kindergarten profile and basic center information.
				</Typography>
			</Stack>

			<Stack className="dashboard-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Owned centers</Typography>
						<Typography className="dashboard-panel-subtitle">
							Select a kindergarten to edit its public profile information.
						</Typography>
					</Stack>
					<Chip label={`${kindergartens.length} profile${kindergartens.length === 1 ? '' : 's'}`} size="small" className="dashboard-count-chip" />
				</Stack>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!loading && kindergartens.length === 0 && (
					<Typography className="dashboard-empty-state" sx={{ color: '#6b7280' }}>
						No kindergarten profile yet. Create the first center below.
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
						<img
							src={getImageUrl(kindergarten.kindergartenImages?.[0])}
							alt={kindergarten.kindergartenTitle}
							className="admin-selector-card-image"
						/>
						<Stack className="admin-selector-card-content">
							<Stack className="admin-selector-card-title-row">
								<Stack>
									<Typography className="dashboard-primary-text">{kindergarten.kindergartenTitle}</Typography>
									<Typography className="dashboard-muted-text">Profile ID {truncateId(kindergarten._id)}</Typography>
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
									<Typography className="admin-meta-label">Capacity</Typography>
									<Typography className="admin-meta-value">{kindergarten.kindergartenCapacity}</Typography>
								</Stack>
								<Stack className="admin-meta-item">
									<Typography className="admin-meta-label">Age range</Typography>
									<Typography className="admin-meta-value">{kindergarten.kindergartenAgeRange}</Typography>
								</Stack>
								<Stack className="admin-meta-item">
									<Typography className="admin-meta-label">Programs</Typography>
									<Typography className="admin-meta-value">{kindergarten.kindergartenPrograms}</Typography>
								</Stack>
							</Stack>
						</Stack>
						<Button variant="outlined" onClick={() => selectKindergarten(kindergarten)}>
							Edit
						</Button>
					</Stack>
				))}
			</Stack>

			<Stack className="dashboard-panel admin-profile-form-panel" spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack className="dashboard-panel-header">
					<Stack>
						<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
							{selectedId ? 'Edit kindergarten profile' : 'Create kindergarten profile'}
						</Typography>
						<Typography className="dashboard-panel-subtitle">
							Keep family-facing details current for discovery and review.
						</Typography>
					</Stack>
					{selectedId && (
						<Button variant="text" onClick={resetForm}>
							New profile
						</Button>
					)}
				</Stack>

				<Typography className="admin-form-section-title">Basic information</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label="Kindergarten name"
						value={form.kindergartenTitle}
						onChange={(e) => updateForm('kindergartenTitle', e.target.value)}
					/>
					<TextField
						fullWidth
						label="Monthly fee"
						type="number"
						value={form.monthlyFee}
						onChange={(e) => updateForm('monthlyFee', Number(e.target.value))}
					/>
				</Stack>

				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						select
						SelectProps={{ native: true }}
						label="Center type"
						value={form.kindergartenType}
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
						label="Location"
						value={form.kindergartenLocation}
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
					label="Address"
					value={form.kindergartenAddress}
					onChange={(e) => updateForm('kindergartenAddress', e.target.value)}
				/>

				<Typography className="admin-form-section-title">Center details</Typography>
				<Stack className="admin-form-grid" direction={{ xs: 'column', md: 'row' }} spacing={2}>
					<TextField
						fullWidth
						label="Capacity"
						type="number"
						value={form.kindergartenCapacity}
						onChange={(e) => updateForm('kindergartenCapacity', Number(e.target.value))}
					/>
					<TextField
						fullWidth
						label="Age range"
						type="number"
						value={form.kindergartenAgeRange}
						onChange={(e) => updateForm('kindergartenAgeRange', Number(e.target.value))}
					/>
					<TextField
						fullWidth
						label="Programs"
						type="number"
						value={form.kindergartenPrograms}
						onChange={(e) => updateForm('kindergartenPrograms', Number(e.target.value))}
					/>
				</Stack>

				<TextField
					fullWidth
					multiline
					minRows={4}
					label="Programs and center description"
					value={form.kindergartenDesc}
					onChange={(e) => updateForm('kindergartenDesc', e.target.value)}
				/>

				<Typography className="admin-form-section-title">Photos</Typography>
				<Stack spacing={1.5}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
						<Button
							variant="outlined"
							component="label"
							disabled={uploadingKindergartenImages}
							sx={{ width: { xs: '100%', sm: 'fit-content' } }}
						>
							{uploadingKindergartenImages ? 'Uploading...' : 'Change main image'}
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
							{uploadingKindergartenImages ? 'Uploading...' : 'Add gallery images'}
							<input
								type="file"
								hidden
								multiple
								accept="image/jpg, image/jpeg, image/png, image/webp"
								onChange={(event) => uploadKindergartenImages(event, 'gallery')}
							/>
						</Button>
						<Typography className="dashboard-muted-text">
							First image is used as the main photo. JPG, JPEG, PNG or WEBP. Up to {maxKindergartenImages} images.
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
									<img
										src={getImageUrl(image)}
										alt={`Kindergarten photo ${index + 1}`}
										style={{ width: '100%', height: 92, objectFit: 'cover', borderRadius: 10 }}
									/>
									<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
										<Chip label={index === 0 ? 'Main' : `Gallery ${index + 1}`} size="small" color={index === 0 ? 'success' : 'default'} />
										<Button
											size="small"
											color="error"
											disabled={uploadingKindergartenImages}
											onClick={() => removeKindergartenImage(index)}
										>
											Remove
										</Button>
									</Stack>
								</Stack>
							))}
						</Stack>
					)}
				</Stack>

				<Stack className="admin-form-actions">
					<Button variant="contained" onClick={submitKindergarten} sx={{ width: 'fit-content' }}>
						{selectedId ? 'Update Kindergarten' : 'Create Kindergarten'}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default MyKindergarten;
