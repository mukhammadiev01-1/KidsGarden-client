import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import withLayoutFull from '../layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../property/Review';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Kindergarten } from '../../types/kindergarten/kindergarten';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../utils';
import { getImageUrl } from '../../config';
import { userVar } from '../../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../types/comment/comment.input';
import { Comment } from '../../types/comment/comment';
import { CommentGroup } from '../../enums/comment.enum';
import { Pagination as MuiPagination } from '@mui/material';
import {
	GET_COMMENTS,
	GET_KINDERGARTEN,
	GET_KINDERGARTENS,
	GET_MY_APPLICATIONS,
	GET_MY_STAFF_APPLICATIONS,
} from '../../../apollo/user/query';
import {
	APPLICATION_DOCUMENTS_UPLOADER,
	CREATE_APPLICATION,
	CREATE_COMMENT,
	CREATE_STAFF_APPLICATION,
	LIKE_TARGET_KINDERGARTEN,
} from '../../../apollo/user/mutation';
import { sweetErrorAlert, sweetErrorHandling, sweetLoginConfirmAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { MemberType } from '../../enums/member.enum';
import { StaffRole } from '../../enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';
import { StaffApplication } from '../../types/staff-application/staff-application';
import { ACTIVE_APPLICATION_STATUSES } from '../../enums/application.enum';
import { Application, ApplicationDocument } from '../../types/application/application';
import KakaoKindergartenMap from '../maps/KakaoKindergartenMap';
import PageSeo from '../seo/PageSeo';

const programLabels = ['Montessori', 'Bilingual', 'Play-based', 'STEM', 'Art & Music'];
const facilityLabels = ['Secure entry', 'Healthy meals', 'Indoor play', 'Outdoor play', 'First aid', 'Clean classrooms'];
const APPLICATION_DOCUMENT_ACCEPT = 'image/jpeg,image/jpg,image/png,application/pdf';
const APPLICATION_DOCUMENT_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']);
const MAX_APPLICATION_DOCUMENTS = 5;
const MAX_APPLICATION_DOCUMENT_SIZE = 1024 * 1024;

const formatCount = (value?: number, fallback = 'Not listed') => {
	if (typeof value !== 'number') return fallback;
	return value.toLocaleString();
};

const getApplicationErrorMessage = (err: any) => {
	const message = err?.message || '';
	if (message.includes('Not Allowed Request')) {
		return 'You may already have an open application for this kindergarten. Check My Kindergarten Applications for the current status.';
	}
	return '';
};

const formatDocumentSize = (size: number) => {
	if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const buildSeoDescription = (kindergarten?: Kindergarten | null) => {
	const source =
		kindergarten?.kindergartenDesc ||
		[kindergarten?.kindergartenAddress, kindergarten?.kindergartenLocation].filter(Boolean).join(', ') ||
		'View kindergarten details, programs, location, application options, and parent information on KidsGarden.';

	return source.length > 155 ? `${source.slice(0, 152).trim()}...` : source;
};

const validateApplicationDocumentFiles = (files: File[]) => {
	if (files.length > MAX_APPLICATION_DOCUMENTS) return 'You can upload up to 5 documents.';

	for (const file of files) {
		const fileName = file.name.toLowerCase();
		if (fileName.endsWith('.webp') || file.type === 'image/webp') return 'WEBP files are not supported for applications.';
		if (!APPLICATION_DOCUMENT_MIME_TYPES.has(file.type)) return 'Only JPG, JPEG, PNG, and PDF files are allowed.';
		if (file.size > MAX_APPLICATION_DOCUMENT_SIZE) return 'Each application document must be 1 MB or smaller.';
	}

	return '';
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
	const [applicationFormOpen, setApplicationFormOpen] = useState(false);
	const [applicationForm, setApplicationForm] = useState({
		childName: '',
		childAge: '',
		parentMessage: '',
	});
	const [applicationFiles, setApplicationFiles] = useState<File[]>([]);
	const [applicationFileError, setApplicationFileError] = useState<string>('');
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.KINDERGARTEN,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten] = useMutation(LIKE_TARGET_KINDERGARTEN);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [createStaffApplication, { loading: creatingStaffApplication }] = useMutation(CREATE_STAFF_APPLICATION);
	const [createApplication, { loading: creatingApplication }] = useMutation(CREATE_APPLICATION);
	const [uploadApplicationDocuments, { loading: uploadingApplicationDocuments }] = useMutation(
		APPLICATION_DOCUMENTS_UPLOADER,
	);

	const {
		loading: kindergartenLoading,
		error: kindergartenError,
		refetch: getKindergartenRefetch,
	} = useQuery(GET_KINDERGARTEN, {
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

	const applicationsInput = useMemo(
		() => ({
			page: 1,
			limit: 20,
			sort: 'createdAt',
			direction: 'DESC',
			search: {
				kindergartenId: kindergartenId || undefined,
			},
		}),
		[kindergartenId],
	);

	const { data: applicationsData, refetch: refetchMyApplications } = useQuery(GET_MY_APPLICATIONS, {
		skip: !kindergartenId || user.memberType !== MemberType.PARENT,
		fetchPolicy: 'network-only',
		variables: { input: applicationsInput },
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
	const myApplications: Application[] = applicationsData?.getMyApplications?.list || [];
	const kindergartenApplications = myApplications.filter((application) => application.kindergartenId === kindergartenId);
	const currentApplication =
		kindergartenApplications.find((application) => ACTIVE_APPLICATION_STATUSES.includes(application.status)) ||
		kindergartenApplications[0];
	const hasOpenApplication = currentApplication
		? ACTIVE_APPLICATION_STATUSES.includes(currentApplication.status)
		: false;
	const submittingApplication = creatingApplication || uploadingApplicationDocuments;

	const detailImages = kindergarten?.kindergartenImages?.length ? kindergarten.kindergartenImages : [];
	const activeImage = slideImage || detailImages[0];
	const shortDescription =
		kindergarten?.kindergartenDesc ||
		'A warm kindergarten where children learn through play, discovery, routines, and caring guidance.';
	const title = kindergarten?.kindergartenTitle || 'Kindergarten';
	const programsCount = Number(kindergarten?.kindergartenPrograms || 0);
	const visiblePrograms = programLabels.slice(0, Math.max(1, Math.min(programLabels.length, programsCount || 5)));
	const locationText = [kindergarten?.kindergartenAddress, kindergarten?.kindergartenLocation].filter(Boolean).join(', ');
	const seoDescription = buildSeoDescription(kindergarten);
	const seoImage = detailImages[0] ? getImageUrl(detailImages[0]) : undefined;

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
			const applicationErrorMessage = getApplicationErrorMessage(err);
			if (applicationErrorMessage) await sweetErrorAlert(applicationErrorMessage);
			else await sweetErrorHandling(err);
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

	const applicationFileChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		if (!files.length) {
			setApplicationFiles([]);
			setApplicationFileError('');
			return;
		}

		const errorMessage = validateApplicationDocumentFiles(files);
		if (errorMessage) {
			setApplicationFiles([]);
			setApplicationFileError(errorMessage);
			event.target.value = '';
			return;
		}

		setApplicationFiles(files);
		setApplicationFileError('');
	};

	const applyToKindergartenHandler = async () => {
		try {
			if (!kindergartenId) return;
			if (!user?._id || user.memberType !== MemberType.PARENT) return;
			if (hasOpenApplication) return;

			const childName = applicationForm.childName.trim();
			const childAge = Number(applicationForm.childAge);
			if (!childName) throw new Error('Enter child name.');
			if (Number.isNaN(childAge) || childAge < 0) throw new Error('Enter a valid child age.');
			if (applicationFileError) throw new Error(applicationFileError);

			const documentError = validateApplicationDocumentFiles(applicationFiles);
			if (documentError) throw new Error(documentError);

			let documents: ApplicationDocument[] = [];
			if (applicationFiles.length) {
				const uploadResult = await uploadApplicationDocuments({
					variables: {
						files: applicationFiles,
					},
				});
				documents = uploadResult.data?.applicationDocumentsUploader || [];
				if (documents.length !== applicationFiles.length) throw new Error('Document upload failed.');
			}

			await createApplication({
				variables: {
					input: {
						kindergartenId,
						childName,
						childAge,
						parentMessage: applicationForm.parentMessage.trim() || undefined,
						...(documents.length ? { documents } : {}),
					},
				},
			});
			setApplicationForm({ childName: '', childAge: '', parentMessage: '' });
			setApplicationFiles([]);
			setApplicationFileError('');
			setApplicationFormOpen(false);
			await refetchMyApplications({ input: applicationsInput });
			await sweetTopSmallSuccessAlert('Application submitted');
		} catch (err: any) {
			const applicationErrorMessage = getApplicationErrorMessage(err);
			if (applicationErrorMessage) await sweetErrorAlert(applicationErrorMessage);
			else await sweetErrorHandling(err);
		}
	};

	const scrollToContact = () => {
		document.querySelector('.kg-detail-contact-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	};

	if (!kindergarten && (kindergartenLoading || !kindergartenId)) {
		return (
			<div id={'kindergarten-detail-page'} className="kg-detail-page">
				<PageSeo
					title="Kindergarten Details"
					description="View kindergarten details, programs, location, application options, and parent information on KidsGarden."
					canonicalPath="/kindergartens/detail"
				/>
				<div className={'container kg-detail-container'}>
					<section className="kg-detail-panel">
						<Typography component="h1">Loading kindergarten details...</Typography>
						<Typography>Please wait while KidsGarden loads this center.</Typography>
					</section>
				</div>
			</div>
		);
	}

	if (!kindergarten && kindergartenId && !kindergartenLoading) {
		return (
			<div id={'kindergarten-detail-page'} className="kg-detail-page">
				<PageSeo
					title="Kindergarten Not Found"
					description="This kindergarten profile could not be found. Browse other kindergarten profiles on KidsGarden."
					canonicalPath="/kindergartens/detail"
				/>
				<div className={'container kg-detail-container'}>
					<section className="kg-detail-panel">
						<Typography component="h1">Kindergarten not found</Typography>
						<Typography>
							{kindergartenError
								? 'The kindergarten profile could not be loaded right now.'
								: 'This kindergarten profile is unavailable or may have been removed.'}
						</Typography>
						<Button className="primary" onClick={() => router.push('/kindergartens')}>
							Browse kindergartens
						</Button>
					</section>
				</div>
			</div>
		);
	}

	return (
		<div id={'kindergarten-detail-page'} className="kg-detail-page">
			<PageSeo
				title={title}
				description={seoDescription}
				canonicalPath={kindergartenId ? `/kindergartens/detail?id=${kindergartenId}` : '/kindergartens/detail'}
				image={seoImage}
			/>
			<div className={'container kg-detail-container'}>
				<Stack className="kg-detail-breadcrumb">
					<button type="button" onClick={() => router.push('/')}>Home</button>
					<span>/</span>
					<button type="button" onClick={() => router.push('/kindergartens')}>Kindergartens</button>
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
											onClick={() => router.push({ pathname: '/kindergartens/detail', query: { id: item._id } })}
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
							<KakaoKindergartenMap
								latitude={kindergarten?.kindergartenLatitude}
								longitude={kindergarten?.kindergartenLongitude}
								title={title}
								locationText={locationText}
							/>
							<Button className="primary">Contact Center</Button>
						</Stack>
						<Stack className="kg-detail-side-card kg-fee-card">
							<Typography component="h3">Monthly Fee</Typography>
							<strong>{formatMonthlyFee(kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice)}</strong>
							<span>Ask the center what meals and materials are included.</span>
						</Stack>
						{user?._id && user.memberType === MemberType.PARENT && (
							<Stack className="kg-detail-side-card kg-application-card">
								<Typography component="h3">Apply to this kindergarten</Typography>
								{currentApplication && (
									<p className={`status ${currentApplication.status.toLowerCase()}`}>
										Current application: {currentApplication.status}
									</p>
								)}
								{!applicationFormOpen && (
									<Button
										className="primary"
										disabled={hasOpenApplication || submittingApplication}
										onClick={() => setApplicationFormOpen(true)}
									>
										{hasOpenApplication ? 'Application In Review' : 'Apply to this kindergarten'}
									</Button>
								)}
								{applicationFormOpen && (
									<Stack spacing={1.5}>
										<TextField
											fullWidth
											size="small"
											label="Child name"
											value={applicationForm.childName}
											onChange={(event) => setApplicationForm({ ...applicationForm, childName: event.target.value })}
										/>
										<TextField
											fullWidth
											size="small"
											label="Child age"
											type="number"
											value={applicationForm.childAge}
											onChange={(event) => setApplicationForm({ ...applicationForm, childAge: event.target.value })}
										/>
										<TextField
											fullWidth
											multiline
											minRows={3}
											label="Parent message"
											value={applicationForm.parentMessage}
											onChange={(event) => setApplicationForm({ ...applicationForm, parentMessage: event.target.value })}
										/>
										<Stack spacing={0.75}>
											<input
												type="file"
												multiple
												accept={APPLICATION_DOCUMENT_ACCEPT}
												onChange={applicationFileChangeHandler}
											/>
											<Typography sx={{ fontSize: '12px', color: '#64746b' }}>
												Optional documents: up to 5 JPG, PNG, or PDF files. Max 1 MB each.
											</Typography>
											{applicationFileError && (
												<Typography sx={{ fontSize: '12px', color: '#b91c1c' }}>{applicationFileError}</Typography>
											)}
											{applicationFiles.length > 0 && (
												<Stack spacing={0.4}>
													{applicationFiles.map((file) => (
														<Typography key={`${file.name}-${file.size}`} sx={{ fontSize: '12px', color: '#24332d' }}>
															{file.name} ({formatDocumentSize(file.size)})
														</Typography>
													))}
												</Stack>
											)}
										</Stack>
										<Stack direction="row" spacing={1}>
											<Button
												className="primary"
												disabled={submittingApplication || Boolean(applicationFileError)}
												onClick={applyToKindergartenHandler}
											>
												{uploadingApplicationDocuments
													? 'Uploading...'
													: creatingApplication
													? 'Submitting...'
													: 'Submit application'}
											</Button>
											<Button
												className="secondary"
												onClick={() => {
													setApplicationFormOpen(false);
													setApplicationForm({ childName: '', childAge: '', parentMessage: '' });
													setApplicationFiles([]);
													setApplicationFileError('');
												}}
											>
												Cancel
											</Button>
										</Stack>
									</Stack>
								)}
							</Stack>
						)}
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
