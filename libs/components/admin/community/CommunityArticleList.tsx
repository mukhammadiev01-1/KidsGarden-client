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
	label: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'article_id',
		numeric: true,
		disablePadding: false,
		label: 'ARTICLE ID',
	},
	{
		id: 'title',
		numeric: true,
		disablePadding: false,
		label: 'TITLE',
	},
	{
		id: 'category',
		numeric: true,
		disablePadding: false,
		label: 'CATEGORY',
	},
	{
		id: 'writer',
		numeric: true,
		disablePadding: false,
		label: 'AUTHOR',
	},
	{
		id: 'content',
		numeric: true,
		disablePadding: false,
		label: 'PREVIEW',
	},
	{
		id: 'view',
		numeric: false,
		disablePadding: false,
		label: 'VIEWS',
	},
	{
		id: 'like',
		numeric: false,
		disablePadding: false,
		label: 'LIKES',
	},
	{
		id: 'comment',
		numeric: false,
		disablePadding: false,
		label: 'COMMENTS',
	},
	{
		id: 'register',
		numeric: true,
		disablePadding: false,
		label: 'REGISTER DATE',
	},
	{
		id: 'status',
		numeric: false,
		disablePadding: false,
		label: 'STATUS',
	},
];

interface EnhancedTableProps {
	numSelected: number;
	onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
	onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
	rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
	return (
		<TableHead>
			<TableRow>
				{headCells.map((headCell) => (
					<TableCell
						key={headCell.id}
						align={headCell.numeric ? 'left' : 'center'}
						padding={headCell.disablePadding ? 'none' : 'normal'}
					>
						{headCell.label}
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
	const { articles, updateArticleHandler, loading, error } = props;

	const categoryLabel = (category: BoardArticleCategory) => {
		switch (category) {
			case BoardArticleCategory.FREE:
				return 'Parent Board';
			case BoardArticleCategory.NEWS:
				return 'News';
			default:
				return `Legacy: ${category}`;
		}
	};

	const stripHtml = (value?: string) => {
		return value?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';
	};

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
									<span className={'no-data'}>Loading community articles...</span>
								</TableCell>
							</TableRow>
						)}
						{!loading && error && (
							<TableRow>
								<TableCell align="center" colSpan={10}>
									<span className={'no-data'}>Community articles could not be loaded.</span>
								</TableCell>
							</TableRow>
						)}
						{!loading && !error && articles.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={10}>
									<span className={'no-data'}>No community articles found.</span>
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
													<Tooltip title={'Open window'}>
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
												alt={article?.memberData?.memberNick || 'Author'}
												src={
													article?.memberData?.memberImage
														? `${REACT_APP_API_URL}/${article?.memberData?.memberImage}`
														: `/img/profile/defaultUser.svg`
												}
												sx={{ ml: '2px', mr: '10px' }}
											/>
											<Typography sx={{ maxWidth: 180 }} noWrap>
												{article?.memberData?.memberFullName || article?.memberData?.memberNick || 'Unknown author'}
											</Typography>
										</Stack>
									</TableCell>
									<TableCell align="left">
										<Typography sx={{ maxWidth: 260, color: '#59675f' }} noWrap title={stripHtml(article.articleContent)}>
											{stripHtml(article.articleContent) || '-'}
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
													{status === BoardArticleStatus.DELETE ? 'DELETED' : status}
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
