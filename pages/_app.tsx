import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
import { Poppins } from 'next/font/google';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AiAssistant from '../libs/components/ai/AiAssistant';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';

const poppins = Poppins({
	subsets: ['latin'],
	weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
	display: 'swap',
	variable: '--font-poppins',
});

const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);
	const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

	const appContent = (
		<div className={poppins.variable}>
			<ApolloProvider client={client}>
				<ThemeProvider theme={theme}>
					<CssBaseline />
					<Component {...pageProps} />
					<AiAssistant />
				</ThemeProvider>
			</ApolloProvider>
		</div>
	);

	return googleClientId ? (
		<GoogleOAuthProvider clientId={googleClientId} locale="en">
			{appContent}
		</GoogleOAuthProvider>
	) : (
		appContent
	);
};

export default appWithTranslation(App);
