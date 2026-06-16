import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<meta name="theme-color" content="#2f7d4a" />
				<link rel="icon" href="/favicon.ico" />
				<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />
				<meta name="keyword" content={'KidsGarden, kindergarten search, parent community, early education'} />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
