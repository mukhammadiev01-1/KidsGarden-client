import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import PopularKindergartens from '../libs/components/homepage/PopularKindergartens';
import Events from '../libs/components/homepage/Events';
import TrendingKindergartens from '../libs/components/homepage/TrendingKindergartens';
import TopKindergartens from '../libs/components/homepage/TopKindergartens';
import { Stack } from '@mui/material';
import Advertisement from '../libs/components/homepage/Advertisement';
import PlatformShowcase from '../libs/components/homepage/PlatformShowcase';
import FeaturedKindergartensIntro from '../libs/components/homepage/FeaturedKindergartensIntro';
import FinalCta from '../libs/components/homepage/FinalCta';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
				<PlatformShowcase />
				<FeaturedKindergartensIntro />
				<TrendingKindergartens />
				<PopularKindergartens />
				<TopKindergartens />
				<Events />
				<Advertisement />
				<CommunityBoards />
				<FinalCta />
			</Stack>
		);
	} else {
		return (
			<Stack className={'home-page'}>
				<PlatformShowcase />
				<FeaturedKindergartensIntro />
				<TrendingKindergartens />
				<PopularKindergartens />
				<TopKindergartens />
				<Events />
				<Advertisement />
				<CommunityBoards />
				<FinalCta />
			</Stack>
		);
	}
};

export default withLayoutMain(Home);
