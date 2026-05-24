import { GetServerSideProps, NextPage } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/property',
		permanent: false,
	},
});

const AgentList: NextPage = () => null;

export default AgentList;
