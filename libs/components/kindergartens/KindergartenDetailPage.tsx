import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import withLayoutFull from '../layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../property/Review';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
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
import NaverKindergartenMap from '../maps/NaverKindergartenMap';
import PageSeo from '../seo/PageSeo';

const programKeys = ['montessori', 'bilingual', 'playBased', 'stem', 'artMusic'] as const;
const facilityKeys = ['secure', 'meals', 'indoor', 'outdoor', 'firstAid', 'clean'] as const;
const APPLICATION_DOCUMENT_ACCEPT = 'image/jpeg,image/jpg,image/png,application/pdf';
const APPLICATION_DOCUMENT_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']);
const MAX_APPLICATION_DOCUMENTS = 5;
const MAX_APPLICATION_DOCUMENT_SIZE = 1024 * 1024;
type ApplicationIntent = 'application' | 'contact' | 'visit';

const formatCount = (value?: number, fallback = 'Not listed') => {
	if (typeof value !== 'number') return fallback;
	return value.toLocaleString();
};

const getApplicationErrorMessage = (err: any, t: any) => {
	const message = err?.message || '';
	if (message.includes('Not Allowed Request')) {
		return t('kindergartenDetail.openApplicationError');
	}
	return '';
};

const formatDocumentSize = (size: number) => {
	if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const buildSeoDescription = (kindergarten: Kindergarten | null | undefined, fallback: string) => {
	const source =
		kindergarten?.kindergartenDesc ||
		[kindergarten?.kindergartenAddress, kindergarten?.kindergartenLocation].filter(Boolean).join(', ') ||
		fallback;

	return source.length > 155 ? `${source.slice(0, 152).trim()}...` : source;
};

const validateApplicationDocumentFiles = (files: File[], t: any) => {
	if (files.length > MAX_APPLICATION_DOCUMENTS) return t('kindergartenDetail.uploadLimit');

	for (const file of files) {
		const fileName = file.name.toLowerCase();
		if (fileName.endsWith('.webp') || file.type === 'image/webp') return t('kindergartenDetail.webpUnsupported');
		if (!APPLICATION_DOCUMENT_MIME_TYPES.has(file.type)) return t('kindergartenDetail.documentTypes');
		if (file.size > MAX_APPLICATION_DOCUMENT_SIZE) return t('kindergartenDetail.documentSize');
	}

	return '';
};

const KindergartenDetail: NextPage = ({ initialComment, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
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
	const [applicationIntent, setApplicationIntent] = useState<ApplicationIntent>('application');
	const [applicationForm, setApplicationForm] = useState({
		childName: '',
		childAge: '',
		parentMessage: '',
	});
	const [applicationFiles, setApplicationFiles] = useState<File[]>([]);
	const [applicationFileError, setApplicationFileError] = useState<string>('');
	const gallerySectionRef = useRef<HTMLElement | null>(null);
	const applicationCardRef = useRef<HTMLDivElement | null>(null);
	const applicationChildNameRef = useRef<HTMLInputElement | null>(null);
	const applicationMessageRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.KINDERGARTEN,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [likeTargetKindergarten, { loading: likingKindergarten }] = useMutation(LIKE_TARGET_KINDERGARTEN);
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
	const shortDescription = kindergarten?.kindergartenDesc || t('kindergartenDetail.defaultSummary');
	const title = kindergarten?.kindergartenTitle || t('kindergartens.card.kindergarten');
	const programsCount = Number(kindergarten?.kindergartenPrograms || 0);
	const visibleProgramKeys = programKeys.slice(0, Math.max(1, Math.min(programKeys.length, programsCount || 5)));
	const visibleProgramLabels = visibleProgramKeys.map((program) => t(`kindergartenDetail.programsList.${program}`));
	const translatedLocation = kindergarten?.kindergartenLocation
		? t(`filters.locations.${kindergarten.kindergartenLocation}`, { defaultValue: kindergarten.kindergartenLocation })
		: '';
	const locationText = [kindergarten?.kindergartenAddress, translatedLocation].filter(Boolean).join(', ');
	const kindergartenTypeLabel = kindergarten?.kindergartenType
		? t(`filters.centerTypes.${kindergarten.kindergartenType}`, {
			defaultValue: getKindergartenTypeLabel(kindergarten.kindergartenType),
		})
		: t('common.noData');
	const getApplicationStatusLabel = (status?: string) =>
		status ? t(`kindergartenDetail.applicationStatuses.${status}`, { defaultValue: status }) : '';
	const seoDescription = buildSeoDescription(kindergarten, t('kindergartenDetail.seoDescription'));
	const seoImage = detailImages[0] ? getImageUrl(detailImages[0]) : undefined;
	const kindergartenLiked = Boolean(kindergarten?.meLiked?.[0]?.myFavorite);
	const isGuestUser = !user?._id;
	const isParentUser = user?.memberType === MemberType.PARENT;
	const isKindergartenAdminUser = user?.memberType === MemberType.KINDERGARTEN_ADMIN;
	const canUseParentDetailActions = isGuestUser || isParentUser;
	const canViewTeacherApplicationCard = isGuestUser || isParentUser;
	const canManageThisKindergarten =
		isKindergartenAdminUser && Boolean(kindergarten?.memberId && user?._id && kindergarten.memberId === user._id);

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

	const scrollToGallery = () => {
		if (!detailImages.length) return;
		gallerySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const scrollToApplicationCard = () => {
		(applicationCardRef.current || document.querySelector('.kg-application-card'))?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	};

	const focusApplicationField = (intent: ApplicationIntent) => {
		window.setTimeout(() => {
			if (intent === 'application') {
				applicationChildNameRef.current?.focus();
				return;
			}
			(applicationMessageRef.current || applicationChildNameRef.current)?.focus();
		}, 450);
	};

	const openApplicationForm = (intent: ApplicationIntent = 'application') => {
		setApplicationIntent(intent);
		setApplicationFormOpen(true);
		scrollToApplicationCard();
		focusApplicationField(intent);
	};

	const handleParentApplicationIntent = async (intent: Exclude<ApplicationIntent, 'application'>) => {
		try {
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('kindergartenDetail.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}
			if (user.memberType !== MemberType.PARENT) {
				await sweetErrorAlert(t('kindergartenDetail.parentActionsOnly'));
				return;
			}
			if (hasOpenApplication) {
				await router.push('/mypage?category=applications');
				return;
			}

			openApplicationForm(intent);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		commentInquiry.page = value;
		setCommentInquiry({ ...commentInquiry });
	};

	const likeKindergartenHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('kindergartenDetail.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}
			const likeResult = await likeTargetKindergarten({ variables: { input: id } });
			const updatedKindergarten = likeResult.data?.likeTargetKindergarten;
			if (updatedKindergarten) {
				setKindergarten((prev) =>
					prev && prev._id === updatedKindergarten._id ? { ...prev, ...updatedKindergarten } : updatedKindergarten,
				);
			}

			const refetchResult = await getKindergartenRefetch({ input: id });
			if (refetchResult.data?.getKindergarten) setKindergarten(refetchResult.data.getKindergarten);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const createCommentHandler = async () => {
		try {
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('kindergartenDetail.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}
			await createComment({ variables: { input: insertCommentData } });
			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
			await getKindergartenRefetch({ input: kindergartenId });
			await sweetTopSmallSuccessAlert(t('kindergartenDetail.reviewSubmitted'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const applyAsTeacherHandler = async () => {
		try {
			if (!kindergartenId) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('kindergartenDetail.loginRequired'));
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
			await sweetTopSmallSuccessAlert(t('kindergartenDetail.teacherApplicationSubmitted'));
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

		const errorMessage = validateApplicationDocumentFiles(files, t);
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
			if (!childName) throw new Error(t('kindergartenDetail.enterChildName'));
			if (Number.isNaN(childAge) || childAge < 0) throw new Error(t('kindergartenDetail.enterValidChildAge'));
			if (applicationFileError) throw new Error(applicationFileError);

			const documentError = validateApplicationDocumentFiles(applicationFiles, t);
			if (documentError) throw new Error(documentError);

			let documents: ApplicationDocument[] = [];
			if (applicationFiles.length) {
				const uploadResult = await uploadApplicationDocuments({
					variables: {
						files: applicationFiles,
					},
				});
				documents = uploadResult.data?.applicationDocumentsUploader || [];
				if (documents.length !== applicationFiles.length) throw new Error(t('kindergartenDetail.documentUploadFailed'));
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
			setApplicationIntent('application');
			setApplicationFiles([]);
			setApplicationFileError('');
			setApplicationFormOpen(false);
			await refetchMyApplications({ input: applicationsInput });
			await sweetTopSmallSuccessAlert(t('kindergartenDetail.applicationSubmitted'));
		} catch (err: any) {
			const applicationErrorMessage = getApplicationErrorMessage(err, t);
			if (applicationErrorMessage) await sweetErrorAlert(applicationErrorMessage);
			else await sweetErrorHandling(err);
		}
	};

	if (!kindergarten && (kindergartenLoading || !kindergartenId)) {
		return (
			<div id={'kindergarten-detail-page'} className="kg-detail-page">
				<PageSeo
					title={t('kindergartenDetail.seoTitle')}
					description={t('kindergartenDetail.seoDescription')}
					canonicalPath="/kindergartens/detail"
				/>
				<div className={'container kg-detail-container'}>
					<section className="kg-detail-panel">
						<Typography component="h1">{t('kindergartenDetail.loadingTitle')}</Typography>
						<Typography>{t('kindergartenDetail.loadingText')}</Typography>
					</section>
				</div>
			</div>
		);
	}

	if (!kindergarten && kindergartenId && !kindergartenLoading) {
		return (
			<div id={'kindergarten-detail-page'} className="kg-detail-page">
				<PageSeo
					title={t('kindergartenDetail.notFoundSeoTitle')}
					description={t('kindergartenDetail.notFoundSeoDescription')}
					canonicalPath="/kindergartens/detail"
				/>
				<div className={'container kg-detail-container'}>
					<section className="kg-detail-panel">
						<Typography component="h1">{t('kindergartenDetail.notFoundTitle')}</Typography>
						<Typography>
							{kindergartenError
								? t('kindergartenDetail.notLoaded')
								: t('kindergartenDetail.unavailable')}
						</Typography>
						<Button className="primary" onClick={() => router.push('/kindergartens')}>
							{t('kindergartenDetail.browse')}
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
					<button type="button" onClick={() => router.push('/')}>{t('kindergartenDetail.home')}</button>
					<span>/</span>
					<button type="button" onClick={() => router.push('/kindergartens')}>{t('kindergartenDetail.kindergartens')}</button>
					<span>/</span>
					<strong>{title}</strong>
				</Stack>

				<Stack className="kg-detail-hero">
					<Stack className="kg-detail-gallery">
						<Stack className="kg-detail-main-image">
							<span className="kg-verified-badge">{t('kindergartenDetail.verified')}</span>
							<img src={getImageUrl(activeImage)} alt={title} />
							{detailImages.length > 0 && (
								<button
									type="button"
									className="kg-photo-count"
									onClick={scrollToGallery}
									aria-label={t('kindergartenDetail.seeAllPhotosAria')}
								>
									{t('kindergartenDetail.seeAllPhotos', { count: detailImages.length })}
								</button>
							)}
						</Stack>
						<Stack className="kg-detail-thumbs">
							{detailImages.slice(0, 5).map((image, index) => (
								<button
									type="button"
									key={`${image}-${index}`}
									className={image === activeImage ? 'active' : ''}
									onClick={() => changeImageHandler(image)}
								>
									<img src={getImageUrl(image)} alt={t('kindergartenDetail.galleryAlt', { title, index: index + 1 })} />
								</button>
							))}
						</Stack>
					</Stack>

					<Stack className="kg-detail-info-card">
						<Stack className="kg-detail-topline">
							<span className="kg-rating-pill">4.8</span>
							<span>{commentTotal || kindergarten?.kindergartenComments || 0} {t('kindergartenDetail.reviews')}</span>
							<span className="kg-view-stat"><RemoveRedEyeIcon /> {formatCount(kindergarten?.kindergartenViews, '0')} {t('kindergartenDetail.views')}</span>
							<span className="kg-view-stat"><FavoriteIcon /> {formatCount(kindergarten?.kindergartenLikes, '0')} {t('kindergartenDetail.likes')}</span>
						</Stack>
						<Stack className="kg-detail-title-row">
							<Typography component="h1">{title}</Typography>
							<button
								type="button"
								className={`kg-like-button ${kindergartenLiked ? 'active' : ''}`}
								onClick={() => likeKindergartenHandler(user, kindergarten?._id || '')}
								disabled={likingKindergarten || !kindergarten?._id}
								aria-label={kindergartenLiked ? t('kindergartenDetail.unlike') : t('kindergartenDetail.like')}
								aria-pressed={kindergartenLiked}
							>
								{kindergartenLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
							</button>
						</Stack>
						<Typography className="kg-detail-location">{locationText || kindergarten?.kindergartenLocation}</Typography>
						<Typography className="kg-detail-summary">{shortDescription}</Typography>
						<Stack className="kg-detail-fact-grid">
							<div><strong>{t('kindergartenDetail.ages')}</strong><span>{kindergarten?.kindergartenAgeRange || '1 - 6'} {t('kindergartenDetail.years')}</span></div>
							<div><strong>{t('kindergartenDetail.capacity')}</strong><span>{formatCount(kindergarten?.kindergartenCapacity, t('common.noData'))} {t('kindergartenDetail.children')}</span></div>
							<div><strong>{t('kindergartenDetail.groups')}</strong><span>{t('kindergartenDetail.groupsValue', { count: Math.max(1, Math.ceil((kindergarten?.kindergartenCapacity || 60) / 20)) })}</span></div>
							<div><strong>{t('kindergartenDetail.programs')}</strong><span>{t('kindergartenDetail.programsValue', { count: programsCount || visibleProgramKeys.length })}</span></div>
							<div><strong>{t('kindergartenDetail.languages')}</strong><span>{t('kindergartenDetail.languagesValue')}</span></div>
							<div><strong>{t('kindergartenDetail.centerType')}</strong><span>{kindergartenTypeLabel}</span></div>
						</Stack>
						{canUseParentDetailActions && (
							<Stack className="kg-detail-actions">
								<Button onClick={() => handleParentApplicationIntent('contact')} className="primary">{t('kindergartenDetail.contactCenter')}</Button>
								<Button onClick={() => handleParentApplicationIntent('visit')} className="secondary">{t('kindergartenDetail.requestVisit')}</Button>
							</Stack>
						)}
						{!canUseParentDetailActions && canManageThisKindergarten && (
							<Stack className="kg-detail-actions">
								<Button className="primary" onClick={() => router.push('/mypage?category=kindergartenProfile')}>
									{t('kindergartenDetail.manageCenter')}
								</Button>
							</Stack>
						)}
					</Stack>
				</Stack>

				<Stack className="kg-quick-facts">
					<div><span>{t('kindergartenDetail.hours')}</span><strong>07:30 - 18:30</strong></div>
					<div><span>{t('kindergartenDetail.programs')}</span><strong>{visibleProgramLabels.slice(0, 3).join(', ')}</strong></div>
					<div><span>{t('kindergartenDetail.languages')}</span><strong>{t('kindergartenDetail.languagesValue')}</strong></div>
					<div><span>{t('kindergartenDetail.meals')}</span><strong>{t('kindergartenDetail.healthyMeals')}</strong></div>
					<div><span>{t('kindergartenDetail.safety')}</span><strong>{t('kindergartenDetail.secureEntry')}</strong></div>
				</Stack>

				<Stack className="kg-detail-layout">
					<Stack className="kg-detail-main">
						<section className="kg-detail-panel kg-about-panel">
							<Typography component="h2">{t('kindergartenDetail.aboutTitle')}</Typography>
							<Typography>{shortDescription}</Typography>
							<ul>
								<li>{t('kindergartenDetail.aboutBullets.safe')}</li>
								<li>{t('kindergartenDetail.aboutBullets.play')}</li>
								<li>{t('kindergartenDetail.aboutBullets.teachers')}</li>
								<li>{t('kindergartenDetail.aboutBullets.parent')}</li>
							</ul>
						</section>

						<section className="kg-detail-panel kg-why-panel">
							<Typography component="h2">{t('kindergartenDetail.whyTitle')}</Typography>
							<ul>
								<li>{t('kindergartenDetail.whyBullets.teachers')}</li>
								<li>{t('kindergartenDetail.whyBullets.classrooms')}</li>
								<li>{t('kindergartenDetail.whyBullets.activities')}</li>
								<li>{t('kindergartenDetail.whyBullets.routines')}</li>
							</ul>
						</section>

						<section className="kg-detail-panel">
							<Stack className="kg-panel-heading">
								<Typography component="h2">{t('kindergartenDetail.programs')}</Typography>
								<span>{t('kindergartenDetail.programsValue', { count: programsCount || visibleProgramKeys.length })}</span>
							</Stack>
							<Stack className="kg-program-grid">
								{visibleProgramKeys.map((program) => (
									<div key={program}>
										<strong>{t(`kindergartenDetail.programsList.${program}`)}</strong>
										<span>{t('kindergartenDetail.designedForAges', { ageRange: kindergarten?.kindergartenAgeRange || '1 - 6' })}</span>
									</div>
								))}
							</Stack>
						</section>

						<section className="kg-detail-panel">
							<Typography component="h2">{t('kindergartenDetail.safetyFacilities')}</Typography>
							<Stack className="kg-facility-grid">
								{facilityKeys.map((facility) => (
									<div key={facility}>{t(`kindergartenDetail.facilities.${facility}`)}</div>
								))}
							</Stack>
						</section>

						{detailImages.length > 0 && (
							<section className="kg-detail-panel kg-gallery-panel" ref={gallerySectionRef}>
								<Typography component="h2">{t('kindergartenDetail.gallery')}</Typography>
								<Stack className="kg-gallery-grid">
									{detailImages.slice(0, 6).map((image, index) => (
										<img src={getImageUrl(image)} alt={t('kindergartenDetail.galleryAlt', { title, index: index + 1 })} key={`${image}-gallery-${index}`} />
									))}
								</Stack>
							</section>
						)}

						<section className="kg-detail-panel kg-review-panel">
							<Stack className="kg-panel-heading">
								<Typography component="h2">{t('kindergartenDetail.parentReviews')}</Typography>
								<span>{commentTotal} {t('kindergartenDetail.reviews')}</span>
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
								<Typography className="kg-review-title">{t('kindergartenDetail.shareFeedback')}</Typography>
								<textarea
									onChange={({ target: { value } }: any) => {
										setInsertCommentData({ ...insertCommentData, commentContent: value });
									}}
									value={insertCommentData.commentContent}
									placeholder={t('kindergartenDetail.reviewPlaceholder')}
								></textarea>
								<Button
									disabled={insertCommentData.commentContent === '' || user?._id === ''}
									onClick={createCommentHandler}
								>
									{t('kindergartenDetail.submitReview')}
								</Button>
							</Stack>
						</section>

						{destinationKindergarten.length !== 0 && (
							<section className="kg-detail-panel kg-similar-panel">
								<Typography component="h2">{t('kindergartenDetail.nearbyKindergartens')}</Typography>
								<Stack className="kg-similar-grid">
									{destinationKindergarten.slice(0, 3).map((item) => (
										<button
											type="button"
											key={item._id}
											onClick={() => router.push({ pathname: '/kindergartens/detail', query: { id: item._id } })}
										>
											<img src={getImageUrl(item.kindergartenImages?.[0])} alt={item.kindergartenTitle} />
											<strong>{item.kindergartenTitle}</strong>
											<span>{item.kindergartenLocation ? t(`filters.locations.${item.kindergartenLocation}`, { defaultValue: item.kindergartenLocation }) : ''}</span>
										</button>
									))}
								</Stack>
							</section>
						)}
					</Stack>

					<aside className="kg-detail-sidebar">
						<Stack className="kg-detail-side-card kg-detail-contact-card">
							<Typography component="h3">{t('kindergartenDetail.contactLocation')}</Typography>
							<p>{locationText || t('kindergartenDetail.locationAfterConfirmation')}</p>
							<NaverKindergartenMap
								latitude={kindergarten?.kindergartenLatitude}
								longitude={kindergarten?.kindergartenLongitude}
								address={kindergarten?.kindergartenAddress}
								title={title}
							/>
							{canUseParentDetailActions && (
								<Button className="primary" onClick={() => handleParentApplicationIntent('contact')}>{t('kindergartenDetail.contactCenter')}</Button>
							)}
						</Stack>
						<Stack className="kg-detail-side-card kg-fee-card">
							<Typography component="h3">{t('kindergartenDetail.monthlyFee')}</Typography>
							<strong>{formatMonthlyFee(kindergarten?.monthlyFee ?? kindergarten?.kindergartenPrice)}</strong>
							<span>{t('kindergartenDetail.feeNote')}</span>
						</Stack>
						{user?._id && user.memberType === MemberType.PARENT && (
							<Stack className="kg-detail-side-card kg-application-card" ref={applicationCardRef}>
								<Typography component="h3">{t('kindergartenDetail.applyTitle')}</Typography>
								{applicationIntent === 'contact' && !hasOpenApplication && (
									<p className="kg-application-intent">
										{t('kindergartenDetail.contactIntent')}
									</p>
								)}
								{applicationIntent === 'visit' && !hasOpenApplication && (
									<p className="kg-application-intent">
										{t('kindergartenDetail.visitIntent')}
									</p>
								)}
								{currentApplication && (
									<p className={`status ${currentApplication.status.toLowerCase()}`}>
										{t('kindergartenDetail.currentApplication', { status: getApplicationStatusLabel(currentApplication.status) })}
									</p>
								)}
								{!applicationFormOpen && (
									<Button
										className="primary"
										disabled={hasOpenApplication || submittingApplication}
										onClick={() => openApplicationForm('application')}
									>
										{hasOpenApplication ? t('kindergartenDetail.applicationInReview') : t('kindergartenDetail.applyTitle')}
									</Button>
								)}
								{applicationFormOpen && (
									<Stack spacing={1.5}>
										<TextField
											fullWidth
											size="small"
											label={t('kindergartenDetail.childName')}
											inputRef={applicationChildNameRef}
											value={applicationForm.childName}
											onChange={(event) => setApplicationForm({ ...applicationForm, childName: event.target.value })}
										/>
										<TextField
											fullWidth
											size="small"
											label={t('kindergartenDetail.childAge')}
											type="number"
											value={applicationForm.childAge}
											onChange={(event) => setApplicationForm({ ...applicationForm, childAge: event.target.value })}
										/>
										<TextField
											fullWidth
											multiline
											minRows={3}
											label={t('kindergartenDetail.parentMessage')}
											inputRef={applicationMessageRef}
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
												{t('kindergartenDetail.documentsHelp')}
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
													? t('kindergartenDetail.uploading')
													: creatingApplication
													? t('kindergartenDetail.submitting')
													: t('kindergartenDetail.submitApplication')}
											</Button>
											<Button
												className="secondary"
												onClick={() => {
													setApplicationFormOpen(false);
													setApplicationIntent('application');
													setApplicationForm({ childName: '', childAge: '', parentMessage: '' });
													setApplicationFiles([]);
													setApplicationFileError('');
												}}
											>
												{t('kindergartenDetail.cancel')}
											</Button>
										</Stack>
									</Stack>
								)}
							</Stack>
						)}
						{canViewTeacherApplicationCard && (
							<Stack className="kg-detail-side-card kg-teacher-apply-card">
								<Typography component="h3">{t('kindergartenDetail.applyAsTeacher')}</Typography>
								{!user?._id && (
									<>
										<p>{t('kindergartenDetail.signInTeacher')}</p>
										<Button className="primary" onClick={applyAsTeacherHandler}>{t('kindergartenDetail.loginToApply')}</Button>
									</>
								)}
								{user?._id && user.memberType === MemberType.PARENT && (
									<>
										{hasPendingStaffApplication && <p className="status pending">{t('kindergartenDetail.applicationPending')}</p>}
										{hasApprovedStaffApplication && <p className="status approved">{t('kindergartenDetail.applicationApproved')}</p>}
										{currentStaffApplication?.applicationStatus === StaffApplicationStatus.REJECTED && (
											<p className="status rejected">{t('kindergartenDetail.previousRejected')}</p>
										)}
										{currentStaffApplication?.applicationStatus === StaffApplicationStatus.CANCELED && (
											<p className="status">{t('kindergartenDetail.previousCanceled')}</p>
										)}
										<TextField
											multiline
											minRows={3}
											placeholder={t('kindergartenDetail.teacherMessagePlaceholder')}
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
												? t('kindergartenDetail.submitting')
												: hasPendingStaffApplication
												? t('kindergartenDetail.applicationPending')
												: hasApprovedStaffApplication
												? t('kindergartenDetail.applicationApproved')
												: t('kindergartenDetail.applyAsTeacher')}
										</Button>
									</>
								)}
							</Stack>
						)}
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
