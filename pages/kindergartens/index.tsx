import KindergartensPage from '../../libs/components/kindergartens/KindergartensPage';
import PageSeo from '../../libs/components/seo/PageSeo';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Kindergartens = (props: any) => {
	const { t } = useTranslation('common');

	return (
		<>
			<PageSeo
				title={t('kindergartens.seoTitle')}
				description={t('kindergartens.seoDescription')}
				canonicalPath="/kindergartens"
			/>
			<KindergartensPage {...props} />
		</>
	);
};

export default Kindergartens;
