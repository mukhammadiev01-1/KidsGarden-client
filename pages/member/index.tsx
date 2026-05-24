import { GetServerSideProps, NextPage } from 'next';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/property',
		permanent: false,
	},
});

const MemberPage: NextPage = () => null;

export default withLayoutBasic(MemberPage);
