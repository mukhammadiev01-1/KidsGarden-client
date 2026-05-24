import React from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';

const FeaturedKindergartensIntro = () => {
	return (
		<Stack className={'featured-kindergartens-intro'}>
			<Box component={'div'} className={'featured-kindergartens-copy'}>
				<span>Featured centers</span>
				<h2>Featured Kindergartens</h2>
				<p>Explore active centers, popular choices and trusted options for families.</p>
			</Box>
			<Link href={'/property'}>See all kindergartens</Link>
		</Stack>
	);
};

export default FeaturedKindergartensIntro;
