import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Stack, TextField, Typography } from '@mui/material';
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
		<Stack spacing={3} sx={{ width: '100%' }}>
			<Stack spacing={1}>
				<Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#24332d' }}>My Kindergarten</Typography>
				<Typography sx={{ color: '#6b7280' }}>
					Manage your center profile. Staff, groups, children, and attendance tools are staged as separate dashboard
					areas.
				</Typography>
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Owned centers</Typography>
				{loading && <Typography sx={{ color: '#6b7280' }}>Loading your kindergartens...</Typography>}
				{!loading && kindergartens.length === 0 && (
					<Typography sx={{ color: '#6b7280' }}>No kindergarten profile yet. Create the first center below.</Typography>
				)}
				{kindergartens.map((kindergarten) => (
					<Stack
						key={kindergarten._id}
						direction={'row'}
						spacing={2}
						alignItems={'center'}
						sx={{
							padding: '14px',
							borderRadius: '14px',
							border: selectedId === kindergarten._id ? '1px solid #f59e0b' : '1px solid #eef0ea',
							background: selectedId === kindergarten._id ? '#fff7ed' : '#fbfcf8',
						}}
					>
						<img
							src={getImageUrl(kindergarten.kindergartenImages?.[0])}
							alt={kindergarten.kindergartenTitle}
							style={{ width: 86, height: 64, objectFit: 'cover', borderRadius: 12 }}
						/>
						<Stack sx={{ flex: 1 }}>
							<Typography sx={{ fontWeight: 700, color: '#24332d' }}>{kindergarten.kindergartenTitle}</Typography>
							<Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
								{typeLabels[kindergarten.kindergartenType]} · {kindergarten.kindergartenLocation} · Capacity{' '}
								{kindergarten.kindergartenCapacity}
							</Typography>
						</Stack>
						<Button variant="outlined" onClick={() => selectKindergarten(kindergarten)}>
							Edit
						</Button>
					</Stack>
				))}
			</Stack>

			<Stack spacing={2} sx={{ padding: '24px', borderRadius: '16px', background: '#fff' }}>
				<Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
					<Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
						{selectedId ? 'Edit kindergarten profile' : 'Create kindergarten profile'}
					</Typography>
					{selectedId && (
						<Button variant="text" onClick={resetForm}>
							New profile
						</Button>
					)}
				</Stack>

				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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

				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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

				<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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

				<Button variant="contained" onClick={submitKindergarten} sx={{ width: 'fit-content' }}>
					{selectedId ? 'Update Kindergarten' : 'Create Kindergarten'}
				</Button>
			</Stack>
		</Stack>
	);
};

export default MyKindergarten;
