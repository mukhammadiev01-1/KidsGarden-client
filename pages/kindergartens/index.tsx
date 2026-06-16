import KindergartensPage from '../../libs/components/kindergartens/KindergartensPage';
import PageSeo from '../../libs/components/seo/PageSeo';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Kindergartens = (props: any) => (
	<>
		<PageSeo
			title="Find Kindergartens"
			description="Browse kindergarten profiles, locations, programs, fees, maps, and parent-friendly information on KidsGarden."
			canonicalPath="/kindergartens"
		/>
		<KindergartensPage {...props} />
	</>
);

export default Kindergartens;
