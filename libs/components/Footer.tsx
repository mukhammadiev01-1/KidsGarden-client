import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';

const Footer = () => {
	return (
		<Stack className={'footer-container'}>
			<Stack className={'main'}>
				<Box component={'div'} className={'footer-brand-column'}>
					<Link href={'/'}>
						<div className={'footer-brand'}>
							<img src={'/img/logo/kidsgarden-logo.svg'} alt={'KidsGarden Early Learning Platform'} />
						</div>
					</Link>
					<p>All-in-one platform for kindergartens, teachers, parents, and communities.</p>
					<div className={'media-box'} aria-label={'KidsGarden social links'}>
						<FacebookOutlinedIcon />
						<TelegramIcon />
						<InstagramIcon />
						<TwitterIcon />
					</div>
				</Box>

				<Box component={'nav'} className={'footer-link-grid'} aria-label={'Footer navigation'}>
					<div>
						<strong>Platform</strong>
						<Link href={'/property'}>Kindergartens</Link>
						<Link href={'/account/join'}>For Parents</Link>
						<Link href={'/cs'}>For Centers</Link>
					</div>
					<div>
						<strong>Resources</strong>
						<Link href={'/cs'}>Help Center</Link>
						<Link href={'/community?articleCategory=NEWS'}>News</Link>
						<Link href={'/community?articleCategory=FREE'}>Community</Link>
					</div>
					<div>
						<strong>Company</strong>
						<Link href={'/'}>Home</Link>
						<Link href={'/property'}>Kindergartens</Link>
						<Link href={'/community?articleCategory=FREE'}>Community</Link>
					</div>
					<div>
						<strong>Support</strong>
						<Link href={'/cs'}>Help</Link>
						<span>support@kidsgarden.com</span>
						<span>Mon - Fri, 9am - 6pm KST</span>
					</div>
				</Box>
			</Stack>
			<Stack className={'second'}>
				<span>© {moment().year()} KidsGarden. All rights reserved.</span>
				<span>Terms of Service · Privacy Policy</span>
			</Stack>
		</Stack>
	);
};

export default Footer;
