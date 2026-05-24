import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import CommunityBoards from '../libs/components/homepage/CommunityBoards';
import PopularProperties from '../libs/components/homepage/PopularProperties';
import Events from '../libs/components/homepage/Events';
import TrendProperties from '../libs/components/homepage/TrendProperties';
import TopProperties from '../libs/components/homepage/TopProperties';
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
				<TrendProperties />
				<PopularProperties />
				<TopProperties />
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
				<TrendProperties />
				<PopularProperties />
				<TopProperties />
				<Events />
				<Advertisement />
				<CommunityBoards />
				<FinalCta />
			</Stack>
		);
	}
};

export default withLayoutMain(Home);
