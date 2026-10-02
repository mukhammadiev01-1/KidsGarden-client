import { GetServerSideProps, NextPage } from 'next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import '../../scss/routes/member.route.scss';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/kindergartens',
		permanent: false,
	},
});

const MemberPage: NextPage = () => null;

export default withLayoutBasic(MemberPage);
