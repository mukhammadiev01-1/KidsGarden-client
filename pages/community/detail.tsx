import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import axios from 'axios';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import {
	Button,
	Stack,
	Typography,
	Tab,
	Tabs,
	IconButton,
	Backdrop,
	Pagination,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import Moment from 'react-moment';
import { userVar } from '../../apollo/store';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatIcon from '@mui/icons-material/Chat';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import dynamic from 'next/dynamic';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import EditIcon from '@mui/icons-material/Edit';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { sweetErrorHandling, sweetLoginConfirmAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { BoardArticleCategory, BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { getImageUrl, REACT_APP_API_GRAPHQL_URL } from '../../libs/config';
import { getJwtToken } from '../../libs/auth';
const ToastViewerComponent = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

const ARTICLE_IMAGE_FALLBACK = '/img/kidsgarden/articles/article-play-based-learning.png';

const getRawArticleImage = (article?: BoardArticle): string => {
	const rawImage = Array.isArray((article as any)?.articleImage)
		? (article as any).articleImage[0]
		: article?.articleImage;

	return rawImage || '';
};

const resolveArticleImage = (article?: BoardArticle): string => {
	return getImageUrl(getRawArticleImage(article), ARTICLE_IMAGE_FALLBACK);
};

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CommunityDetail: NextPage = ({ initialInput, ...props }: T) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { query } = router;

	const articleId = query?.id as string;
	const articleCategory = query?.articleCategory as string;
	const getCategoryLabel = (category: string) => t(`community.categories.${category}`, t('community.categories.fallback'));
	const visibleCategories = [BoardArticleCategory.FREE, BoardArticleCategory.NEWS];

	const [comment, setComment] = useState<string>('');
	const [wordsCnt, setWordsCnt] = useState<number>(0);
	const [updatedCommentWordsCnt, setUpdatedCommentWordsCnt] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState<CommentsInquiry>({
		...initialInput,
	});
	const [memberImage, setMemberImage] = useState<string>(ARTICLE_IMAGE_FALLBACK);
	const [anchorEl, setAnchorEl] = useState<any | null>(null);
	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;
	const [openBackdrop, setOpenBackdrop] = useState<boolean>(false);
	const [updatedComment, setUpdatedComment] = useState<string>('');
	const [updatedCommentId, setUpdatedCommentId] = useState<string>('');
	const [likeLoading, setLikeLoading] = useState<boolean>(false);
	const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
	const [boardArticle, setBoardArticle] = useState<BoardArticle>();
	const [editOpen, setEditOpen] = useState<boolean>(false);
	const [editTitle, setEditTitle] = useState<string>('');
	const [editContent, setEditContent] = useState<string>('');
	const [editImage, setEditImage] = useState<string>('');
	const [editImagePreview, setEditImagePreview] = useState<string>(ARTICLE_IMAGE_FALLBACK);
	const [editError, setEditError] = useState<string>('');
	const [editSaving, setEditSaving] = useState<boolean>(false);
	const [editImageUploading, setEditImageUploading] = useState<boolean>(false);
	const isParent = user.memberType === MemberType.PARENT;
	const isLoggedIn = Boolean(user?._id);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);
	const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

	const getCommentMemberImage = (imageUrl: string | undefined) => {
		return getImageUrl(imageUrl, ARTICLE_IMAGE_FALLBACK);
	};

	const syncArticleState = (targetArticle?: BoardArticle) => {
		setBoardArticle(targetArticle || undefined);
		setMemberImage(getCommentMemberImage(targetArticle?.memberData?.memberImage));
	};

	const syncCommentsState = (data: T) => {
		setComments(data?.getComments?.list ?? []);
		setTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
	};

	const buildLocalComment = (createdComment: Comment): Comment => ({
		...createdComment,
		memberData: {
			_id: user._id,
			memberNick: user.memberNick,
			memberFullName: user.memberFullName,
			memberImage: user.memberImage,
			memberDesc: user.memberDesc,
		} as any,
	});

	const {
		loading: getBoardArticleLoading,
		error: getBoardArticleError,
		refetch: getBoardArticleRefetch,
	} = useQuery(GET_BOARD_ARTICLE, {
		skip: !articleId,
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		onCompleted: (data: T) => syncArticleState(data?.getBoardArticle),
		onError: () => setBoardArticle(undefined),
	});

	const { loading: getCommentsLoading, refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		skip: !searchFilter?.search?.commentRefId,
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		onCompleted: syncCommentsState,
		onError: () => {
			setComments([]);
			setTotal(0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (articleId) {
			setSearchFilter((prev) => ({ ...prev, page: 1, search: { commentRefId: articleId } }));
		}
	}, [articleId]);

	/** HANDLERS **/
	const buildCommentsInput = (page = searchFilter.page): CommentsInquiry => ({
		...searchFilter,
		page,
		search: {
			...searchFilter.search,
			commentRefId: articleId || searchFilter.search.commentRefId,
		},
	});

	const tabChangeHandler = (event: React.SyntheticEvent, value: string) => {
		router.replace(
			{
				pathname: '/community',
				query: { articleCategory: value },
			},
			'/community',
			{ shallow: true },
		);
	};

	const creteCommentHandler = async () => {
		try {
			if (!articleId || !comment.trim() || commentSubmitting) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('comments.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}

			const nextComment = comment.trim();
			setCommentSubmitting(true);
			const createdResult = await createComment({
				variables: {
					input: {
						commentGroup: CommentGroup.ARTICLE,
						commentContent: nextComment,
						commentRefId: articleId,
					},
				},
			});
			const createdComment = createdResult.data?.createComment as Comment | undefined;
			setComment('');
			setWordsCnt(0);
			const nextSearchFilter = buildCommentsInput(1);
			setSearchFilter(nextSearchFilter);
			if (createdComment?._id) {
				const localComment = buildLocalComment(createdComment);
				setComments((prev) => [localComment, ...prev.filter((item) => item._id !== localComment._id)].slice(0, nextSearchFilter.limit));
				setTotal((prev) => prev + 1);
				setBoardArticle((prev) =>
					prev
						? {
								...prev,
								articleComments: (prev.articleComments || 0) + 1,
						  }
						: prev,
				);
			}
			const [commentsResult, articleResult] = await Promise.all([
				getCommentsRefetch({ input: nextSearchFilter }),
				getBoardArticleRefetch({ input: articleId }),
			]);
			const refetchedComments = commentsResult.data?.getComments?.list ?? [];
			if (createdComment?._id && !refetchedComments.some((item: Comment) => item._id === createdComment._id)) {
				setComments(
					[buildLocalComment(createdComment), ...refetchedComments.filter((item: Comment) => item._id !== createdComment._id)].slice(
						0,
						nextSearchFilter.limit,
					),
				);
				setTotal((prev) => Math.max(commentsResult.data?.getComments?.metaCounter?.[0]?.total ?? 0, prev));
			} else {
				syncCommentsState(commentsResult.data);
			}
			syncArticleState(articleResult.data?.getBoardArticle);
			await sweetTopSmallSuccessAlert(t('comments.submitted'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setCommentSubmitting(false);
		}
	};

	const updateButtonHandler = async (commentId: string, commentStatus?: CommentStatus.DELETE) => {
		try {
			if (!commentId) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('comments.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}

			if (!commentStatus && !updatedComment.trim()) return;

			const input = commentStatus
				? { _id: commentId, commentStatus }
				: { _id: commentId, commentContent: updatedComment.trim() };

			await updateComment({ variables: { input } });
			setOpenBackdrop(false);
			setUpdatedComment('');
			setUpdatedCommentWordsCnt(0);
			const nextSearchFilter = buildCommentsInput();
			const [commentsResult, articleResult] = await Promise.all([
				getCommentsRefetch({ input: nextSearchFilter }),
				getBoardArticleRefetch({ input: articleId }),
			]);
			syncCommentsState(commentsResult.data);
			syncArticleState(articleResult.data?.getBoardArticle);
			await sweetTopSmallSuccessAlert(commentStatus ? t('comments.removed') : t('comments.updated'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const cancelButtonHandler = () => {
		setOpenBackdrop(false);
		setUpdatedComment('');
		setUpdatedCommentWordsCnt(0);
	};

	const updateCommentInputHandler = (value: string) => {
		if (value.length > 100) return;
		setUpdatedCommentWordsCnt(value.length);
		setUpdatedComment(value);
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const writeButtonHandler = async () => {
		if (!isLoggedIn) {
			const confirmed = await sweetLoginConfirmAlert(t('comments.loginRequired'));
			if (confirmed) await router.push('/account/join');
			return;
		}

		if (!isParent) return;
		await router.push({
			pathname: '/mypage',
			query: {
				category: 'writeArticle',
			},
		});
	};

	const likeBoardArticleHandler = async () => {
		let previousArticle: BoardArticle | undefined;
		try {
			if (!articleId || likeLoading) return;
			if (!user?._id) {
				const confirmed = await sweetLoginConfirmAlert(t('comments.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}

			setLikeLoading(true);
			previousArticle = boardArticle;
			const currentlyLiked = Boolean(boardArticle?.meLiked?.[0]?.myFavorite);
			setBoardArticle((prev) =>
				prev
					? {
							...prev,
							articleLikes: Math.max(0, (prev.articleLikes || 0) + (currentlyLiked ? -1 : 1)),
							meLiked: [
								{
									memberId: user._id,
									likeRefId: articleId,
									myFavorite: !currentlyLiked,
								},
							],
					  }
					: prev,
			);
			const likeResult = await likeTargetBoardArticle({ variables: { input: articleId } });
			const mutationArticle = likeResult.data?.likeTargetBoardArticle as BoardArticle | undefined;
			if (mutationArticle) {
				setBoardArticle((prev) =>
					prev
						? {
								...prev,
								...mutationArticle,
								meLiked: [
									{
										memberId: user._id,
										likeRefId: articleId,
										myFavorite: !currentlyLiked,
									},
								],
						  }
						: mutationArticle,
				);
			}
			const articleResult = await getBoardArticleRefetch({ input: articleId });
			syncArticleState(articleResult.data?.getBoardArticle);
		} catch (err: any) {
			if (previousArticle) syncArticleState(previousArticle);
			await sweetErrorHandling(err);
		} finally {
			setLikeLoading(false);
		}
	};

	const openArticleEditHandler = () => {
		if (!boardArticle) return;
		setEditTitle(boardArticle.articleTitle || '');
		setEditContent(boardArticle.articleContent || '');
		setEditImage(getRawArticleImage(boardArticle));
		setEditImagePreview(resolveArticleImage(boardArticle));
		setEditError('');
		setEditOpen(true);
	};

	const closeArticleEditHandler = () => {
		if (editSaving) return;
		setEditOpen(false);
		setEditError('');
	};

	const uploadEditImageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const file = event.target.files?.[0];
			if (!file) return;

			const token = getJwtToken();
			if (!token) {
				const confirmed = await sweetLoginConfirmAlert(t('comments.loginRequired'));
				if (confirmed) await router.push('/account/join');
				return;
			}

			setEditImageUploading(true);
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target)
					}`,
					variables: {
						file: null,
						target: 'article',
					},
				}),
			);
			formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
			formData.append('0', file);

			const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data?.data?.imageUploader;
			if (!responseImage) throw new Error(t('article.imageUploadFailed'));

			setEditImage(responseImage);
			setEditImagePreview(getImageUrl(responseImage, ARTICLE_IMAGE_FALLBACK));
			setEditError('');
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setEditImageUploading(false);
			event.target.value = '';
		}
	};

	const saveArticleEditHandler = async () => {
		try {
			if (!boardArticle?._id || editSaving || editImageUploading) return;
			const nextTitle = editTitle.trim();
			const nextContent = editContent.trim();

			if (nextTitle.length < 3 || nextTitle.length > 50) {
				setEditError(t('article.titleLength'));
				return;
			}
			if (nextContent.length < 3 || nextContent.length > 250) {
				setEditError(t('article.contentLength'));
				return;
			}

			setEditSaving(true);
			await updateBoardArticle({
				variables: {
					input: {
						_id: boardArticle._id,
						articleTitle: nextTitle,
						articleContent: nextContent,
						articleImage: editImage,
					},
				},
			});
			await getBoardArticleRefetch({ input: boardArticle._id });
			setEditOpen(false);
			setEditError('');
			await sweetTopSmallSuccessAlert(t('article.updated'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setEditSaving(false);
		}
	};

	const articleLiked = Boolean(boardArticle?.meLiked?.[0]?.myFavorite);
	const articleCoverImage = resolveArticleImage(boardArticle);
	const renderArticleLikeContent = () => (
		<>
			{articleLiked ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />}
			<Typography className="text">{boardArticle?.articleLikes}</Typography>
		</>
	);
	const canEditArticle =
		isLoggedIn &&
		boardArticle?.memberId === user?._id &&
		boardArticle?.articleCategory === BoardArticleCategory.FREE &&
		boardArticle?.articleStatus === BoardArticleStatus.ACTIVE;

	return (
			<div id="community-detail-page">
				<div className="container">
					<Stack className="main-box">
						<Stack className="left-config">
							<Stack className={'image-info'}>
								<span className="community-detail-icon" aria-hidden="true">KG</span>
								<Stack className={'community-name'}>
									<Typography className={'name'}>{t('article.communityArticle')}</Typography>
								</Stack>
							</Stack>
							<Tabs
								orientation="vertical"
								aria-label={t('article.tabsLabel')}
								TabIndicatorProps={{
									style: { display: 'none' },
								}}
								onChange={tabChangeHandler}
								value={visibleCategories.includes(articleCategory as BoardArticleCategory) ? articleCategory : false}
							>
								{visibleCategories.map((category) => (
									<Tab
										value={category}
										label={getCategoryLabel(category)}
										className={`tab-button ${articleCategory === category ? 'active' : ''}`}
										key={category}
									/>
								))}
							</Tabs>
						</Stack>
						<div className="community-detail-config">
							<Stack className="title-box">
								<Stack className="left">
									<Typography className="title">{t('article.parentCommunity')}</Typography>
									<Typography className="sub-title">
										{t('article.detailSubtitle')}
									</Typography>
								</Stack>
								{isParent && (
									<Button onClick={writeButtonHandler} className="right">
										{t('article.write')}
									</Button>
								)}
								{!isLoggedIn && (
									<Button onClick={writeButtonHandler} className="right">
										{t('article.joinToWrite')}
									</Button>
								)}
							</Stack>
							<div className="config">
								{getBoardArticleLoading && (
									<Stack className="first-box-config">
										<Typography>{t('article.loading')}</Typography>
									</Stack>
								)}
								{!getBoardArticleLoading && getBoardArticleError && (
									<Stack className="first-box-config">
										<Typography>{t('article.loadError')}</Typography>
									</Stack>
								)}
								{!getBoardArticleLoading && !getBoardArticleError && !boardArticle && (
									<Stack className="first-box-config">
										<Typography>{t('article.notFound')}</Typography>
									</Stack>
								)}
								{!getBoardArticleLoading && !getBoardArticleError && boardArticle && (
									<Stack className="first-box-config">
										<Stack className="content-and-info">
											<Stack className="content">
												<Typography className="content-data">{boardArticle?.articleTitle}</Typography>
												<Stack className="member-info">
													<img
														src={memberImage}
														alt=""
														className="member-img"
													/>
													<Typography className="member-nick">
														{boardArticle?.memberData?.memberNick}
													</Typography>
													<Stack className="divider"></Stack>
													<Moment className={'time-added'} format={'DD.MM.YY HH:mm'}>
														{boardArticle?.createdAt}
													</Moment>
												</Stack>
											</Stack>
											<Stack className="info">
												{canEditArticle && (
													<Button
														type="button"
														onClick={openArticleEditHandler}
														startIcon={<EditIcon />}
														sx={{
															minHeight: 34,
															px: 1.5,
															borderRadius: '999px',
															border: '1px solid #d7eadc',
															color: '#2f7d4a',
															background: '#f4fbf3',
															textTransform: 'none',
															fontSize: '12px',
															fontWeight: 800,
															'&:hover': {
																background: '#e8f6e5',
																borderColor: '#b9dfc3',
															},
														}}
													>
														{t('article.edit')}
													</Button>
												)}
												<Button
													type="button"
													className="icon-info"
													onClick={likeBoardArticleHandler}
													disabled={likeLoading}
													aria-label={articleLiked ? t('article.unlike') : t('article.like')}
													sx={{
														minWidth: 0,
														p: 0,
														color: 'inherit',
														textTransform: 'none',
														'&.Mui-disabled': { opacity: 0.72 },
													}}
												>
													{renderArticleLikeContent()}
												</Button>
												<Stack className="divider"></Stack>
												<Stack className="icon-info">
													<VisibilityIcon />
													<Typography className="text">{boardArticle?.articleViews}</Typography>
												</Stack>
												<Stack className="divider"></Stack>
												<Stack className="icon-info">
													{boardArticle?.articleComments && boardArticle?.articleComments > 0 ? (
														<ChatIcon />
													) : (
														<ChatBubbleOutlineRoundedIcon />
													)}

													<Typography className="text">{boardArticle?.articleComments}</Typography>
												</Stack>
											</Stack>
										</Stack>
										<figure className="article-cover">
											<img src={articleCoverImage} alt={boardArticle?.articleTitle || t('article.coverAlt')} />
										</figure>
										<Stack>
											<ToastViewerComponent markdown={boardArticle?.articleContent} className={'ytb_play'} />
										</Stack>
										<Stack className="like-and-dislike">
											<Stack className="top">
										<Button onClick={likeBoardArticleHandler} disabled={likeLoading}>
											{renderArticleLikeContent()}
												</Button>
											</Stack>
										</Stack>
									</Stack>
								)}
								<Dialog
									open={editOpen}
									onClose={closeArticleEditHandler}
									fullWidth
									maxWidth="sm"
									PaperProps={{
										sx: {
											borderRadius: '18px',
											border: '1px solid #e1efe5',
											boxShadow: '0 24px 70px rgba(47, 74, 59, 0.18)',
										},
									}}
								>
									<DialogTitle sx={{ color: '#24332d', fontWeight: 800, pb: 1 }}>
										{t('article.editTitle')}
									</DialogTitle>
									<DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
										<Typography sx={{ color: '#64746b', fontSize: '14px', lineHeight: 1.5 }}>
											{t('article.editHelp')}
										</Typography>
										<TextField
											label={t('article.title')}
											value={editTitle}
											onChange={(event) => {
												setEditTitle(event.target.value);
												if (editError) setEditError('');
											}}
											inputProps={{ maxLength: 50 }}
											fullWidth
										/>
										<TextField
											label={t('article.content')}
											value={editContent}
											onChange={(event) => {
												setEditContent(event.target.value);
												if (editError) setEditError('');
											}}
											inputProps={{ maxLength: 250 }}
											multiline
											minRows={5}
											fullWidth
										/>
										<Stack gap={1.25}>
											<Typography sx={{ color: '#24332d', fontSize: '13px', fontWeight: 800 }}>
												{t('article.coverImage')}
											</Typography>
											<Stack
												direction={{ xs: 'column', sm: 'row' }}
												gap={1.5}
												alignItems={{ xs: 'stretch', sm: 'center' }}
											>
												<img
													src={editImagePreview}
													alt={t('article.coverPreviewAlt')}
													style={{
														width: 150,
														height: 92,
														objectFit: 'cover',
														borderRadius: 14,
														border: '1px solid #e1efe5',
														background: '#f7fbf5',
													}}
												/>
												<Stack gap={0.75}>
													<Button
														component="label"
														variant="outlined"
														disabled={editSaving || editImageUploading}
														sx={{
															borderColor: '#b9dfc3',
															color: '#2f7d4a',
															borderRadius: '999px',
															textTransform: 'none',
															fontWeight: 800,
														}}
													>
														{editImageUploading ? t('article.uploading') : t('article.replaceCoverImage')}
														<input type="file" hidden accept="image/*" onChange={uploadEditImageHandler} />
													</Button>
													<Typography sx={{ color: '#7d8d84', fontSize: '12px', lineHeight: 1.4 }}>
														{t('article.coverHelp')}
													</Typography>
												</Stack>
											</Stack>
										</Stack>
										<Stack direction="row" justifyContent="space-between" gap={2}>
											<Typography sx={{ color: editError ? '#b42318' : '#7d8d84', fontSize: '12px' }}>
												{editError || t('article.ownerEditOnly')}
											</Typography>
											<Typography sx={{ color: '#9ca3af', fontSize: '12px', flexShrink: 0 }}>
												{editContent.trim().length}/250
											</Typography>
										</Stack>
									</DialogContent>
									<DialogActions sx={{ px: 3, pb: 3 }}>
										<Button
											onClick={closeArticleEditHandler}
											disabled={editSaving}
											sx={{ color: '#64746b', textTransform: 'none', fontWeight: 700 }}
										>
											{t('comments.cancel')}
										</Button>
										<Button
											onClick={saveArticleEditHandler}
											disabled={editSaving || editImageUploading}
											variant="contained"
											sx={{
												background: '#2f7d4a',
												borderRadius: '999px',
												textTransform: 'none',
												fontWeight: 800,
												px: 2.5,
												'&:hover': { background: '#256a3d' },
											}}
										>
											{editSaving ? t('article.saving') : t('article.saveChanges')}
										</Button>
									</DialogActions>
								</Dialog>
								<Stack
									className="second-box-config"
									sx={{ borderBottom: total > 0 ? 'none' : '1px solid #eee', border: '1px solid #eee' }}
								>
									<Typography className="title-text">{t('comments.sectionTitle')} ({total})</Typography>
									<Stack className="leave-comment">
										<input
											type="text"
											placeholder={t('comments.placeholder')}
											value={comment}
											onChange={(e) => {
												if (e.target.value.length > 100) return;
												setWordsCnt(e.target.value.length);
												setComment(e.target.value);
											}}
										/>
										<Stack className="button-box">
											<Typography>{wordsCnt}/100</Typography>
											<Button onClick={creteCommentHandler} disabled={commentSubmitting}>
												{commentSubmitting ? t('comments.posting') : t('comments.comment')}
											</Button>
										</Stack>
									</Stack>
								</Stack>
								{total > 0 && (
									<Stack className="comments">
										<Typography className="comments-title">{t('comments.parentComments')}</Typography>
									</Stack>
								)}
								{getCommentsLoading && (
									<Stack className="comments-box">
										<Typography>{t('comments.loading')}</Typography>
									</Stack>
								)}
								{!getCommentsLoading && total === 0 && (
									<Stack className="comments-box">
										<Typography>{t('comments.empty')}</Typography>
									</Stack>
								)}
								{comments?.map((commentData, index) => {
									return (
										<Stack className="comments-box" key={commentData?._id}>
											<Stack className="main-comment">
												<Stack className="member-info">
													<Stack className="name-date">
														<img src={getCommentMemberImage(commentData?.memberData?.memberImage)} alt="" />
														<Stack className="name-date-column">
															<Typography className="name">{commentData?.memberData?.memberNick}</Typography>
															<Typography className="date">
																<Moment className={'time-added'} format={'DD.MM.YY HH:mm'}>
																	{commentData?.createdAt}
																</Moment>
															</Typography>
														</Stack>
													</Stack>
													{commentData?.memberId === user?._id && (
														<Stack className="buttons">
															<IconButton
																onClick={() => {
																	setUpdatedCommentId(commentData?._id);
																	updateButtonHandler(commentData?._id, CommentStatus.DELETE);
																}}
															>
																<DeleteForeverIcon sx={{ color: '#757575', cursor: 'pointer' }} />
															</IconButton>
															<IconButton
																onClick={(e) => {
																	setUpdatedComment(commentData?.commentContent);
																	setUpdatedCommentWordsCnt(commentData?.commentContent?.length);
																	setUpdatedCommentId(commentData?._id);
																	setOpenBackdrop(true);
																}}
															>
																<EditIcon sx={{ color: '#757575' }} />
															</IconButton>
															<Backdrop
																sx={{
																	top: '40%',
																	right: '25%',
																	left: '25%',
																	width: '1000px',
																	height: 'fit-content',
																	borderRadius: '10px',
																	color: '#ffffff',
																	zIndex: 999,
																}}
																open={openBackdrop}
															>
																<Stack
																	sx={{
																		width: '100%',
																		height: '100%',
																		background: 'white',
																		border: '1px solid #b9b9b9',
																		padding: '15px',
																		gap: '10px',
																		borderRadius: '10px',
																		boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
																	}}
																>
																	<Typography variant="h4" color={'#b9b9b9'}>
																		{t('comments.updateTitle')}
																	</Typography>
																	<Stack gap={'20px'}>
																		<input
																			autoFocus
																			value={updatedComment}
																			onChange={(e) => updateCommentInputHandler(e.target.value)}
																			type="text"
																			style={{
																				border: '1px solid #b9b9b9',
																				outline: 'none',
																				height: '40px',
																				padding: '0px 10px',
																				borderRadius: '5px',
																			}}
																		/>
																		<Stack width={'100%'} flexDirection={'row'} justifyContent={'space-between'}>
																			<Typography variant="subtitle1" color={'#b9b9b9'}>
																				{updatedCommentWordsCnt}/100
																			</Typography>
																			<Stack sx={{ flexDirection: 'row', alignSelf: 'flex-end', gap: '10px' }}>
																				<Button
																					variant="outlined"
																					color="inherit"
																					onClick={() => cancelButtonHandler()}
																				>
																					{t('comments.cancel')}
																				</Button>
																				<Button
																					variant="contained"
																					color="inherit"
																					onClick={() => updateButtonHandler(updatedCommentId, undefined)}
																				>
																					{t('comments.update')}
																				</Button>
																			</Stack>
																		</Stack>
																	</Stack>
																</Stack>
															</Backdrop>
														</Stack>
													)}
												</Stack>
												<Stack className="content">
													<Typography>{commentData?.commentContent}</Typography>
												</Stack>
											</Stack>
										</Stack>
									);
								})}
								{total > 0 && (
									<Stack className="pagination-box">
										<Pagination
											count={Math.ceil(total / searchFilter.limit) || 1}
											page={searchFilter.page}
											shape="circular"
											color="primary"
											onChange={paginationHandler}
										/>
									</Stack>
								)}
							</div>
						</div>
					</Stack>
				</div>
			</div>
		);
};
CommunityDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: '' },
	},
};

export default withLayoutBasic(CommunityDetail);
