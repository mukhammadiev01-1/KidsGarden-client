import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, MenuItem } from '@mui/material';
import { List, ListItem } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import { TabContext } from '@mui/lab';
import TablePagination from '@mui/material/TablePagination';
import { useMutation, useQuery } from '@apollo/client';
import CommunityArticleList from '../../../libs/components/admin/community/CommunityArticleList';
import { AllBoardArticlesInquiry } from '../../../libs/types/board-article/board-article.input';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { BoardArticleCategory, BoardArticleStatus } from '../../../libs/enums/board-article.enum';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';
import { BoardArticleUpdate } from '../../../libs/types/board-article/board-article.update';
import { GET_ALL_BOARD_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_BOARD_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { useAdminTranslation } from '../../../libs/i18n/adminTranslator';

const AdminCommunity: NextPage = ({ initialInquiry, ...props }: any) => {
	const { t, categoryLabel, statusLabel } = useAdminTranslation();
	const [communityInquiry, setCommunityInquiry] = useState<AllBoardArticlesInquiry>(initialInquiry);
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [articleTotal, setArticleTotal] = useState<number>(0);
	const [value, setValue] = useState(
		communityInquiry?.search?.articleStatus ? communityInquiry?.search?.articleStatus : 'ALL',
	);
	const [searchType, setSearchType] = useState('ALL');

	/** APOLLO REQUESTS **/
	const { loading, error, refetch } = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
		variables: { input: communityInquiry },
		onCompleted: (data: any) => {
			setArticles(data?.getAllBoardArticlesByAdmin?.list ?? []);
			setArticleTotal(data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => {
			setArticles([]);
			setArticleTotal(0);
		},
	});
	const [updateBoardArticleByAdmin] = useMutation(UPDATE_BOARD_ARTICLE_BY_ADMIN);

	/** HANDLERS **/
	const changePageHandler = async (event: unknown, newPage: number) => {
		setCommunityInquiry({ ...communityInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setCommunityInquiry({ ...communityInquiry, limit: parseInt(event.target.value, 10), page: 1 });
	};

	const tabChangeHandler = async (event: any, newValue: string) => {
		setValue(newValue);

		switch (newValue) {
			case 'ACTIVE':
				setCommunityInquiry({
					...communityInquiry,
					page: 1,
					search: { ...communityInquiry.search, articleStatus: BoardArticleStatus.ACTIVE },
				});
				break;
			case 'DELETE':
				setCommunityInquiry({
					...communityInquiry,
					page: 1,
					search: { ...communityInquiry.search, articleStatus: BoardArticleStatus.DELETE },
				});
				break;
			default:
				const nextSearch = { ...communityInquiry.search };
				delete nextSearch.articleStatus;
				setCommunityInquiry({ ...communityInquiry, page: 1, search: nextSearch });
				break;
		}
	};

	const searchTypeHandler = async (newValue: string) => {
		try {
			setSearchType(newValue);

			if (newValue !== 'ALL') {
				setCommunityInquiry({
					...communityInquiry,
					page: 1,
					sort: 'createdAt',
					search: {
						...communityInquiry.search,
						articleCategory: newValue as BoardArticleCategory,
					},
				});
			} else {
				const nextSearch = { ...communityInquiry.search };
				delete nextSearch.articleCategory;
				setCommunityInquiry({ ...communityInquiry, page: 1, search: nextSearch });
			}
		} catch (err: any) {
			console.log('searchTypeHandler: ', err.message);
		}
	};

	const updateArticleHandler = async (updateData: BoardArticleUpdate) => {
		try {
			await updateBoardArticleByAdmin({
				variables: {
					input: {
						_id: updateData._id,
						articleStatus: updateData.articleStatus,
					},
				},
			});
			await refetch({ input: communityInquiry });
			await sweetMixinSuccessAlert(t('adminPages.communityArticles.statusUpdated'));
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				{t('adminPages.communityArticles.title')}
			</Typography>
			<Typography sx={{ mb: '24px', color: '#64746b' }}>
				{t('adminPages.communityArticles.subtitle')}
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'ALL')}
									value="ALL"
									className={value === 'ALL' ? 'li on' : 'li'}
								>
									{t('statuses.ALL')}
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'ACTIVE')}
									value="ACTIVE"
									className={value === 'ACTIVE' ? 'li on' : 'li'}
								>
									{statusLabel(BoardArticleStatus.ACTIVE)}
								</ListItem>
								<ListItem
									onClick={(e) => tabChangeHandler(e, 'DELETE')}
									value="DELETE"
									className={value === 'DELETE' ? 'li on' : 'li'}
								>
									{statusLabel(BoardArticleStatus.DELETE)}
								</ListItem>
							</List>
							<Divider />
							<Stack className={'search-area'} sx={{ m: '24px' }}>
								<Select sx={{ width: '160px', mr: '20px' }} value={searchType}>
									<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
										{t('statuses.ALL')}
									</MenuItem>
									{Object.values(BoardArticleCategory).map((category: string) => (
										<MenuItem value={category} onClick={() => searchTypeHandler(category)} key={category}>
											{categoryLabel(category)}
										</MenuItem>
									))}
								</Select>
							</Stack>
							<Divider />
						</Box>
						<CommunityArticleList
							articles={articles}
							updateArticleHandler={updateArticleHandler}
							loading={loading}
							error={error}
						/>

						<TablePagination
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={articleTotal}
							rowsPerPage={communityInquiry?.limit}
							page={communityInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
				</Box>
			</Box>
		</Box>
	);
};

AdminCommunity.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: { articleStatus: BoardArticleStatus.ACTIVE },
	},
};

export default withAdminLayout(AdminCommunity);
