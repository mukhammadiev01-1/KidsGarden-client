import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { Stack, Box } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { alpha, styled } from '@mui/material/styles';
import Menu, { MenuProps } from '@mui/material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { CaretDown } from 'phosphor-react';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { Logout } from '@mui/icons-material';
import { REACT_APP_API_URL } from '../config';
import { MemberType } from '../enums/member.enum';
import NotificationBell from './notification/NotificationBell';
import MessageBell from './chat/MessageBell';
import {
	DEFAULT_LOCALE,
	LANGUAGES,
	LEGACY_KOREAN_LOCALE,
	LanguageMeta,
	getLanguageMeta,
	hasLocalePathPrefix,
	normalizeLocale,
} from '../i18n/languages';

const LanguageMark = ({ language, className }: { language: LanguageMeta; className?: string }) => {
	if (language.flagSrc) {
		return <img className={className} src={language.flagSrc} alt={`${language.label} flag`} />;
	}

	return <span className={`lang-badge ${className || ''}`}>{language.shortLabel}</span>;
};

const Top = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const router = useRouter();
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	const [lang, setLang] = useState<string | null>('en');
	const drop = Boolean(anchorEl2);
	const [colorChange, setColorChange] = useState(false);
	const [bgColor, setBgColor] = useState<boolean>(false);
	const [logoutAnchor, setLogoutAnchor] = React.useState<null | HTMLElement>(null);
	const logoutOpen = Boolean(logoutAnchor);
	const accountHref = user.memberType === MemberType.SUPER_ADMIN ? '/_admin' : '/mypage';
	const accountLabel = user.memberType === MemberType.SUPER_ADMIN ? t('header.admin') : t('header.myPage');
	const selectedLang = normalizeLocale(lang);
	const selectedLanguage = getLanguageMeta(selectedLang);

	/** LIFECYCLES **/
	useEffect(() => {
		if (typeof window === 'undefined') return;

		if (router.locale === LEGACY_KOREAN_LOCALE) {
			setLang('ko');
			localStorage.setItem('locale', 'ko');
			router.replace(router.asPath, router.asPath, { locale: 'ko' }).catch(() => undefined);
			return;
		}

		const storedLocale = normalizeLocale(localStorage.getItem('locale'));
		const routeLocale = normalizeLocale(router.locale || DEFAULT_LOCALE);
		const hasRouteLocale = hasLocalePathPrefix(window.location.pathname);
		const nextLocale = hasRouteLocale ? routeLocale : storedLocale;

		setLang(nextLocale);
		localStorage.setItem('locale', nextLocale);

		if (!hasRouteLocale && nextLocale !== routeLocale) {
			router.replace(router.asPath, router.asPath, { locale: nextLocale }).catch(() => undefined);
		}
	}, [router]);

	useEffect(() => {
		switch (router.pathname) {
			case '/property/detail':
			case '/kindergartens/detail':
				setBgColor(true);
				break;
			default:
				break;
		}
	}, [router]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	/** HANDLERS **/
	const langClick = (e: any) => {
		setAnchorEl2(e.currentTarget);
	};

	const langClose = () => {
		setAnchorEl2(null);
	};

	const langChoice = useCallback(
		async (locale: string) => {
			const nextLocale = normalizeLocale(locale);
			setLang(nextLocale);
			localStorage.setItem('locale', nextLocale);
			setAnchorEl2(null);
			await router.push(router.asPath, router.asPath, { locale: nextLocale });
		},
		[router],
	);

	useEffect(() => {
		const changeNavbarColor = () => {
			setColorChange(window.scrollY >= 50);
		};

		changeNavbarColor();
		window.addEventListener('scroll', changeNavbarColor);
		return () => window.removeEventListener('scroll', changeNavbarColor);
	}, []);

	const StyledMenu = styled((props: MenuProps) => (
		<Menu
			elevation={0}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'right',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			{...props}
		/>
	))(({ theme }) => ({
		'& .MuiPaper-root': {
			top: '109px',
			borderRadius: 6,
			marginTop: theme.spacing(1),
			minWidth: 160,
			color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
			boxShadow:
				'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
			'& .MuiMenu-list': {
				padding: '4px 0',
			},
			'& .MuiMenuItem-root': {
				'& .MuiSvgIcon-root': {
					fontSize: 18,
					color: theme.palette.text.secondary,
					marginRight: theme.spacing(1.5),
				},
				'&:active': {
					backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
				},
			},
		},
	}));

	if (device == 'mobile') {
		return (
			<Stack className={'top'}>
				<Link href={'/'}>
					<div className={'mobile-logo'}>
						<img src={'/img/logo/kidsgarden-logo-transparent.png'} alt={'KidsGarden'} />
					</div>
				</Link>
				<Link href={'/'}>
					<div>{t('header.home')}</div>
				</Link>
				<Link href={'/kindergartens'}>
					<div>{t('header.kindergartens')}</div>
				</Link>
				<Link href={'/community?articleCategory=FREE'}>
					<div> {t('header.community')} </div>
				</Link>
				<Link href={'/cs'}>
					<div>{t('header.help')}</div>
				</Link>
				<Link href={user?._id ? accountHref : '/account/join'}>
					<div>{user?._id ? accountLabel : t('header.login')}</div>
				</Link>
				{user?._id && <NotificationBell />}
				{user?._id && <MessageBell />}
			</Stack>
		);
	} else {
		return (
			<Stack className={'navbar'}>
				<Stack className={`navbar-main ${colorChange ? 'transparent' : ''} ${bgColor ? 'transparent' : ''}`}>
					<Stack className={'container'}>
							<Box component={'div'} className={'logo-box'}>
								<Link href={'/'}>
									<div className={'kids-brand'}>
										<img src={'/img/logo/kidsgarden-logo-transparent.png'} alt={'KidsGarden'} />
									</div>
								</Link>
							</Box>
						<Box component={'div'} className={'router-box'}>
							<Link href={'/'}>
								<div>{t('header.home')}</div>
							</Link>
							<Link href={'/kindergartens'}>
								<div>{t('header.kindergartens')}</div>
							</Link>
							<Link href={'/community?articleCategory=FREE'}>
								<div> {t('header.community')} </div>
							</Link>
							<Link href={'/about'}>
								<div>{t('header.about')}</div>
							</Link>
							{user?._id && (
								<Link href={accountHref}>
									<div>{accountLabel}</div>
								</Link>
							)}
							<Link href={'/cs'}>
								<div>{t('header.help')}</div>
							</Link>
						</Box>
						<Box component={'div'} className={'user-box'}>
							<div className={'lan-box'}>
								{user?._id && <NotificationBell />}
								{user?._id && <MessageBell />}
								<Button
									disableRipple
									className="btn-lang"
									onClick={langClick}
									endIcon={<CaretDown size={14} color="#616161" weight="fill" />}
								>
									<Box component={'div'} className={'flag'}>
										<LanguageMark language={selectedLanguage} />
									</Box>
								</Button>

								<StyledMenu anchorEl={anchorEl2} open={drop} onClose={langClose} sx={{ position: 'absolute' }}>
									{LANGUAGES.map((language) => (
										<MenuItem
											disableRipple
											onClick={() => langChoice(language.code)}
											selected={selectedLang === language.code}
											key={language.code}
										>
											<LanguageMark language={language} className="img-flag" />
											{language.label}
										</MenuItem>
									))}
								</StyledMenu>
							</div>

							{user?._id ? (
								<>
									<div className={'login-user'} onClick={(event: any) => setLogoutAnchor(event.currentTarget)}>
										<img
											src={
												user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'
											}
											alt=""
										/>
									</div>

									<Menu
										id="basic-menu"
										anchorEl={logoutAnchor}
										open={logoutOpen}
										onClose={() => {
											setLogoutAnchor(null);
										}}
										sx={{ mt: '5px' }}
									>
										<MenuItem onClick={() => logOut()}>
											<Logout fontSize="small" style={{ color: 'blue', marginRight: '10px' }} />
											{t('header.logout')}
										</MenuItem>
									</Menu>
								</>
							) : (
								<Link href={'/account/join'}>
									<div className={'join-box'}>
										<AccountCircleOutlinedIcon />
										<span>
											{t('header.login')} / {t('header.join')}
										</span>
									</div>
								</Link>
							)}
						</Box>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default withRouter(Top);
