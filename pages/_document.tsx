import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/png" href="/img/logo/favicon.svg" />

				{/* SEO */}
				<meta name="keyword" content={'nestar, nestar.uz, devex mern, mern nestjs fullstack'} />
				<meta
					name={'description'}
					content={
						'Discover kindergartens, manage early education centers, and connect parents, teachers, and center admins.'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
