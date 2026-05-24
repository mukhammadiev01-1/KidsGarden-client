import React from 'react';
import Link from 'next/link';
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
import { Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import { Kindergarten } from '../../../types/kindergarten/kindergarten';
import { KindergartenStatus } from '../../../enums/kindergarten.enum';
import { REACT_APP_API_URL } from '../../../config';
import { formatMonthlyFee, getKindergartenTypeLabel } from '../../../utils';

interface Data {
	id: string;
	title: string;
	fee: string;
	owner: string;
	location: string;
	capacity: string;
	ageRange: string;
	programs: string;
	type: string;
	createdAt: string;
	status: string;
}

type Order = 'asc' | 'desc';

const getKindergartenStatusLabel = (status: string) => {
	switch (status) {
		case KindergartenStatus.SOLD:
			return 'Closed';
		case KindergartenStatus.DELETE:
			return 'Deleted';
		default:
			return status;
	}
};

const getStatusBadgeClass = (status: KindergartenStatus) => {
	switch (status) {
		case KindergartenStatus.SOLD:
			return 'badge warning';
		case KindergartenStatus.DELETE:
			return 'badge error';
		default:
			return 'badge success';
	}
};

const formatDate = (value?: Date | string) => {
	if (!value) return '-';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const truncateId = (value?: string) => {
	if (!value) return '-';
	return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
};

interface HeadCell {
	disablePadding: boolean;
	id: keyof Data;
	label: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'id',
		numeric: true,
		disablePadding: false,
		label: 'ID',
	},
	{
		id: 'title',
		numeric: false,
		disablePadding: false,
		label: 'KINDERGARTEN',
	},
	{
		id: 'fee',
		numeric: false,
		disablePadding: false,
		label: 'MONTHLY FEE',
	},
	{
		id: 'owner',
		numeric: false,
		disablePadding: false,
		label: 'OWNER',
	},
	{
		id: 'location',
		numeric: false,
		disablePadding: false,
		label: 'LOCATION',
	},
	{
		id: 'capacity',
		numeric: false,
		disablePadding: false,
		label: 'CAPACITY',
	},
	{
		id: 'ageRange',
		numeric: false,
		disablePadding: false,
		label: 'AGE RANGE',
	},
	{
		id: 'programs',
		numeric: false,
		disablePadding: false,
		label: 'PROGRAMS',
	},
	{
		id: 'type',
		numeric: false,
		disablePadding: false,
		label: 'TYPE',
	},
	{
		id: 'createdAt',
		numeric: false,
		disablePadding: false,
		label: 'CREATED',
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
	order: Order;
	orderBy: string;
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

interface PropertyPanelListType {
	kindergartens: Kindergarten[];
	loading?: boolean;
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateKindergartenHandler: any;
}

export const PropertyPanelList = (props: PropertyPanelListType) => {
	const { kindergartens, loading, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateKindergartenHandler } =
		props;

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 1180 }} aria-labelledby="tableTitle" size={'medium'}>
					{/*@ts-ignore*/}
					<EnhancedTableHead />
					<TableBody>
						{loading && (
							<TableRow>
								<TableCell align="center" colSpan={11}>
									<span className={'no-data'}>Loading kindergartens...</span>
								</TableCell>
							</TableRow>
						)}

						{!loading && kindergartens.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={11}>
									<span className={'no-data'}>No kindergartens found.</span>
								</TableCell>
							</TableRow>
						)}

						{!loading &&
							kindergartens.length !== 0 &&
							kindergartens.map((kindergarten: Kindergarten, index: number) => {
								const kindergartenImage = kindergarten?.kindergartenImages?.[0]
									? `${REACT_APP_API_URL}/${kindergarten.kindergartenImages[0]}`
									: '/img/property/bigImage.png';
								const ownerName =
									kindergarten.memberData?.memberNick ||
									kindergarten.memberData?.memberFullName ||
									truncateId(kindergarten.memberId);

								return (
									<TableRow hover key={kindergarten?._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
										<TableCell align="left">{truncateId(kindergarten._id)}</TableCell>
										<TableCell align="left" className={'name'}>
											{kindergarten.kindergartenStatus === KindergartenStatus.ACTIVE ? (
												<Stack direction={'row'}>
													<Link href={`/property/detail?id=${kindergarten?._id}`}>
														<div>
															<Avatar alt="Remy Sharp" src={kindergartenImage} sx={{ ml: '2px', mr: '10px' }} />
														</div>
													</Link>
													<Link href={`/property/detail?id=${kindergarten?._id}`}>
														<div>{kindergarten.kindergartenTitle}</div>
													</Link>
												</Stack>
											) : (
												<Stack direction={'row'}>
													<div>
														<Avatar alt="Remy Sharp" src={kindergartenImage} sx={{ ml: '2px', mr: '10px' }} />
													</div>
													<div style={{ marginTop: '10px' }}>{kindergarten.kindergartenTitle}</div>
												</Stack>
											)}
										</TableCell>
										<TableCell align="center">{formatMonthlyFee(kindergarten.kindergartenPrice)}</TableCell>
										<TableCell align="center">{ownerName}</TableCell>
										<TableCell align="center">{kindergarten.kindergartenLocation}</TableCell>
										<TableCell align="center">{kindergarten.kindergartenCapacity} spots</TableCell>
										<TableCell align="center">Age {kindergarten.kindergartenAgeRange}</TableCell>
										<TableCell align="center">{kindergarten.kindergartenPrograms} programs</TableCell>
										<TableCell align="center">{getKindergartenTypeLabel(kindergarten.kindergartenType)}</TableCell>
										<TableCell align="center">{formatDate(kindergarten.createdAt)}</TableCell>
										<TableCell align="center">
											{kindergarten.kindergartenStatus === KindergartenStatus.ACTIVE ? (
												<>
													<Button onClick={(e: any) => menuIconClickHandler(e, index)} className={'badge success'}>
														{getKindergartenStatusLabel(kindergarten.kindergartenStatus)}
													</Button>

													<Menu
														className={'menu-modal'}
														MenuListProps={{
															'aria-labelledby': 'fade-button',
														}}
														anchorEl={anchorEl[index]}
														open={Boolean(anchorEl[index])}
														onClose={menuIconCloseHandler}
														TransitionComponent={Fade}
														sx={{ p: 1 }}
													>
														{Object.values(KindergartenStatus)
															.filter((ele) => ele !== kindergarten.kindergartenStatus)
															.map((status: KindergartenStatus) => (
																<MenuItem
																	onClick={() =>
																		updateKindergartenHandler({
																			_id: kindergarten._id,
																			kindergartenStatus: status,
																		})
																	}
																	key={status}
																>
																	<Typography variant={'subtitle1'} component={'span'}>
																		{getKindergartenStatusLabel(status)}
																	</Typography>
																</MenuItem>
															))}
													</Menu>
												</>
											) : (
												<Typography component={'span'} className={getStatusBadgeClass(kindergarten.kindergartenStatus)}>
													{getKindergartenStatusLabel(kindergarten.kindergartenStatus)}
												</Typography>
											)}
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
