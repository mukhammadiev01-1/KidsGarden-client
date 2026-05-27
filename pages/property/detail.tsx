import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../../libs/components/property/Review';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Kindergarten } from '../../libs/types/kindergarten/kindergarten';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../libs/utils';
import { getImageUrl } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Pagination as MuiPagination } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_COMMENTS, GET_KINDERGARTEN, GET_KINDERGARTENS, GET_MY_STAFF_APPLICATIONS } from '../../apollo/user/query';
import { CREATE_COMMENT, CREATE_STAFF_APPLICATION, LIKE_TARGET_KINDERGARTEN } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetLoginConfirmAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { MemberType } from '../../libs/enums/member.enum';
import { StaffRole } from '../../libs/enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../libs/enums/staff-application.enum';
import { StaffApplication } from '../../libs/types/staff-application/staff-application';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const programLabels = ['Montessori', 'Bilingual', 'Play-based', 'STEM', 'Art & Music'];
const facilityLabels = ['Secure entry', 'Healthy meals', 'Indoor play', 'Outdoor play', 'First aid', 'Clean classrooms'];

const formatCount = (value?: number, fallback = 'Not listed') => {
	if (typeof value !== 'number') return fallback;
	return value.toLocaleString();
};

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
		onError: () => undefined,
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
		onError: () => undefined,
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
		onError: () => undefined,
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

	const detailImages = kindergarten?.kindergartenImages?.length ? kindergarten.kindergartenImages : [];
	const activeImage = slideImage || detailImages[0];
	const shortDescription =
		kindergarten?.kindergartenDesc ||
		'A warm kindergarten where children learn through play, discovery, routines, and caring guidance.';
	const title = kindergarten?.kindergartenTitle || 'Kindergarten';
	const programsCount = Number(kindergarten?.kindergartenPrograms || 0);
	const visiblePrograms = programLabels.slice(0, Math.max(1, Math.min(programLabels.length, programsCount || 5)));
	const locationText = [kindergarten?.kindergartenAddress, kindergarten?.kindergartenLocation].filter(Boolean).join(', ');

	/** LIFECYCLES **/
	useEffect(() => {
		const queryKindergartenId = router.query.kindergartenId || router.query.id;
		const targetKindergartenId = Array.isArray(queryKindergartenId) ? queryKindergartenId[0] : queryKindergartenId;

		if (targetKindergartenId) {
			setKindergartenId(targetKindergartenId);
			setCommentInquiry({
				...commentInquiry,
				search: {
					commentRefId: targetKindergartenId,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: targetKindergartenId,
			});
		}
	}, [router]);

	useEffect(() => {
		if (commentInquiry?.search?.commentRefId) {
			getCommentsRefetch({ input: commentInquiry }).catch(() => undefined);
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

	const scrollToContact = () => {
		document.querySelector('.kg-detail-contact-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	};

	return (
		<div id={'property-detail-page'} className="kg-detail-page">
			<div className={'container kg-detail-container'}>
				<Stack className="kg-detail-breadcrumb">
					<button type="button" onClick={() => router.push('/')}>Home</button>
					<span>/</span>
					<button type="button" onClick={() => router.push('/property')}>Kindergartens</button>
					<span>/</span>
					<strong>{title}</strong>
				</Stack>

				<Stack className="kg-detail-hero">
					<Stack className="kg-detail-gallery">
						<Stack className="kg-detail-main-image">
							<span className="kg-verified-badge">Verified Kindergarten</span>
							<img src={getImageUrl(activeImage)} alt={title} />
							<button type="button" className="kg-photo-count">See all photos ({detailImages.length || 1})</button>
						</Stack>
						<Stack className="kg-detail-thumbs">
							{detailImages.slice(0, 5).map((image, index) => (
								<button
									type="button"
									key={`${image}-${index}`}
									className={image === activeImage ? 'active' : ''}
									onClick={() => changeImageHandler(image)}
								>
									<img src={getImageUrl(image)} alt={`${title} ${index + 1}`} />
								</button>
							))}
						</Stack>
					</Stack>

					<Stack className="kg-detail-info-card">
						<Stack className="kg-detail-topline">
							<span className="kg-rating-pill">4.8</span>
							<span>{commentTotal || kindergarten?.kindergartenComments || 0} reviews</span>
							<span className="kg-view-stat"><RemoveRedEyeIcon /> {formatCount(kindergarten?.kindergartenViews, '0')} views</span>
						</Stack>
						<Stack className="kg-detail-title-row">
							<Typography component="h1">{title}</Typography>
							<button
								type="button"
								className={`kg-like-button ${kindergarten?.meLiked?.[0]?.myFavorite ? 'active' : ''}`}
								onClick={() => likeKindergartenHandler(user, kindergarten?._id || '')}
								aria-label="Like kindergarten"
							>
								{kindergarten?.meLiked?.[0]?.myFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
							</button>
						</Stack>
						<Typography className="kg-detail-location">{locationText || kindergarten?.kindergartenLocation}</Typography>
						<Typography className="kg-detail-summary">{shortDescription}</Typography>
						<Stack className="kg-detail-fact-grid">
							<div><strong>Ages</strong><span>{kindergarten?.kindergartenAgeRange || '1 - 6'} years</span></div>
							<div><strong>Capacity</strong><span>{formatCount(kindergarten?.kindergartenCapacity)} children</span></div>
							<div><strong>Groups</strong><span>{Math.max(1, Math.ceil((kindergarten?.kindergartenCapacity || 60) / 20))} groups</span></div>
							<div><strong>Programs</strong><span>{programsCount || visiblePrograms.length} programs</span></div>
							<div><strong>Languages</strong><span>Uzbek, English</span></div>
							<div><strong>Center Type</strong><span>{getKindergartenTypeLabel(kindergarten?.kindergartenType)}</span></div>
						</Stack>
						<Stack className="kg-detail-actions">
							<Button onClick={scrollToContact} className="primary">Contact Center</Button>
							<Button onClick={scrollToContact} className="secondary">Request a Visit</Button>
						</Stack>
					</Stack>
				</Stack>

				<Stack className="kg-quick-facts">
					<div><span>Hours</span><strong>07:30 - 18:30</strong></div>
					<div><span>Programs</span><strong>{visiblePrograms.slice(0, 3).join(', ')}</strong></div>
					<div><span>Languages</span><strong>Uzbek, English</strong></div>
					<div><span>Meals</span><strong>Healthy meals</strong></div>
					<div><span>Safety</span><strong>Secure entry</strong></div>
				</Stack>

				<Stack className="kg-detail-layout">
					<Stack className="kg-detail-main">
						<section className="kg-detail-panel kg-about-panel">
							<Typography component="h2">About this kindergarten</Typography>
							<Typography>{shortDescription}</Typography>
							<ul>
								<li>Safe and secure environment</li>
								<li>Play-based learning approach</li>
								<li>Qualified and caring teachers</li>
								<li>Regular parent communication</li>
							</ul>
						</section>

						<section className="kg-detail-panel kg-why-panel">
							<Typography component="h2">Why parents choose us</Typography>
							<ul>
								<li>Experienced and caring teachers</li>
								<li>Clean, child-friendly classrooms</li>
								<li>Engaging daily activities</li>
								<li>Healthy routines and safe care</li>
							</ul>
						</section>

						<section className="kg-detail-panel">
							<Stack className="kg-panel-heading">
								<Typography component="h2">Programs</Typography>
								<span>{programsCount || visiblePrograms.length} programs</span>
							</Stack>
							<Stack className="kg-program-grid">
								{visiblePrograms.map((program) => (
									<div key={program}>
										<strong>{program}</strong>
										<span>Designed for ages {kindergarten?.kindergartenAgeRange || '1 - 6'}.</span>
									</div>
								))}
							</Stack>
						</section>

						<section className="kg-detail-panel">
							<Typography component="h2">Safety & facilities</Typography>
							<Stack className="kg-facility-grid">
								{facilityLabels.map((facility) => (
									<div key={facility}>{facility}</div>
								))}
							</Stack>
						</section>

						{detailImages.length > 0 && (
							<section className="kg-detail-panel">
								<Typography component="h2">Gallery</Typography>
								<Stack className="kg-gallery-grid">
									{detailImages.slice(0, 6).map((image, index) => (
										<img src={getImageUrl(image)} alt={`${title} gallery ${index + 1}`} key={`${image}-gallery-${index}`} />
									))}
								</Stack>
							</section>
						)}

						<section className="kg-detail-panel kg-review-panel">
							<Stack className="kg-panel-heading">
								<Typography component="h2">Parent Reviews</Typography>
								<span>{commentTotal} reviews</span>
							</Stack>
							{commentTotal !== 0 && (
								<Stack className="kg-review-list">
									{kindergartenComments?.map((comment: Comment) => (
										<Review comment={comment} key={comment?._id} />
									))}
									<MuiPagination
										page={commentInquiry.page}
										count={Math.ceil(commentTotal / commentInquiry.limit)}
										onChange={commentPaginationChangeHandler}
										shape="circular"
										color="primary"
									/>
								</Stack>
							)}
							<Stack className="kg-review-form">
								<Typography className="kg-review-title">Share feedback for other families</Typography>
								<textarea
									onChange={({ target: { value } }: any) => {
										setInsertCommentData({ ...insertCommentData, commentContent: value });
									}}
									value={insertCommentData.commentContent}
									placeholder="Write a short parent review"
								></textarea>
								<Button
									disabled={insertCommentData.commentContent === '' || user?._id === ''}
									onClick={createCommentHandler}
								>
									Submit Review
								</Button>
							</Stack>
						</section>

						{destinationKindergarten.length !== 0 && (
							<section className="kg-detail-panel kg-similar-panel">
								<Typography component="h2">Nearby kindergartens</Typography>
								<Stack className="kg-similar-grid">
									{destinationKindergarten.slice(0, 3).map((item) => (
										<button
											type="button"
											key={item._id}
											onClick={() => router.push({ pathname: '/property/detail', query: { id: item._id } })}
										>
											<img src={getImageUrl(item.kindergartenImages?.[0])} alt={item.kindergartenTitle} />
											<strong>{item.kindergartenTitle}</strong>
											<span>{item.kindergartenLocation}</span>
										</button>
									))}
								</Stack>
							</section>
						)}
					</Stack>

					<aside className="kg-detail-sidebar">
						<Stack className="kg-detail-side-card kg-detail-contact-card">
							<Typography component="h3">Contact & Location</Typography>
							<p>{locationText || 'Location available after center confirmation.'}</p>
							<Button className="primary">Contact Center</Button>
						</Stack>
						<Stack className="kg-detail-side-card kg-fee-card">
							<Typography component="h3">Monthly Fee</Typography>
							<strong>{formatMonthlyFee(kindergarten?.kindergartenPrice)}</strong>
							<span>Ask the center what meals and materials are included.</span>
						</Stack>
						<Stack className="kg-detail-side-card kg-map-card">
							<Typography component="h3">Map preview</Typography>
							<div className="kg-detail-map-placeholder">
								<span></span>
							</div>
							<p>Live map coming soon.</p>
						</Stack>
						<Stack className="kg-detail-side-card kg-teacher-apply-card">
							<Typography component="h3">Apply as Teacher</Typography>
							{!user?._id && (
								<>
									<p>Sign in as a parent to apply for a teacher role at this kindergarten.</p>
									<Button className="primary" onClick={applyAsTeacherHandler}>Login to Apply</Button>
								</>
							)}
							{user?._id && user.memberType === MemberType.PARENT && (
								<>
									{hasPendingStaffApplication && <p className="status pending">Application pending</p>}
									{hasApprovedStaffApplication && <p className="status approved">Application approved</p>}
									{currentStaffApplication?.applicationStatus === StaffApplicationStatus.REJECTED && (
										<p className="status rejected">Previous application rejected. You can apply again.</p>
									)}
									{currentStaffApplication?.applicationStatus === StaffApplicationStatus.CANCELED && (
										<p className="status">Previous application canceled. You can apply again.</p>
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
										className="primary"
										disabled={!canApplyAsTeacher || creatingStaffApplication}
										onClick={applyAsTeacherHandler}
									>
										{creatingStaffApplication
											? 'Submitting...'
											: hasPendingStaffApplication
											? 'Application Pending'
											: hasApprovedStaffApplication
											? 'Application Approved'
											: 'Apply as Teacher'}
									</Button>
								</>
							)}
							{user?._id && user.memberType !== MemberType.PARENT && (
								<p>Teacher applications are available from parent accounts.</p>
							)}
						</Stack>
					</aside>
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
