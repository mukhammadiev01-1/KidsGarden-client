import React from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';

const FeaturedKindergartensIntro = () => {
	return (
		<Stack className={'featured-kindergartens-intro'}>
			<Box component={'div'} className={'featured-kindergartens-copy'}>
				<span>Featured centers</span>
				<h2>Find the right kindergarten faster</h2>
				<p>Start with parent-loved centers, practical program details, and clear next steps for applying.</p>
			</Box>
			<Link href={'/kindergartens'}>See all kindergartens</Link>
		</Stack>
	);
};

export default FeaturedKindergartensIntro;
