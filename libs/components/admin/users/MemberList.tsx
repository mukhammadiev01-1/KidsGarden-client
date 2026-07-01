import React from 'react';
import {
	TableCell,
	TableHead,
	TableBody,
	TableRow,
	Table,
	TableContainer,
	Button,
	Menu,
	Fade,
	MenuItem,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';
import { Member } from '../../../types/member/member';
import { REACT_APP_API_URL } from '../../../config';
import { MemberStatus } from '../../../enums/member.enum';
import { useAdminTranslation } from '../../../i18n/adminTranslator';

interface Data {
	id: string;
	nickname: string;
	fullname: string;
	phone: string;
	type: string;
	state: string;
	warning: string;
	block: string;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

type Order = 'asc' | 'desc';

interface HeadCell {
	disablePadding: boolean;
	id: keyof Data;
	labelKey: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'id',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.memberId',
	},
	{
		id: 'nickname',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.nickname',
	},
	{
		id: 'fullname',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.fullName',
	},
	{
		id: 'phone',
		numeric: true,
		disablePadding: false,
		labelKey: 'adminTables.phone',
	},
	{
		id: 'type',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.memberType',
	},
	{
		id: 'warning',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.warnings',
	},
	{
		id: 'block',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.blocks',
	},
	{
		id: 'state',
		numeric: false,
		disablePadding: false,
		labelKey: 'adminTables.status',
	},
];

interface EnhancedTableProps {
	numSelected: number;
	onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
	onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
	order: Order;
	orderBy: string;
	rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
	const { t } = useAdminTranslation();
	const { onSelectAllClick } = props;

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

interface MemberPanelListType {
	members: Member[];
	loading?: boolean;
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateMemberHandler: any;
}

export const MemberPanelList = (props: MemberPanelListType) => {
	const { members, loading, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateMemberHandler } = props;
	const { t, roleLabel, statusLabel } = useAdminTranslation();

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
					{/*@ts-ignore*/}
					<EnhancedTableHead />
					<TableBody>
						{loading && (
							<TableRow>
								<TableCell align="center" colSpan={8}>
									<span className={'no-data'}>{t('adminPages.members.loading')}</span>
								</TableCell>
							</TableRow>
						)}

						{!loading && members.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={8}>
									<span className={'no-data'}>{t('adminPages.members.empty')}</span>
								</TableCell>
							</TableRow>
						)}

						{!loading &&
							members.length !== 0 &&
							members.map((member: Member, index: number) => {
								const member_image = member.memberImage
									? `${REACT_APP_API_URL}/${member.memberImage}`
									: '/img/profile/defaultUser.svg';
								return (
									<TableRow hover key={member?._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
										<TableCell align="left">{member._id}</TableCell>

										<TableCell align="left" className={'name'}>
											<Stack direction={'row'} alignItems={'center'}>
												<Avatar alt={member.memberNick || t('adminTables.member')} src={member_image} sx={{ ml: '2px', mr: '10px' }} />
												<div>{member.memberNick}</div>
											</Stack>
										</TableCell>

										<TableCell align="center">{member.memberFullName ?? '-'}</TableCell>
										<TableCell align="left">{member.memberPhone}</TableCell>

										<TableCell align="center">
											<Typography component={'span'} className={'badge success'}>
												{roleLabel(member.memberType)}
											</Typography>
										</TableCell>

										<TableCell align="center">{member.memberWarnings}</TableCell>
										<TableCell align="center">{member.memberBlocks}</TableCell>
										<TableCell align="center">
											<Button onClick={(e: any) => menuIconClickHandler(e, member._id)} className={'badge success'}>
												{statusLabel(member.memberStatus)}
											</Button>

											<Menu
												className={'menu-modal'}
												MenuListProps={{
													'aria-labelledby': 'fade-button',
												}}
												anchorEl={anchorEl[member._id]}
												open={Boolean(anchorEl[member._id])}
												onClose={menuIconCloseHandler}
												TransitionComponent={Fade}
												sx={{ p: 1 }}
											>
												{Object.values(MemberStatus)
													.filter((ele: string) => ele !== member?.memberStatus)
													.map((status: string) => (
														<MenuItem
															onClick={() => updateMemberHandler({ _id: member._id, memberStatus: status })}
															key={status}
														>
															<Typography variant={'subtitle1'} component={'span'}>
																{statusLabel(status)}
															</Typography>
														</MenuItem>
													))}
											</Menu>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};
