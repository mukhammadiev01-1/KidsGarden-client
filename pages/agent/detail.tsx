import { GetServerSideProps, NextPage } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/kindergartens',
		permanent: false,
	},
});

const AgentDetail: NextPage = () => null;

export default AgentDetail;
