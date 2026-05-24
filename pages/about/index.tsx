import { GetServerSideProps, NextPage } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
	redirect: {
		destination: '/cs',
		permanent: false,
	},
});

const About: NextPage = () => null;

export default About;
