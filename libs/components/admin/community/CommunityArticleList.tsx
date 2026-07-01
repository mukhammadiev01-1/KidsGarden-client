import React from 'react';
import Link from 'next/link';
import {
	Box,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import OpenInBrowserRoundedIcon from '@mui/icons-material/OpenInBrowserRounded';
import Moment from 'react-moment';
import { BoardArticle } from '../../../types/board-article/board-article';
import { REACT_APP_API_URL } from '../../../config';
import Typography from '@mui/material/Typography';
import { BoardArticleCategory, BoardArticleStatus } from '../../../enums/board-article.enum';
import { getArticleExcerpt } from '../../../utils/articleExcerpt';
import { useAdminTranslation } from '../../../i18n/adminTranslator';

interface Data {
	category: string;
	title: string;
	writer: string;
	content: string;
	register: string;
	view: number;
	like: number;
	comment: number;
	status: string;
	article_id: string;
}

interface HeadCell {
	disablePadding: boolean;
	id: keyof Data;
	labelKey: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'article_id',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.articleId',
	},
	{
		id: 'title',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.title',
	},
	{
		id: 'category',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.category',
	},
	{
		id: 'writer',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.author',
	},
	{
		id: 'content',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.preview',
	},
	{
		id: 'view',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.views',
	},
	{
		id: 'like',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.likes',
	},
	{
		id: 'comment',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.comments',
	},
	{
		id: 'register',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.registerDate',
	},
	{
		id: 'status',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.status',
	},
];

interface EnhancedTableProps {
	numSelected: number;
	onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
	onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
	rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
	const { t } = useAdminTranslation();
	return (
		<TableHead>
			<TableRow>
				{headCells.map((headCell) => (
					<TableCell
						key={headCell.id}
						align={headCell.numeric ? 'left' : 'center'}
						padding={headCell.disablePadding ? 'none' : 'normal'}
					>
						{t(headCell.labelKey)}
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
}

interface CommunityArticleListProps {
	articles: BoardArticle[];
	updateArticleHandler: any;
	loading?: boolean;
	error?: any;
}

const CommunityArticleList = (props: CommunityArticleListProps) => {
	const { t, categoryLabel, statusLabel } = useAdminTranslation();
	const { articles, updateArticleHandler, loading, error } = props;

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
					{/*@ts-ignore*/}
					<EnhancedTableHead />
					<TableBody>
						{loading && (
							<TableRow>
								<TableCell align="center" colSpan={10}>
									<span className={'no-data'}>{t('adminPages.communityArticles.loading')}</span>
								</TableCell>
							</TableRow>
						)}
						{!loading && error && (
							<TableRow>
								<TableCell align="center" colSpan={10}>
									<span className={'no-data'}>{t('adminPages.communityArticles.loadError')}</span>
								</TableCell>
							</TableRow>
						)}
						{!loading && !error && articles.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={10}>
									<span className={'no-data'}>{t('adminPages.communityArticles.empty')}</span>
								</TableCell>
							</TableRow>
						)}

						{!loading &&
							!error &&
							articles.length !== 0 &&
							articles.map((article: BoardArticle) => (
								<TableRow hover key={article._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
									<TableCell align="left">
										<Typography title={article._id} sx={{ maxWidth: 120 }} noWrap>
											{article._id}
										</Typography>
									</TableCell>
									<TableCell align="left">
										<Box component={'div'} sx={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: 240 }}>
											<Typography sx={{ fontWeight: 600 }} noWrap title={article.articleTitle}>
												{article.articleTitle}
											</Typography>
											<Link
												href={`/community/detail?articleCategory=${article.articleCategory}&id=${article._id}`}
												className={'img_box'}
											>
												<IconButton className="btn_window">
													<Tooltip title={t('adminActions.open')}>
														<OpenInBrowserRoundedIcon />
													</Tooltip>
												</IconButton>
											</Link>
										</Box>
									</TableCell>
									<TableCell align="left">{categoryLabel(article.articleCategory)}</TableCell>
									<TableCell align="left" className={'name'}>
										<Stack direction="row" alignItems="center">
											<Avatar
												alt={article?.memberData?.memberNick || t('adminTables.author')}
												src={
													article?.memberData?.memberImage
														? `${REACT_APP_API_URL}/${article?.memberData?.memberImage}`
														: `/img/profile/defaultUser.svg`
												}
												sx={{ ml: '2px', mr: '10px' }}
											/>
											<Typography sx={{ maxWidth: 180 }} noWrap>
												{article?.memberData?.memberFullName || article?.memberData?.memberNick || t('adminTables.unknownAuthor')}
											</Typography>
										</Stack>
									</TableCell>
									<TableCell align="left">
										<Typography sx={{ maxWidth: 260, color: '#59675f' }} noWrap title={getArticleExcerpt(article.articleContent, 220, '-')}>
											{getArticleExcerpt(article.articleContent, 120, '-')}
										</Typography>
									</TableCell>
									<TableCell align="center">{article?.articleViews}</TableCell>
									<TableCell align="center">{article?.articleLikes}</TableCell>
									<TableCell align="center">{article?.articleComments}</TableCell>
									<TableCell align="left">
										<Moment format={'DD.MM.YY HH:mm'}>{article?.createdAt}</Moment>
									</TableCell>
									<TableCell align="center">
										<Select
											size="small"
											value={article.articleStatus}
											disabled={article.articleStatus === BoardArticleStatus.DELETE}
											onChange={(event) =>
												updateArticleHandler({
													_id: article._id,
													articleStatus: event.target.value as BoardArticleStatus,
												})
											}
											sx={{ minWidth: 120 }}
										>
											{Object.values(BoardArticleStatus).map((status: BoardArticleStatus) => (
												<MenuItem value={status} key={status}>
													{statusLabel(status)}
												</MenuItem>
											))}
										</Select>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};

export default CommunityArticleList;
