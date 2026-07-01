import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Button, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { REACT_APP_API_GRAPHQL_URL, REACT_APP_API_URL } from '../../config';
import { getJwtToken, setJwtToken, updateUserInfo } from '../../auth';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { useTranslation } from 'next-i18next';

const MyProfile: NextPage = ({ initialValues, ...props }: any) => {
	const { t } = useTranslation('common');
	const device = useDeviceDetect();
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);
	const [uploadingProfileImage, setUploadingProfileImage] = useState<boolean>(false);
	const [updateMember] = useMutation(UPDATE_MEMBER);

	/** APOLLO REQUESTS **/

	/** LIFECYCLES **/
	useEffect(() => {
		setUpdateData({
			_id: user._id ?? '',
			memberNick: user.memberNick ?? '',
			memberPhone: user.memberPhone ?? '',
			memberAddress: user.memberAddress ?? '',
			memberImage: user.memberImage ?? '',
		});
	}, [user]);

	/** HANDLERS **/
	const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const image = e.target.files?.[0];
			if (!image) return;
			if (!token) throw new Error(t('profile.loginRequired'));

			setUploadingProfileImage(true);

			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'member',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			setUpdateData((prev) => ({ ...prev, memberImage: responseImage }));
			e.target.value = '';

			const memberId = updateData._id || user._id;
			if (!memberId) throw new Error(t('profile.missingMemberId'));

			const result = await updateMember({
				variables: {
					input: {
						_id: memberId,
						memberImage: responseImage,
					},
				},
			});
			const updatedMember = result.data?.updateMember;
			if (updatedMember?.accessToken) {
				setJwtToken(updatedMember.accessToken);
				updateUserInfo(updatedMember.accessToken);
			} else if (updatedMember) {
				userVar({ ...userVar(), ...updatedMember });
			}
			await sweetMixinSuccessAlert(t('profile.profileImageUpdated'));

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			await sweetErrorHandling(err);
		} finally {
			setUploadingProfileImage(false);
		}
	};

	const updateProfileHandler = useCallback(async () => {
		try {
			const memberId = updateData._id || user._id;
			if (!memberId) throw new Error(t('profile.missingMemberId'));

			const result = await updateMember({
				variables: {
					input: {
						_id: memberId,
						memberNick: updateData.memberNick,
						memberPhone: updateData.memberPhone,
						memberAddress: updateData.memberAddress,
						memberImage: updateData.memberImage || user.memberImage || undefined,
					},
				},
			});
			const updatedMember = result.data?.updateMember;
			if (updatedMember?.accessToken) {
				setJwtToken(updatedMember.accessToken);
				updateUserInfo(updatedMember.accessToken);
			} else if (updatedMember) {
				userVar({ ...userVar(), ...updatedMember });
			}
			await sweetMixinSuccessAlert(t('profile.profileUpdated'));
		} catch (err) {
			await sweetErrorHandling(err);
		}
	}, [updateData, updateMember, user._id]);

	const doDisabledCheck = () => {
		if (
			updateData.memberNick === '' ||
			updateData.memberPhone === '' ||
			updateData.memberAddress === ''
		) {
			return true;
		}
	};

	if (device === 'mobile') {
		return <>{t('profile.mobile')}</>;
	} else
		return (
			<div id="my-profile-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">{t('profile.title')}</Typography>
						<Typography className="sub-title">{t('profile.subtitle')}</Typography>
					</Stack>
				</Stack>
				<Stack className="top-box">
					<Stack className="profile-meta-box">
						<Stack className="profile-meta-item">
							<Typography className="meta-label">{t('profile.role')}</Typography>
							<Typography className="meta-value">{t(`profile.roles.${user.memberType}`, user.memberType)}</Typography>
						</Stack>
						{user.memberStatus && (
							<Stack className="profile-meta-item">
								<Typography className="meta-label">{t('profile.status')}</Typography>
								<Typography className="meta-value">{t(`profile.statuses.${user.memberStatus}`, user.memberStatus)}</Typography>
							</Stack>
						)}
					</Stack>
					<Stack className="photo-box">
						<Typography className="title">{t('profile.photo')}</Typography>
						<Stack className="image-big-box">
							<Stack className="image-box">
								<img
									src={
										updateData?.memberImage
											? `${REACT_APP_API_URL}/${updateData?.memberImage}`
											: `/img/profile/defaultUser.svg`
									}
									alt=""
								/>
							</Stack>
							<Stack className="upload-big-box">
								<input
									type="file"
									hidden
									id="hidden-input"
									onChange={uploadImage}
									accept="image/jpg, image/jpeg, image/png, image/webp"
								/>
								<label htmlFor="hidden-input" className="labeler">
									<Typography>{uploadingProfileImage ? t('profile.uploading') : t('profile.changePhoto')}</Typography>
								</label>
								<Typography className="upload-text">{t('profile.photoHelp')}</Typography>
							</Stack>
						</Stack>
					</Stack>
					<Stack className="small-input-box">
						<Stack className="input-box">
							<Typography className="title">{t('profile.username')}</Typography>
							<input
								type="text"
								placeholder={t('profile.usernamePlaceholder')}
								value={updateData.memberNick}
								onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
							/>
						</Stack>
						<Stack className="input-box">
							<Typography className="title">{t('profile.phone')}</Typography>
							<input
								type="text"
								placeholder={t('profile.phonePlaceholder')}
								value={updateData.memberPhone}
								onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberPhone: value })}
							/>
						</Stack>
					</Stack>
					<Stack className="address-box">
						<Typography className="title">{t('profile.address')}</Typography>
						<input
							type="text"
							placeholder={t('profile.addressPlaceholder')}
							value={updateData.memberAddress}
							onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberAddress: value })}
						/>
					</Stack>
					<Stack className="about-me-box">
						<Button className="update-button" onClick={updateProfileHandler} disabled={doDisabledCheck()}>
							<Typography>{t('profile.updateProfile')}</Typography>
							<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
								<g clipPath="url(#clip0_7065_6985)">
									<path
										d="M12.6389 0H4.69446C4.49486 0 4.33334 0.161518 4.33334 0.361122C4.33334 0.560727 4.49486 0.722245 4.69446 0.722245H11.7672L0.105803 12.3836C-0.0352676 12.5247 -0.0352676 12.7532 0.105803 12.8942C0.176321 12.9647 0.268743 13 0.361131 13C0.453519 13 0.545907 12.9647 0.616459 12.8942L12.2778 1.23287V8.30558C12.2778 8.50518 12.4393 8.6667 12.6389 8.6667C12.8385 8.6667 13 8.50518 13 8.30558V0.361122C13 0.161518 12.8385 0 12.6389 0Z"
										fill="white"
									/>
								</g>
								<defs>
									<clipPath id="clip0_7065_6985">
										<rect width="13" height="13" fill="white" />
									</clipPath>
								</defs>
							</svg>
						</Button>
					</Stack>
				</Stack>
			</div>
		);
};

MyProfile.defaultProps = {
	initialValues: {
		_id: '',
		memberImage: '',
		memberNick: '',
		memberPhone: '',
		memberAddress: '',
	},
};

export default MyProfile;
