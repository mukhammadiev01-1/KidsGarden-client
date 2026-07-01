import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useMutation, useQuery } from '@apollo/client';
import {
	Avatar,
	Box,
	Button,
	Divider,
	MenuItem,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import Moment from 'react-moment';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { GET_ALL_COMMENTS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_COMMENT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { AdminCommentsInquiry } from '../../../libs/types/comment/comment.input';
import { Comment } from '../../../libs/types/comment/comment';
import { CommentGroup, CommentStatus } from '../../../libs/enums/comment.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';
import { useAdminTranslation } from '../../../libs/i18n/adminTranslator';

const truncateId = (value?: string) => {
	if (!value) return '-';
	return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
};

const buildSearch = (status: string, group: string, refId: string, memberId: string) => {
	const search: AdminCommentsInquiry['search'] = {};
	if (status !== 'ALL') search.commentStatus = status as CommentStatus;
	if (group !== 'ALL') search.commentGroup = group as CommentGroup;
	if (refId.trim()) search.commentRefId = refId.trim();
	if (memberId.trim()) search.memberId = memberId.trim();
	return search;
};

const AdminCommunityComments: NextPage = ({ initialInquiry, ...props }: any) => {
	const { t, statusLabel, categoryLabel } = useAdminTranslation();
	const [commentsInquiry, setCommentsInquiry] = useState<AdminCommentsInquiry>(initialInquiry);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [statusFilter, setStatusFilter] = useState<string>(CommentStatus.ACTIVE);
	const [groupFilter, setGroupFilter] = useState<string>('ALL');
	const [refIdFilter, setRefIdFilter] = useState<string>('');
	const [memberIdFilter, setMemberIdFilter] = useState<string>('');

	const { loading, error, refetch } = useQuery(GET_ALL_COMMENTS_BY_ADMIN, {
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
		variables: { input: commentsInquiry },
		onCompleted: (data: any) => {
			setComments(data?.getAllCommentsByAdmin?.list ?? []);
			setCommentTotal(data?.getAllCommentsByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => {
			setComments([]);
			setCommentTotal(0);
		},
	});
	const [updateCommentByAdmin] = useMutation(UPDATE_COMMENT_BY_ADMIN);

	const applyFilters = async (nextStatus = statusFilter, nextGroup = groupFilter) => {
		setCommentsInquiry({
			...commentsInquiry,
			page: 1,
			search: buildSearch(nextStatus, nextGroup, refIdFilter, memberIdFilter),
		});
	};

	const clearFilters = async () => {
		setStatusFilter(CommentStatus.ACTIVE);
		setGroupFilter('ALL');
		setRefIdFilter('');
		setMemberIdFilter('');
		setCommentsInquiry({
			...commentsInquiry,
			page: 1,
			search: { commentStatus: CommentStatus.ACTIVE },
		});
	};

	const changeStatusFilterHandler = async (value: string) => {
		setStatusFilter(value);
		await applyFilters(value, groupFilter);
	};

	const changeGroupFilterHandler = async (value: string) => {
		setGroupFilter(value);
		await applyFilters(statusFilter, value);
	};

	const changePageHandler = async (event: unknown, newPage: number) => {
		setCommentsInquiry({ ...commentsInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setCommentsInquiry({ ...commentsInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const updateCommentStatusHandler = async (commentId: string, commentStatus: CommentStatus) => {
		try {
			await updateCommentByAdmin({
				variables: {
					input: {
						_id: commentId,
						commentStatus,
					},
				},
			});
			await refetch({ input: commentsInquiry });
			await sweetMixinSuccessAlert(t('adminPages.communityComments.statusUpdated'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const renderRows = () => {
		if (loading) {
			return (
				<TableRow>
					<TableCell colSpan={8} align="center">
						{t('adminPages.communityComments.loading')}
					</TableCell>
				</TableRow>
			);
		}

		if (error) {
			return (
				<TableRow>
					<TableCell colSpan={8} align="center">
						{t('adminPages.communityComments.loadError')}
					</TableCell>
				</TableRow>
			);
		}

		if (!comments.length) {
			return (
				<TableRow>
					<TableCell colSpan={8} align="center">
						{t('adminPages.communityComments.empty')}
					</TableCell>
				</TableRow>
			);
		}

		return comments.map((comment) => (
			<TableRow hover key={comment._id}>
				<TableCell align="left">
					<Typography sx={{ maxWidth: 280 }} noWrap title={comment.commentContent}>
						{comment.commentContent}
					</Typography>
				</TableCell>
				<TableCell align="center">
					<Select
						size="small"
						value={comment.commentStatus}
						onChange={(event) =>
							updateCommentStatusHandler(comment._id, event.target.value as CommentStatus)
						}
						sx={{ minWidth: 120 }}
					>
						<MenuItem value={CommentStatus.ACTIVE}>{statusLabel(CommentStatus.ACTIVE)}</MenuItem>
						<MenuItem value={CommentStatus.DELETE}>{statusLabel(CommentStatus.DELETE)}</MenuItem>
					</Select>
				</TableCell>
				<TableCell align="center">{categoryLabel(comment.commentGroup)}</TableCell>
				<TableCell align="left">
					<Typography title={comment.commentRefId}>{truncateId(comment.commentRefId)}</Typography>
				</TableCell>
				<TableCell align="left" className="name">
					<Stack direction="row" alignItems="center" gap="8px">
						<Avatar
							alt={comment?.memberData?.memberNick || t('adminTables.author')}
							src={
								comment?.memberData?.memberImage
									? `${REACT_APP_API_URL}/${comment.memberData.memberImage}`
									: '/img/profile/defaultUser.svg'
							}
						/>
						<Typography sx={{ maxWidth: 160 }} noWrap>
							{comment?.memberData?.memberFullName || comment?.memberData?.memberNick || t('adminTables.unknownAuthor')}
						</Typography>
					</Stack>
				</TableCell>
				<TableCell align="left">
					<Typography title={comment.memberId}>{truncateId(comment.memberId)}</Typography>
				</TableCell>
				<TableCell align="left">
					<Moment format="DD.MM.YY HH:mm">{comment.createdAt}</Moment>
				</TableCell>
				<TableCell align="left">
					<Moment format="DD.MM.YY HH:mm">{comment.updatedAt}</Moment>
				</TableCell>
			</TableRow>
		));
	};

	return (
		<Box component="div" className="content">
			<Typography variant="h2" className="tit" sx={{ mb: '24px' }}>
				{t('adminPages.communityComments.title')}
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				{t('adminPages.communityComments.subtitle')}
			</Typography>

			<Box component="div" className="table-wrap">
				<Stack className="search-area" sx={{ m: '24px', gap: '12px', flexDirection: 'row', flexWrap: 'wrap' }}>
					<Select sx={{ width: 150 }} value={statusFilter} onChange={(e) => changeStatusFilterHandler(e.target.value)}>
						{['ALL', CommentStatus.ACTIVE, CommentStatus.DELETE].map((value) => (
							<MenuItem value={value} key={value}>
								{statusLabel(value)}
							</MenuItem>
						))}
					</Select>
					<Select sx={{ width: 170 }} value={groupFilter} onChange={(e) => changeGroupFilterHandler(e.target.value)}>
						{['ALL', CommentGroup.ARTICLE, CommentGroup.KINDERGARTEN].map((value) => (
							<MenuItem value={value} key={value}>
								{value === 'ALL' ? t('adminFilters.allGroups') : categoryLabel(value)}
							</MenuItem>
						))}
					</Select>
					<TextField
						size="small"
						label={t('adminFilters.referenceId')}
						value={refIdFilter}
						onChange={(e) => setRefIdFilter(e.target.value)}
					/>
					<TextField
						size="small"
						label={t('adminFilters.memberId')}
						value={memberIdFilter}
						onChange={(e) => setMemberIdFilter(e.target.value)}
					/>
					<Button variant="contained" onClick={() => applyFilters()}>
						{t('dashboardCommon.apply')}
					</Button>
					<Button variant="outlined" onClick={clearFilters}>
						{t('dashboardCommon.clear')}
					</Button>
				</Stack>
				<Divider />

				<TableContainer>
					<Table sx={{ minWidth: 980 }} size="medium">
						<TableHead>
							<TableRow>
								<TableCell align="left">{t('adminTables.comment')}</TableCell>
								<TableCell align="center">{t('adminTables.status')}</TableCell>
								<TableCell align="center">{t('adminTables.group')}</TableCell>
								<TableCell align="left">{t('adminTables.reference')}</TableCell>
								<TableCell align="left">{t('adminTables.author')}</TableCell>
								<TableCell align="left">{t('adminTables.memberId')}</TableCell>
								<TableCell align="left">{t('adminTables.created')}</TableCell>
								<TableCell align="left">{t('adminTables.updated')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>{renderRows()}</TableBody>
					</Table>
				</TableContainer>

				<TablePagination
					rowsPerPageOptions={[10, 20, 50, 100]}
					component="div"
					count={commentTotal}
					rowsPerPage={commentsInquiry.limit}
					page={commentsInquiry.page - 1}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</Box>
		</Box>
	);
};

AdminCommunityComments.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 20,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { commentStatus: CommentStatus.ACTIVE },
	},
};

export default withAdminLayout(AdminCommunityComments);
