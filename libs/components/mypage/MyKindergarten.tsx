import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { CREATE_KINDERGARTEN, UPDATE_KINDERGARTEN } from '../../../apollo/user/mutation';
import { GET_OWNER_KINDERGARTENS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { KindergartenInput } from '../../types/kindergarten/kindergarten.input';
import { KindergartenUpdate } from '../../types/kindergarten/kindergarten.update';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';
import { MemberType } from '../../enums/member.enum';
import { getImageUrl } from '../../config';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { getStatusChipSx, getStatusLabel, truncateId } from './dashboardUtils';

const emptyForm: KindergartenInput = {
	kindergartenType: KindergartenType.APARTMENT,
	kindergartenLocation: KindergartenLocation.SEOUL,
	kindergartenAddress: '',
	kindergartenTitle: '',
	kindergartenPrice: 0,
	kindergartenCapacity: 1,
	kindergartenAgeRange: 1,
	kindergartenPrograms: 1,
	kindergartenImages: [],
	kindergartenDesc: '',
};

const typeLabels: Record<KindergartenType, string> = {
	[KindergartenType.APARTMENT]: 'Private Kindergarten',
	[KindergartenType.VILLA]: 'Public Kindergarten',
	[KindergartenType.HOUSE]: 'Daycare Center',
};

const MyKindergarten = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [selectedId, setSelectedId] = useState<string>('');
	const [form, setForm] = useState<KindergartenInput>(emptyForm);
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

	const selectKindergarten = (kindergarten: Kindergarten) => {
		setSelectedId(kindergarten._id);
		setForm({
			kindergartenType: kindergarten.kindergartenType,
			kindergartenLocation: kindergarten.kindergartenLocation,
			kindergartenAddress: kindergarten.kindergartenAddress,
			kindergartenTitle: kindergarten.kindergartenTitle,
			kindergartenPrice: kindergarten.kindergartenPrice,
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

			if (selectedId) {
				const input: KindergartenUpdate = { _id: selectedId, ...form };
				await updateKindergarten({ variables: { input } });
				await sweetMixinSuccessAlert('Kindergarten profile updated');
			} else {
				await createKindergarten({ variables: { input: form } });
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
								{typeLabels[kindergarten.kindergartenType]} · {kindergarten.kindergartenLocation}
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
						value={form.kindergartenPrice}
						onChange={(e) => updateForm('kindergartenPrice', Number(e.target.value))}
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
						{Object.values(KindergartenType).map((type) => (
							<option key={type} value={type}>
								{typeLabels[type]}
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
