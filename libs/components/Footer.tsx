import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const Footer = () => {
	const { t } = useTranslation('common');
	const currentYear = moment().year();
	const socialTitle = (name: string) => t('footer.socialComingSoon', { name });

	return (
		<Stack className={'footer-container'}>
			<Stack className={'main'}>
				<Box component={'div'} className={'footer-brand-column'}>
					<Link href={'/'}>
						<div className={'footer-brand'}>
							<img src={'/img/logo/kidsgarden-logo.svg'} alt={'KidsGarden Early Learning Platform'} />
						</div>
					</Link>
					<p>{t('footer.tagline')}</p>
					<div className={'media-box'} aria-label={t('footer.socialLinks')}>
						<span role="img" aria-label={socialTitle('Facebook')} title={socialTitle('Facebook')}>
							<FacebookOutlinedIcon aria-hidden />
						</span>
						<span role="img" aria-label={socialTitle('Telegram')} title={socialTitle('Telegram')}>
							<TelegramIcon aria-hidden />
						</span>
						<span role="img" aria-label={socialTitle('Instagram')} title={socialTitle('Instagram')}>
							<InstagramIcon aria-hidden />
						</span>
						<span role="img" aria-label={socialTitle('X')} title={socialTitle('X')}>
							<TwitterIcon aria-hidden />
						</span>
					</div>
				</Box>

				<Box component={'nav'} className={'footer-link-grid'} aria-label={t('footer.navigation')}>
					<div>
						<strong>{t('footer.platform')}</strong>
						<Link href={'/kindergartens'}>{t('footer.kindergartens')}</Link>
						<Link href={'/account/join'}>{t('footer.forParents')}</Link>
						<Link href={'/cs'}>{t('footer.forCenters')}</Link>
					</div>
					<div>
						<strong>{t('footer.resources')}</strong>
						<Link href={'/cs'}>{t('footer.helpCenter')}</Link>
						<Link href={'/community?articleCategory=NEWS'}>{t('footer.news')}</Link>
						<Link href={'/community?articleCategory=FREE'}>{t('footer.community')}</Link>
					</div>
					<div>
						<strong>{t('footer.company')}</strong>
						<Link href={'/'}>{t('footer.home')}</Link>
						<Link href={'/about'}>{t('footer.about')}</Link>
						<Link href={'/kindergartens'}>{t('footer.kindergartens')}</Link>
						<Link href={'/community?articleCategory=FREE'}>{t('footer.community')}</Link>
					</div>
					<div>
						<strong>{t('footer.support')}</strong>
						<Link href={'/cs'}>{t('footer.help')}</Link>
						<a href="mailto:support@kidsgarden.com">support@kidsgarden.com</a>
						<span>{t('footer.supportHours')}</span>
					</div>
				</Box>
			</Stack>
			<Stack className={'second'}>
				<span>{t('footer.copyright', { year: currentYear })}</span>
				<div className="footer-legal-links" aria-label={t('footer.legalComingSoon')}>
					<span title={t('footer.termsComingSoon')}>
						{t('footer.terms')} ({t('footer.comingSoon')})
					</span>
					<span aria-hidden="true">·</span>
					<span title={t('footer.privacyComingSoon')}>
						{t('footer.privacy')} ({t('footer.comingSoon')})
					</span>
				</div>
			</Stack>
		</Stack>
	);
};

export default Footer;
