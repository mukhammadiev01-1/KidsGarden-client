import { GetServerSideProps, NextPage } from 'next';
import '../../scss/routes/agent.route.scss';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/kindergartens',
		permanent: false,
	},
});

const AgentDetail: NextPage = () => null;

export default AgentDetail;
