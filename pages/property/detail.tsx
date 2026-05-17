import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../../libs/components/property/Review';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation, Pagination } from 'swiper';
import PropertyBigCard from '../../libs/components/common/PropertyBigCard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Kindergarten } from '../../libs/types/kindergarten/kindergarten';
import moment from 'moment';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../libs/utils';
import { getImageUrl } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Pagination as MuiPagination } from '@mui/material';
import Link from 'next/link';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import 'swiper/css';
import 'swiper/css/pagination';
import { GET_COMMENTS, GET_KINDERGARTEN, GET_KINDERGARTENS, GET_MY_STAFF_APPLICATIONS } from '../../apollo/user/query';
import { CREATE_COMMENT, CREATE_STAFF_APPLICATION, LIKE_TARGET_KINDERGARTEN } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetLoginConfirmAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { MemberType } from '../../libs/enums/member.enum';
import { StaffRole } from '../../libs/enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../libs/enums/staff-application.enum';
import { StaffApplication } from '../../libs/types/staff-application/staff-application';

SwiperCore.use([Autoplay, Navigation, Pagination]);

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const KindergartenDetail: NextPage = ({ initialComment, ...props }: any) => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [kindergartenId, setKindergartenId] = useState<string | null>(null);
	const [kindergarten, setKindergarten] = useState<Kindergarten | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');
	const [destinationKindergarten, setDestinationKindergarten] = useState<Kindergarten[]>([]);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [kindergartenComments, setKindergartenComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [staffApplicationMessage, setStaffApplicationMessage] = useState<string>('');
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.KINDERGARTEN,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [createStaffApplication, { loading: creatingStaffApplication }] = useMutation(CREATE_STAFF_APPLICATION);

	const { refetch: getKindergartenRefetch } = useQuery(GET_KINDERGARTEN, {
		skip: !kindergartenId,
		fetchPolicy: 'network-only',
		variables: { input: kindergartenId },
		onCompleted: (data: any) => {
			const targetKindergarten = data?.getKindergarten;
			setKindergarten(targetKindergarten || null);
			setSlideImage(targetKindergarten?.kindergartenImages?.[0] || '');
		},
	});

	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		skip: !commentInquiry?.search?.commentRefId,
		fetchPolicy: 'network-only',
		variables: { input: commentInquiry },
		onCompleted: (data: any) => {
			setKindergartenComments(data?.getComments?.list || []);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total || 0);
		},
	});

	useQuery(GET_KINDERGARTENS, {
		skip: !kindergarten?.kindergartenLocation,
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1,
				limit: 4,
				sort: 'kindergartenRank',
				direction: 'DESC',
				search: {
					locationList: kindergarten?.kindergartenLocation ? [kindergarten.kindergartenLocation] : undefined,
				},
			},
		},
		onCompleted: (data: any) => {
			const list = data?.getKindergartens?.list || [];
			setDestinationKindergarten(list.filter((item: Kindergarten) => item._id !== kindergarten?._id));
		},
	});

	const staffApplicationsInput = useMemo(
		() => ({
			page: 1,
			limit: 20,
			sort: 'createdAt',
			search: {
				kindergartenId: kindergartenId || undefined,
			},
		}),
		[kindergartenId],
	);

	const { data: staffApplicationsData, refetch: refetchMyStaffApplications } = useQuery(GET_MY_STAFF_APPLICATIONS, {
		skip: !kindergartenId || user.memberType !== MemberType.PARENT,
		fetchPolicy: 'network-only',
		variables: { input: staffApplicationsInput },
		onError: () => undefined,
	});

	const myStaffApplications: StaffApplication[] = staffApplicationsData?.getMyStaffApplications?.list || [];
	const kindergartenStaffApplications = myStaffApplications.filter((application) => application.kindergartenId === kindergartenId);
	const currentStaffApplication =
		kindergartenStaffApplications.find(
			(application) => application.applicationStatus === StaffApplicationStatus.PENDING,
		) ||
		kindergartenStaffApplications.find(
			(application) => application.applicationStatus === StaffApplicationStatus.APPROVED,
		) ||
		kindergartenStaffApplications[0];
	const hasPendingStaffApplication =
		currentStaffApplication?.applicationStatus === StaffApplicationStatus.PENDING;
	const hasApprovedStaffApplication =
		currentStaffApplication?.applicationStatus === StaffApplicationStatus.APPROVED;
	const canApplyAsTeacher =
		user.memberType === MemberType.PARENT && !hasPendingStaffApplication && !hasApprovedStaffApplication;

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.id) {
			setKindergartenId(router.query.id as string);
			setCommentInquiry({
				...commentInquiry,
				search: {
					commentRefId: router.query.id as string,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: router.query.id as string,
			});
		}
	}, [router]);

	useEffect(() => {
		if (commentInquiry?.search?.commentRefId) {
			getCommentsRefetch({ input: commentInquiry }).then();
		}
	}, [commentInquiry]);

	/** HANDLERS **/
	const changeImageHandler = (image: string) => {
		setSlideImage(image);
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		commentInquiry.page = value;
		setCommentInquiry({ ...commentInquiry });
	};

	const likeKindergartenHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert('Please login first');
				if (confirmed) await router.push('/account/join');
				return;
			}
			await likeTargetKindergarten({ variables: { input: id } });
			await getKindergartenRefetch({ input: id });
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const createCommentHandler = async () => {
		try {
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert('Please login first');
				if (confirmed) await router.push('/account/join');
				return;
			}
			await createComment({ variables: { input: insertCommentData } });
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
			await getKindergartenRefetch({ input: kindergartenId });
			await sweetTopSmallSuccessAlert('Review submitted');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const applyAsTeacherHandler = async () => {
		try {
			if (!kindergartenId) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert('Please login first');
				if (confirmed) await router.push('/account/join');
				return;
			}
			if (user.memberType !== MemberType.PARENT) return;
			if (!canApplyAsTeacher) return;

			await createStaffApplication({
				variables: {
					input: {
						kindergartenId,
						requestedRole: StaffRole.TEACHER,
						message: staffApplicationMessage.trim() || undefined,
					},
				},
			});
			setStaffApplicationMessage('');
			await refetchMyStaffApplications({ input: staffApplicationsInput });
			await sweetTopSmallSuccessAlert('Teacher application submitted');
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	return (
			<div id={'property-detail-page'}>
				<div className={'container'}>
					<Stack className={'property-detail-config'}>
						<Stack className={'property-info-config'}>
							<Stack className={'info'}>
								<Stack className={'left-box'}>
									<Typography className={'profile-kicker'}>Kindergarten profile</Typography>
									<Typography className={'title-main'}>{kindergarten?.kindergartenTitle}</Typography>
									<Stack className={'top-box'}>
										<Typography className={'city'}>{kindergarten?.kindergartenLocation}</Typography>
										<Stack className={'divider'}></Stack>
										<Typography className={'buy-rent'}>
											{getKindergartenTypeLabel(kindergarten?.kindergartenType)}
										</Typography>
										<Stack className={'divider'}></Stack>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
											<g clipPath="url(#clip0_6505_6282)">
												<path
													d="M7 14C5.61553 14 4.26216 13.5895 3.11101 12.8203C1.95987 12.0511 1.06266 10.9579 0.532846 9.67879C0.00303297 8.3997 -0.13559 6.99224 0.134506 5.63437C0.404603 4.2765 1.07129 3.02922 2.05026 2.05026C3.02922 1.07129 4.2765 0.404603 5.63437 0.134506C6.99224 -0.13559 8.3997 0.00303297 9.67879 0.532846C10.9579 1.06266 12.0511 1.95987 12.8203 3.11101C13.5895 4.26216 14 5.61553 14 7C14 8.85652 13.2625 10.637 11.9498 11.9498C10.637 13.2625 8.85652 14 7 14ZM7 0.931878C5.79984 0.931878 4.62663 1.28777 3.62873 1.95454C2.63084 2.62132 1.85307 3.56903 1.39379 4.67783C0.934505 5.78664 0.814336 7.00673 1.04848 8.18384C1.28262 9.36094 1.86055 10.4422 2.70919 11.2908C3.55783 12.1395 4.63907 12.7174 5.81617 12.9515C6.99327 13.1857 8.21337 13.0655 9.32217 12.6062C10.431 12.1469 11.3787 11.3692 12.0455 10.3713C12.7122 9.37337 13.0681 8.20016 13.0681 7C13.067 5.39099 12.4273 3.84821 11.2895 2.71047C10.1518 1.57273 8.60901 0.933037 7 0.931878Z"
													fill="#181A20"
												/>
												<path
													d="M9.0372 9.7275C8.97153 9.72795 8.90643 9.71543 8.84562 9.69065C8.7848 9.66587 8.72948 9.62933 8.68282 9.58313L6.68345 7.58375C6.63724 7.53709 6.6007 7.48177 6.57592 7.42096C6.55115 7.36015 6.53863 7.29504 6.53907 7.22938V2.7275C6.53907 2.59464 6.59185 2.46723 6.6858 2.37328C6.77974 2.27934 6.90715 2.22656 7.04001 2.22656C7.17287 2.22656 7.30028 2.27934 7.39423 2.37328C7.48817 2.46723 7.54095 2.59464 7.54095 2.7275V7.01937L9.39595 8.87438C9.47462 8.9425 9.53001 9.03354 9.55436 9.13472C9.57871 9.2359 9.5708 9.34217 9.53173 9.43863C9.49266 9.53509 9.4244 9.61691 9.3365 9.67264C9.24861 9.72836 9.14548 9.75519 9.04157 9.74938L9.0372 9.7275Z"
													fill="#181A20"
												/>
											</g>
											<defs>
												<clipPath id="clip0_6505_6282">
													<rect width="14" height="14" fill="white" />
												</clipPath>
											</defs>
										</svg>
										<Typography className={'date'}>{moment().diff(kindergarten?.createdAt, 'days')} days ago</Typography>
									</Stack>
									<Stack className={'bottom-box'}>
										<Stack className="option">
											<Typography>Age {kindergarten?.kindergartenAgeRange}</Typography>
										</Stack>
										<Stack className="option">
											<Typography>{kindergarten?.kindergartenPrograms} programs</Typography>
										</Stack>
										<Stack className="option">
											<Typography>{kindergarten?.kindergartenCapacity} spots</Typography>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'right-box'}>
									<Stack className="buttons">
										<Stack className="button-box">
											<RemoveRedEyeIcon fontSize="medium" />
											<Typography className={'stat-label'}>Views</Typography>
											<Typography>{kindergarten?.kindergartenViews}</Typography>
										</Stack>
										<Stack className="button-box">
											{kindergarten?.meLiked && kindergarten?.meLiked[0]?.myFavorite ? (
												<FavoriteIcon color="primary" fontSize={'medium'} />
											) : (
												<FavoriteBorderIcon
													fontSize={'medium'}
													// @ts-ignore
													onClick={() => likeKindergartenHandler(user, kindergarten?._id)}
												/>
											)}
											<Typography className={'stat-label'}>Likes</Typography>
											<Typography>{kindergarten?.kindergartenLikes}</Typography>
										</Stack>
										<Stack className="button-box">
											<Typography className={'stat-label'}>Reviews</Typography>
											<Typography>{commentTotal}</Typography>
										</Stack>
									</Stack>
									<Typography>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</Typography>
								</Stack>
							</Stack>
							<Stack className={'images'}>
								<Stack className={'main-image'}>
									<img
										src={getImageUrl(slideImage)}
										alt={'main-image'}
									/>
								</Stack>
								<Stack className={'sub-images'}>
									{kindergarten?.kindergartenImages.map((subImg: string) => {
										const imagePath: string = getImageUrl(subImg);
										return (
											<Stack className={'sub-img-box'} onClick={() => changeImageHandler(subImg)} key={subImg}>
												<img src={imagePath} alt={'sub-image'} />
											</Stack>
										);
									})}
								</Stack>
							</Stack>
						</Stack>
						<Stack className={'property-desc-config'}>
							<Stack className={'left-config'}>
								<Stack className={'options-config'}>
									<Stack className={'option'}>
										<Stack className={'svg-box'}>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 20" fill="none">
												<path
													d="M21.4883 11.1135L21.4071 11.0524V5.26354C21.4071 4.47769 21.0568 3.72395 20.4331 3.16775C19.8094 2.61155 18.9632 2.29835 18.0803 2.29688H6.09625C5.21335 2.29835 4.36717 2.61155 3.74345 3.16775C3.11973 3.72395 2.76942 4.47769 2.76942 5.26354V11.058L2.68828 11.1135C2.31313 11.4484 2.10218 11.9018 2.10156 12.3747V17.1135C2.10156 17.2712 2.17193 17.4224 2.29717 17.5339C2.42242 17.6454 2.5923 17.708 2.76942 17.708H6.09625C6.20637 17.7077 6.31471 17.6833 6.41163 17.6367C6.50855 17.5902 6.59104 17.5231 6.65176 17.4413L7.78775 15.9302H16.3951L17.531 17.4413C17.5918 17.5231 17.6743 17.5902 17.7712 17.6367C17.8681 17.6833 17.9764 17.7077 18.0866 17.708H21.4134C21.5894 17.7065 21.7577 17.6432 21.8816 17.5319C22.0055 17.4206 22.075 17.2702 22.075 17.1135V12.3747C22.0744 11.9018 21.8634 11.4484 21.4883 11.1135ZM6.09625 3.48576H18.0803C18.61 3.48576 19.1181 3.67306 19.4927 4.00646C19.8672 4.33986 20.0777 4.79205 20.0777 5.26354V8.83576C19.778 8.45662 19.3781 8.14887 18.9134 7.93961C18.4486 7.73035 17.9332 7.62601 17.4125 7.63576H6.76411C6.32701 7.63469 5.894 7.71072 5.4901 7.85948C5.08621 8.00824 4.71944 8.22676 4.41099 8.50243C4.29799 8.60664 4.19369 8.71804 4.09891 8.83576V5.26354C4.09891 4.79205 4.30934 4.33986 4.68392 4.00646C5.05849 3.67306 5.56652 3.48576 6.09625 3.48576ZM19.4098 10.5969H4.76677C4.76677 10.1254 4.9772 9.67319 5.35178 9.3398C5.72635 9.0064 6.23438 8.8191 6.76411 8.8191H17.4125C17.9422 8.8191 18.4502 9.0064 18.8248 9.3398C19.1994 9.67319 19.4098 10.1254 19.4098 10.5969ZM20.7393 16.5247H18.4299L17.3001 15.0024C17.2387 14.9217 17.1559 14.8556 17.059 14.8101C16.9621 14.7646 16.8541 14.741 16.7446 14.7413H7.42573C7.31618 14.741 7.20821 14.7646 7.11133 14.8101C7.01446 14.8556 6.93165 14.9217 6.87022 15.0024L5.74047 16.5191H3.43104V12.3747C3.43104 12.2966 3.44832 12.2193 3.48188 12.1472C3.51545 12.075 3.56464 12.0095 3.62666 11.9543C3.68867 11.8991 3.7623 11.8553 3.84333 11.8255C3.92436 11.7956 4.0112 11.7802 4.09891 11.7802H20.0777C20.2548 11.7802 20.4247 11.8428 20.5499 11.9543C20.6752 12.0658 20.7455 12.217 20.7455 12.3747L20.7393 16.5247Z"
													fill="#181A20"
												/>
											</svg>
										</Stack>
										<Stack className={'option-includes'}>
											<Typography className={'title'}>Age Range</Typography>
											<Typography className={'option-data'}>{kindergarten?.kindergartenAgeRange}</Typography>
										</Stack>
									</Stack>
									<Stack className={'option'}>
										<Stack className={'svg-box'}></Stack>
										<Stack className={'option-includes'}>
											<Typography className={'title'}>Programs</Typography>
											<Typography className={'option-data'}>{kindergarten?.kindergartenPrograms}</Typography>
										</Stack>
									</Stack>
									<Stack className={'option'}>
										<Stack className={'svg-box'}>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 20" fill="none">
												<path
													d="M20.0464 2.29271H16.7196V1.10938H15.3839V2.29271H8.73021V1.10938H7.39448V2.29271H4.06766C3.53793 2.29271 3.0299 2.48001 2.65532 2.81341C2.28075 3.14681 2.07031 3.59899 2.07031 4.07049V17.1094C2.07031 17.5809 2.28075 18.0331 2.65532 18.3665C3.0299 18.6999 3.53793 18.8872 4.06766 18.8872H20.0464C20.5761 18.8872 21.0842 18.6999 21.4587 18.3665C21.8333 18.0331 22.0438 17.5809 22.0438 17.1094V4.07049C22.0438 3.59899 21.8333 3.14681 21.4587 2.81341C21.0842 2.48001 20.5761 2.29271 20.0464 2.29271ZM4.06766 3.4816H7.39448V4.66493H8.72397V3.4816H15.3839V4.66493H16.7133V3.4816H20.0464C20.2235 3.4816 20.3934 3.54423 20.5187 3.65571C20.6439 3.76719 20.7143 3.91839 20.7143 4.07604V7.03715H3.39979V4.07049C3.40144 3.91379 3.47253 3.76402 3.5976 3.65374C3.72267 3.54346 3.8916 3.48159 4.06766 3.4816ZM20.0464 17.7038H4.06766C3.89053 17.7038 3.72066 17.6412 3.59541 17.5297C3.47016 17.4182 3.39979 17.267 3.39979 17.1094V8.22049H20.7143V17.1094C20.7143 17.267 20.6439 17.4182 20.5187 17.5297C20.3934 17.6412 20.2235 17.7038 20.0464 17.7038Z"
													fill="#181A20"
												/>
												<path
													d="M15.1397 11.8023L13.6042 11.2801L12.5744 10.1412C12.5117 10.0727 12.4327 10.0174 12.3431 9.97949C12.2535 9.94156 12.1555 9.92188 12.0563 9.92188C11.9571 9.92188 11.8591 9.94156 11.7695 9.97949C11.6798 10.0174 11.6009 10.0727 11.5382 10.1412L10.5083 11.2801L8.97289 11.8023C8.88037 11.8343 8.79703 11.8842 8.72892 11.9485C8.66081 12.0127 8.60965 12.0897 8.57916 12.1738C8.54868 12.2578 8.53962 12.3469 8.55267 12.4345C8.56571 12.5221 8.60052 12.606 8.65456 12.6801L9.55961 13.8912L9.64075 15.3523C9.64596 15.4408 9.67332 15.5271 9.72083 15.6049C9.76835 15.6828 9.83482 15.7502 9.91539 15.8023C9.99685 15.8535 10.0898 15.8884 10.1878 15.9047C10.2858 15.921 10.3866 15.9183 10.4834 15.8967L12.0563 15.5245L13.6417 15.9078C13.7387 15.9304 13.8401 15.9332 13.9385 15.9161C14.0369 15.8991 14.1297 15.8625 14.21 15.8091C14.2903 15.7558 14.3562 15.687 14.4026 15.6079C14.449 15.5288 14.4748 15.4414 14.4781 15.3523L14.553 13.8912L15.4518 12.6634C15.5058 12.5893 15.5406 12.5054 15.5537 12.4178C15.5667 12.3302 15.5577 12.2412 15.5272 12.1571C15.4967 12.073 15.4455 11.9961 15.3774 11.9318C15.3093 11.8675 15.226 11.8176 15.1334 11.7856L15.1397 11.8023ZM13.3483 13.3912C13.2844 13.4793 13.2478 13.5808 13.2422 13.6856L13.1923 14.5745L12.2311 14.3412C12.1166 14.3138 11.996 14.3138 11.8815 14.3412L10.9203 14.5745L10.8704 13.6856C10.8648 13.5808 10.8282 13.4793 10.7643 13.3912L10.2212 12.6467L11.1512 12.3301C11.2614 12.2921 11.3584 12.2289 11.4321 12.1467L12.0563 11.4523L12.6805 12.1467C12.7542 12.2289 12.8511 12.2921 12.9613 12.3301L13.8913 12.6467L13.3483 13.3912Z"
													fill="#181A20"
												/>
											</svg>
										</Stack>
										<Stack className={'option-includes'}>
											<Typography className={'title'}>Location</Typography>
											<Typography className={'option-data'}>{kindergarten?.kindergartenLocation}</Typography>
										</Stack>
									</Stack>
									<Stack className={'option'}>
										<Stack className={'svg-box'}>
											<svg xmlns="http://www.w3.org/2000/svg" width="23" height="20" viewBox="0 0 23 20" fill="none">
												<path d="M9.60156 1.10938H13.5963V2.29271H9.60156V1.10938Z" fill="#181A20" />
												<path
													d="M20.2628 17.1144C20.2628 17.2721 20.1924 17.4233 20.0671 17.5347C19.9419 17.6462 19.772 17.7089 19.5949 17.7089H16.9297V18.8922H19.5949C20.1246 18.8922 20.6327 18.7049 21.0072 18.3715C21.3818 18.0381 21.5922 17.5859 21.5922 17.1144V14.7422H20.2628V17.1144Z"
													fill="#181A20"
												/>
												<path
													d="M19.5949 1.10938H16.9297V2.29271H19.5949C19.6826 2.29271 19.7694 2.30808 19.8505 2.33796C19.9315 2.36783 20.0051 2.41162 20.0671 2.46682C20.1292 2.52202 20.1784 2.58755 20.2119 2.65967C20.2455 2.73179 20.2628 2.80909 20.2628 2.88715V5.25938H21.5922V2.88715C21.5922 2.41566 21.3818 1.96347 21.0072 1.63007C20.6327 1.29668 20.1246 1.10938 19.5949 1.10938Z"
													fill="#181A20"
												/>
												<path
													d="M2.94667 2.88715C2.94667 2.80909 2.96394 2.73179 2.99751 2.65967C3.03107 2.58755 3.08027 2.52202 3.14228 2.46682C3.2043 2.41162 3.27792 2.36783 3.35895 2.33796C3.43998 2.30808 3.52683 2.29271 3.61453 2.29271H6.27974V1.10938H3.61453C3.0848 1.10938 2.57677 1.29668 2.2022 1.63007C1.82762 1.96347 1.61719 2.41566 1.61719 2.88715V5.25938H2.94667V2.88715Z"
													fill="#181A20"
												/>
												<path d="M20.2578 8.21875H21.5873V11.7743H20.2578V8.21875Z" fill="#181A20" />
												<path
													d="M16.9281 9.40781V5.85226C16.9281 5.6946 16.8577 5.5434 16.7325 5.43192C16.6072 5.32044 16.4373 5.25781 16.2602 5.25781H12.2655V6.4467H14.6499L11.1233 9.58559C10.8569 9.46989 10.5646 9.40912 10.2682 9.40781H3.61453C3.38637 9.41019 3.16039 9.44778 2.94667 9.51892V8.22448H1.61719V17.1134C1.61719 17.5849 1.82762 18.037 2.2022 18.3704C2.57677 18.7038 3.0848 18.8911 3.61453 18.8911H13.6013V17.7078H12.1469C12.2269 17.5176 12.2691 17.3165 12.2718 17.1134V11.1856C12.2703 10.9218 12.202 10.6616 12.072 10.4245L15.5986 7.28559V9.40781H16.9281ZM3.61453 17.7078C3.4374 17.7078 3.26753 17.6452 3.14228 17.5337C3.01703 17.4222 2.94667 17.271 2.94667 17.1134V11.1856C2.94832 11.0289 3.0194 10.8791 3.14447 10.7688C3.26955 10.6586 3.43848 10.5967 3.61453 10.5967H10.2744C10.4516 10.5967 10.6214 10.6593 10.7467 10.7708C10.8719 10.8823 10.9423 11.0335 10.9423 11.1911V17.1134C10.9423 17.271 10.8719 17.4222 10.7467 17.5337C10.6214 17.6452 10.4516 17.7078 10.2744 17.7078H3.61453Z"
													fill="#181A20"
												/>
											</svg>
										</Stack>
										<Stack className={'option-includes'}>
											<Typography className={'title'}>Capacity</Typography>
											<Typography className={'option-data'}>{kindergarten?.kindergartenCapacity}</Typography>
										</Stack>
									</Stack>
									<Stack className={'option'}>
										<Stack className={'svg-box'}>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 20" fill="none">
												<path
													d="M17.2955 18.8863H6.64714C5.76532 18.8848 4.92008 18.5724 4.29654 18.0174C3.673 17.4624 3.32196 16.7101 3.32031 15.9252V7.21961C3.32207 6.73455 3.45794 6.25732 3.71592 5.83005C3.97391 5.40277 4.34608 5.03858 4.7996 4.76961L10.0988 1.6085C10.6506 1.27315 11.3032 1.09375 11.9713 1.09375C12.6394 1.09375 13.292 1.27315 13.8438 1.6085L19.168 4.76961C19.618 5.04048 19.9866 5.4055 20.2412 5.83265C20.4958 6.25981 20.6289 6.73605 20.6285 7.21961V15.9252C20.6269 16.711 20.275 17.4642 19.6501 18.0193C19.0252 18.5745 18.1784 18.8863 17.2955 18.8863ZM11.9713 2.29183C11.5779 2.29281 11.1936 2.39717 10.8665 2.59183L5.53612 5.75294C5.26468 5.91407 5.04189 6.1321 4.88734 6.38784C4.73279 6.64359 4.65122 6.92922 4.64979 7.21961V15.9252C4.64979 16.3967 4.86023 16.8488 5.2348 17.1822C5.60938 17.5156 6.11741 17.7029 6.64714 17.7029H17.2955C17.8252 17.7029 18.3332 17.5156 18.7078 17.1822C19.0824 16.8488 19.2928 16.3967 19.2928 15.9252V7.21961C19.2935 6.92734 19.2129 6.63946 19.0582 6.38163C18.9036 6.12379 18.6797 5.904 18.4065 5.74183L13.0761 2.59183C12.7492 2.39687 12.3648 2.29248 11.9713 2.29183Z"
													fill="#181A20"
												/>
												<path d="M9.30469 14.7422H14.6289V15.9255H9.30469V14.7422Z" fill="#181A20" />
											</svg>
										</Stack>
										<Stack className={'option-includes'}>
											<Typography className={'title'}>Center Type</Typography>
											<Typography className={'option-data'}>
												{getKindergartenTypeLabel(kindergarten?.kindergartenType)}
											</Typography>
										</Stack>
									</Stack>
									<Stack className={'option'}>
										<Stack className={'svg-box'}></Stack>
										<Stack className={'option-includes'}>
											<Typography className={'title'}>Monthly Fee</Typography>
											<Typography className={'option-data'}>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</Typography>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'prop-desc-config'}>
									<Stack className={'top'}>
									<Typography className={'title'}>About this kindergarten</Typography>
										<Typography className={'desc'}>{kindergarten?.kindergartenDesc ?? 'No Description!'}</Typography>
									</Stack>
									<Stack className={'bottom'}>
										<Typography className={'title'}>Programs and learning environment</Typography>
										<Stack className={'info-box'}>
											<Stack className={'left'}>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Monthly Fee</Typography>
													<Typography className={'data'}>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Capacity</Typography>
													<Typography className={'data'}>{kindergarten?.kindergartenCapacity}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Programs</Typography>
													<Typography className={'data'}>{kindergarten?.kindergartenPrograms}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Age Range</Typography>
													<Typography className={'data'}>{kindergarten?.kindergartenAgeRange}</Typography>
												</Box>
											</Stack>
											<Stack className={'right'}>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Opened</Typography>
													<Typography className={'data'}>{moment(kindergarten?.establishedAt || kindergarten?.createdAt).format('YYYY')}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Center Type</Typography>
													<Typography className={'data'}>{getKindergartenTypeLabel(kindergarten?.kindergartenType)}</Typography>
												</Box>
												<Box component={'div'} className={'info'}>
													<Typography className={'title'}>Location</Typography>
													<Typography className={'data'}>{kindergarten?.kindergartenLocation}</Typography>
												</Box>
											</Stack>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'floor-plans-config'}>
									<Typography className={'title'}>Programs & Facilities</Typography>
									<Stack className={'programs-panel'}>
										<Typography className={'programs-desc'}>
											{kindergarten?.kindergartenDesc ||
												'This center has not added a full program description yet. Use the inquiry form to ask about daily routines, meals, safety, and classroom activities.'}
										</Typography>
										<Stack className={'program-chip-box'}>
											<span>Age {kindergarten?.kindergartenAgeRange}</span>
											<span>{kindergarten?.kindergartenPrograms} programs</span>
											<span>{kindergarten?.kindergartenCapacity} spots</span>
											<span>{getKindergartenTypeLabel(kindergarten?.kindergartenType)}</span>
											<span>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</span>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'address-config'}>
									<Typography className={'title'}>Location</Typography>
									<Stack className={'map-box'}>
										<iframe
											src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d25867.098915951767!2d128.68632810247993!3d35.86402299180927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35660bba427bf179%3A0x1fc02da732b9072f!2sGeumhogangbyeon-ro%2C%20Dong-gu%2C%20Daegu!5e0!3m2!1suz!2skr!4v1695537640704!5m2!1suz!2skr"
											width="100%"
											height="100%"
											style={{ border: 0 }}
											allowFullScreen={true}
											loading="lazy"
											referrerPolicy="no-referrer-when-downgrade"
										></iframe>
									</Stack>
								</Stack>
								{commentTotal !== 0 && (
									<Stack className={'reviews-config'}>
										<Stack className={'filter-box'}>
											<Stack className={'review-cnt'}>
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none">
													<g clipPath="url(#clip0_6507_7309)">
														<path
															d="M15.7183 4.60288C15.6171 4.3599 15.3413 4.18787 15.0162 4.16489L10.5822 3.8504L8.82988 0.64527C8.7005 0.409792 8.40612 0.257812 8.07846 0.257812C7.7508 0.257812 7.4563 0.409792 7.32774 0.64527L5.57541 3.8504L1.14072 4.16489C0.815641 4.18832 0.540363 4.36035 0.438643 4.60288C0.337508 4.84586 0.430908 5.11238 0.676772 5.28084L4.02851 7.57692L3.04025 10.9774C2.96794 11.2275 3.09216 11.486 3.35771 11.636C3.50045 11.717 3.66815 11.7575 3.83643 11.7575C3.98105 11.7575 4.12577 11.7274 4.25503 11.667L8.07846 9.88098L11.9012 11.667C12.1816 11.7979 12.5342 11.7859 12.7992 11.636C13.0648 11.486 13.189 11.2275 13.1167 10.9774L12.1284 7.57692L15.4801 5.28084C15.7259 5.11238 15.8194 4.84641 15.7183 4.60288Z"
															fill="#181A20"
														/>
													</g>
													<defs>
														<clipPath id="clip0_6507_7309">
															<rect width="15.36" height="12" fill="white" transform="translate(0.398438)" />
														</clipPath>
													</defs>
												</svg>
												<Typography className={'reviews'}>{commentTotal} reviews</Typography>
											</Stack>
										</Stack>
										<Stack className={'review-list'}>
											{kindergartenComments?.map((comment: Comment) => {
												return <Review comment={comment} key={comment?._id} />;
											})}
											<Box component={'div'} className={'pagination-box'}>
												<MuiPagination
													page={commentInquiry.page}
													count={Math.ceil(commentTotal / commentInquiry.limit)}
													onChange={commentPaginationChangeHandler}
													shape="circular"
													color="primary"
												/>
											</Box>
										</Stack>
									</Stack>
								)}
								<Stack className={'leave-review-config'}>
									<Typography className={'main-title'}>Parent Reviews</Typography>
									<Typography className={'review-title'}>Share feedback for other families</Typography>
									<textarea
										onChange={({ target: { value } }: any) => {
											setInsertCommentData({ ...insertCommentData, commentContent: value });
										}}
										value={insertCommentData.commentContent}
									></textarea>
									<Box className={'submit-btn'} component={'div'}>
										<Button
											className={'submit-review'}
											disabled={insertCommentData.commentContent === '' || user?._id === ''}
											onClick={createCommentHandler}
										>
											<Typography className={'title'}>Submit Review</Typography>
											<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
												<g clipPath="url(#clip0_6975_3642)">
													<path
														d="M16.1571 0.5H6.37936C6.1337 0.5 5.93491 0.698792 5.93491 0.944458C5.93491 1.19012 6.1337 1.38892 6.37936 1.38892H15.0842L0.731781 15.7413C0.558156 15.915 0.558156 16.1962 0.731781 16.3698C0.818573 16.4566 0.932323 16.5 1.04603 16.5C1.15974 16.5 1.27345 16.4566 1.36028 16.3698L15.7127 2.01737V10.7222C15.7127 10.9679 15.9115 11.1667 16.1572 11.1667C16.4028 11.1667 16.6016 10.9679 16.6016 10.7222V0.944458C16.6016 0.698792 16.4028 0.5 16.1571 0.5Z"
														fill="#181A20"
													/>
												</g>
												<defs>
													<clipPath id="clip0_6975_3642">
														<rect width="16" height="16" fill="white" transform="translate(0.601562 0.5)" />
													</clipPath>
												</defs>
											</svg>
										</Button>
									</Box>
								</Stack>
							</Stack>
								<Stack className={'right-config'}>
								<Stack className={'info-box'}>
									<Typography className={'main-title'}>Enrollment & Contact</Typography>
									<Stack className={'image-info'}>
										<img
											className={'member-image'}
											src={
												kindergarten?.memberData?.memberImage
													? getImageUrl(kindergarten?.memberData?.memberImage, '/img/profile/defaultUser.svg')
													: '/img/profile/defaultUser.svg'
											}
										/>
										<Stack className={'name-phone-listings'}>
											<Link href={`/member?memberId=${kindergarten?.memberData?._id}`}>
												<Typography className={'name'}>{kindergarten?.memberData?.memberNick}</Typography>
											</Link>
												<Typography className={'listings'}>Contact the kindergarten through official inquiry channels.</Typography>
											<Typography className={'listings'}>Kindergarten Admin</Typography>
										</Stack>
									</Stack>
								</Stack>
								<Stack className={'info-box'} spacing={1.5}>
									<Typography className={'main-title'}>Apply as Teacher</Typography>
									{!user?._id && (
										<>
											<Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
												Sign in as a parent to apply for a teacher role at this kindergarten.
											</Typography>
											<Button className={'send-message'} onClick={applyAsTeacherHandler}>
												<Typography className={'title'}>Login to Apply</Typography>
											</Button>
										</>
									)}
									{user?._id && user.memberType === MemberType.PARENT && (
										<>
											{hasPendingStaffApplication && (
												<Typography sx={{ color: '#92400e', fontWeight: 700 }}>Application pending</Typography>
											)}
											{hasApprovedStaffApplication && (
												<Typography sx={{ color: '#166534', fontWeight: 700 }}>Application approved</Typography>
											)}
											{currentStaffApplication?.applicationStatus === StaffApplicationStatus.REJECTED && (
												<Typography sx={{ color: '#991b1b', fontSize: '14px' }}>
													Previous application rejected. You can apply again.
												</Typography>
											)}
											{currentStaffApplication?.applicationStatus === StaffApplicationStatus.CANCELED && (
												<Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
													Previous application canceled. You can apply again.
												</Typography>
											)}
											<TextField
												multiline
												minRows={3}
												placeholder="Optional message for the kindergarten admin"
												value={staffApplicationMessage}
												onChange={(event) => setStaffApplicationMessage(event.target.value)}
												disabled={!canApplyAsTeacher}
												fullWidth
											/>
											<Button
												className={'send-message'}
												disabled={!canApplyAsTeacher || creatingStaffApplication}
												onClick={applyAsTeacherHandler}
											>
												<Typography className={'title'}>
													{creatingStaffApplication
														? 'Submitting...'
														: hasPendingStaffApplication
														? 'Application Pending'
														: hasApprovedStaffApplication
														? 'Application Approved'
														: 'Apply as Teacher'}
												</Typography>
											</Button>
										</>
									)}
									{user?._id && user.memberType !== MemberType.PARENT && (
										<Typography sx={{ color: '#6b7280', fontSize: '14px' }}>
											Teacher applications are available from parent accounts.
										</Typography>
									)}
								</Stack>
								<Stack className={'info-box'}>
									<Typography className={'sub-title'}>Name</Typography>
									<input type={'text'} placeholder={'Enter your name'} />
								</Stack>
								<Stack className={'info-box'}>
									<Typography className={'sub-title'}>Phone</Typography>
									<input type={'text'} placeholder={'Enter your phone'} />
								</Stack>
								<Stack className={'info-box'}>
									<Typography className={'sub-title'}>Email</Typography>
									<input type={'text'} placeholder={'parent@example.com'} />
								</Stack>
								<Stack className={'info-box'}>
									<Typography className={'sub-title'}>Message</Typography>
									<textarea placeholder={'Hello, I would like to learn more about enrollment and programs.'}></textarea>
								</Stack>
								<Stack className={'info-box'}>
									<Button className={'send-message'}>
										<Typography className={'title'}>Request Info</Typography>
										<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
											<g clipPath="url(#clip0_6975_593)">
												<path
													d="M16.0556 0.5H6.2778C6.03214 0.5 5.83334 0.698792 5.83334 0.944458C5.83334 1.19012 6.03214 1.38892 6.2778 1.38892H14.9827L0.630219 15.7413C0.456594 15.915 0.456594 16.1962 0.630219 16.3698C0.71701 16.4566 0.83076 16.5 0.944469 16.5C1.05818 16.5 1.17189 16.4566 1.25872 16.3698L15.6111 2.01737V10.7222C15.6111 10.9679 15.8099 11.1667 16.0556 11.1667C16.3013 11.1667 16.5001 10.9679 16.5001 10.7222V0.944458C16.5 0.698792 16.3012 0.5 16.0556 0.5Z"
													fill="white"
												/>
											</g>
											<defs>
												<clipPath id="clip0_6975_593">
													<rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
												</clipPath>
											</defs>
										</svg>
									</Button>
								</Stack>
							</Stack>
						</Stack>
						{destinationKindergarten.length !== 0 && (
							<Stack className={'similar-properties-config'}>
								<Stack className={'title-pagination-box'}>
									<Stack className={'title-box'}>
										<Typography className={'main-title'}>Similar Kindergartens</Typography>
										<Typography className={'sub-title'}>More centers parents are exploring nearby</Typography>
									</Stack>
									<Stack className={'pagination-box'}>
										<WestIcon className={'swiper-similar-prev'} />
										<div className={'swiper-similar-pagination'}></div>
										<EastIcon className={'swiper-similar-next'} />
									</Stack>
								</Stack>
								<Stack className={'cards-box'}>
									<Swiper
										className={'similar-homes-swiper'}
										slidesPerView={'auto'}
										spaceBetween={35}
										modules={[Autoplay, Navigation, Pagination]}
										navigation={{
											nextEl: '.swiper-similar-next',
											prevEl: '.swiper-similar-prev',
										}}
										pagination={{
											el: '.swiper-similar-pagination',
										}}
									>
										{destinationKindergarten.map((kindergarten: Kindergarten) => {
											return (
												<SwiperSlide className={'similar-homes-slide'} key={kindergarten.kindergartenTitle}>
													<PropertyBigCard kindergarten={kindergarten} key={kindergarten?._id} />
												</SwiperSlide>
											);
										})}
									</Swiper>
								</Stack>
							</Stack>
						)}
					</Stack>
				</div>
			</div>
		);
};

KindergartenDetail.defaultProps = {
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			commentRefId: '',
		},
	},
};

export default withLayoutFull(KindergartenDetail);
