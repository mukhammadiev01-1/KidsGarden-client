import { GetServerSideProps, NextPage } from 'next';
import '../../scss/routes/agent.route.scss';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/kindergartens',
		permanent: false,
	},
});

const AgentList: NextPage = () => null;

export default AgentList;
