import KindergartenDetailPage from '../../libs/components/kindergartens/KindergartenDetailPage';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import '../../scss/routes/kindergartens-detail.route.scss';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

export default KindergartenDetailPage;
