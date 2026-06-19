import { GetServerSideProps } from 'next';

const AccountLoginPage = () => null;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
	const params = new URLSearchParams();

	Object.entries(query).forEach(([key, value]) => {
		if (key === 'mode') return;
		if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
		else if (value !== undefined) params.set(key, value);
	});

	params.set('mode', 'login');

	return {
		redirect: {
			destination: `/account/join?${params.toString()}`,
			permanent: false,
		},
	};
};

export default AccountLoginPage;
