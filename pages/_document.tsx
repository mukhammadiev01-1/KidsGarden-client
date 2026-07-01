import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import { normalizeLocale } from '../libs/i18n/languages';

interface KidsGardenDocumentProps extends DocumentInitialProps {
	locale: string;
}

export default class KidsGardenDocument extends Document<KidsGardenDocumentProps> {
	static async getInitialProps(ctx: DocumentContext): Promise<KidsGardenDocumentProps> {
		const initialProps = await Document.getInitialProps(ctx);
		return {
			...initialProps,
			locale: normalizeLocale(ctx.locale),
		};
	}

	render() {
		return (
			<Html lang={this.props.locale}>
				<Head>
					<meta name="robots" content="index,follow" />
					<meta name="theme-color" content="#2f7d4a" />
					<link rel="icon" href="/favicon.ico" />
					<link rel="icon" type="image/svg+xml" href="/img/logo/kidsgarden-mark.svg" />
					<meta name="keyword" content={'KidsGarden, kindergarten search, parent community, early education'} />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
