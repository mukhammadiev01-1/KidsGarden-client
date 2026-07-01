import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MenuList from '../admin/AdminMenuList';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Menu, MenuItem } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { MemberType } from '../../enums/member.enum';
import { getStaticCommonTranslator } from '../../i18n/staticCommon';
const drawerWidth = 280;

const withAdminLayout = (Component: ComponentType) => {
	return (props: object) => {
		const router = useRouter();
		const t = getStaticCommonTranslator(router.locale);
		const user = useReactiveVar(userVar);
		const [settingsState, setSettingsStateState] = useState(false);
		const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
		const [openMenu, setOpenMenu] = useState(false);
		const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
		const [title, setTitle] = useState('admin');
		const [loading, setLoading] = useState(true);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
			setLoading(false);
		}, []);

		useEffect(() => {
			if (!loading && user.memberType !== MemberType.SUPER_ADMIN) {
				router.push('/').then();
			}
		}, [loading, user, router]);

		/** HANDLERS **/
		const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
			setAnchorElUser(event.currentTarget);
		};

		const handleCloseUserMenu = () => {
			setAnchorElUser(null);
		};

		const logoutHandler = () => {
			logOut();
			router.push('/').then();
		};

		if (!user || user?.memberType !== MemberType.SUPER_ADMIN) return null;

		return (
				<main id="pc-wrap" className="admin">
					<Box component={'div'} className="admin-shell" sx={{ display: 'flex' }}>
						<AppBar
							position="fixed"
							className="admin-appbar"
							sx={{
								width: `calc(100% - ${drawerWidth}px)`,
								ml: `${drawerWidth}px`,
							}}
						>
							<Toolbar className="admin-topbar">
								<Stack className="admin-topbar-copy">
									<Typography className="admin-topbar-kicker">{t('dashboard.platform')}</Typography>
									<Typography className="admin-topbar-title">{t('dashboard.superAdminDashboard')}</Typography>
								</Stack>
								<Stack className="admin-topbar-actions" direction={'row'} alignItems={'center'} spacing={1.5}>
									<Typography className="admin-topbar-user">{user?.memberNick}</Typography>
									<Tooltip title={t('dashboard.openAccountMenu')}>
										<IconButton onClick={handleOpenUserMenu} className="admin-avatar-button">
											<Avatar
												src={
													user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'
												}
											/>
										</IconButton>
									</Tooltip>
								</Stack>
								<Menu
									sx={{ mt: '45px' }}
								id="menu-appbar"
								className={'pop-menu'}
								anchorEl={anchorElUser}
								anchorOrigin={{
									vertical: 'top',
									horizontal: 'right',
								}}
								keepMounted
								transformOrigin={{
									vertical: 'top',
									horizontal: 'right',
								}}
								open={Boolean(anchorElUser)}
								onClose={handleCloseUserMenu}
							>
								<Box
									component={'div'}
									onClick={handleCloseUserMenu}
									sx={{
										width: '200px',
									}}
								>
									<Stack sx={{ px: '20px', my: '12px' }}>
										<Typography variant={'h6'} component={'h6'} sx={{ mb: '4px' }}>
											{user?.memberNick}
										</Typography>
										<Typography variant={'subtitle1'} component={'p'} color={'#757575'}>
											{user?.memberPhone}
										</Typography>
									</Stack>
									<Divider />
									<Box component={'div'} sx={{ p: 1, py: '6px' }} onClick={logoutHandler}>
										<MenuItem sx={{ px: '16px', py: '6px' }}>
											<Typography variant={'subtitle1'} component={'span'}>
												{t('dashboardCommon.logout')}
											</Typography>
										</MenuItem>
									</Box>
								</Box>
							</Menu>
						</Toolbar>
					</AppBar>

					<Drawer
						sx={{
							width: drawerWidth,
							flexShrink: 0,
							'& .MuiDrawer-paper': {
								width: drawerWidth,
								boxSizing: 'border-box',
							},
							}}
							variant="permanent"
							anchor="left"
							className="aside admin-sidebar"
						>
							<Toolbar className="admin-sidebar-header">
								<Stack className={'logo-box'}>
									<img src={'/img/logo/kidsgarden-logo.svg'} alt={'KidsGarden'} />
									<Typography className="admin-console-label">{t('dashboard.superAdminConsole')}</Typography>
								</Stack>

								<Stack
									className="user admin-user-card"
									direction={'row'}
									alignItems={'center'}
								>
									<Avatar
										className="admin-user-avatar"
										src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
									/>
									<Stack className="admin-user-meta">
										<Typography className="admin-user-name">{user?.memberNick}</Typography>
										<Typography className="admin-user-phone">{user?.memberPhone}</Typography>
										<Typography className="admin-role-badge">{t('roles.SUPER_ADMIN')}</Typography>
									</Stack>
								</Stack>
							</Toolbar>

						<Divider />

						<MenuList />
					</Drawer>

					<Box component={'div'} id="bunker" sx={{ flexGrow: 1 }}>
						{/*@ts-ignore*/}
						<Component {...props} setSnackbar={setSnackbar} setTitle={setTitle} />
					</Box>
				</Box>
			</main>
		);
	};
};

export default withAdminLayout;
