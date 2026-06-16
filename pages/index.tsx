import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import PopularKindergartens from '../libs/components/homepage/PopularKindergartens';
import Events from '../libs/components/homepage/Events';
import { Stack } from '@mui/material';
import Advertisement from '../libs/components/homepage/Advertisement';
import PlatformShowcase from '../libs/components/homepage/PlatformShowcase';
import FinalCta from '../libs/components/homepage/FinalCta';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import PageSeo from '../libs/components/seo/PageSeo';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return (
			<Stack className={'home-page'}>
				<PageSeo
					title="KidsGarden"
					description="Find kindergartens, submit applications, communicate with centers, and manage early learning with KidsGarden."
					canonicalPath="/"
				/>
				<PlatformShowcase />
				<PopularKindergartens />
				<Events />
				<Advertisement />
				<CommunityBoards />
				<FinalCta />
			</Stack>
		);
	} else {
		return (
			<Stack className={'home-page'}>
				<PageSeo
					title="KidsGarden"
					description="Find kindergartens, submit applications, communicate with centers, and manage early learning with KidsGarden."
					canonicalPath="/"
				/>
				<PlatformShowcase />
				<PopularKindergartens />
				<Events />
				<Advertisement />
				<CommunityBoards />
				<FinalCta />
			</Stack>
		);
	}
};

export default withLayoutMain(Home);
