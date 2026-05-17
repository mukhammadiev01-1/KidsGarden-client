import React from 'react';
import { Stack, Box } from '@mui/material';
import Link from 'next/link';

const Advertisement = () => {
	return (
		<Stack className={'video-frame'}>
			<Box component={'div'} className={'family-help-copy'}>
				<span>For families choosing with care</span>
				<h2>Keep discovery, updates, and parent questions in one calm place.</h2>
				<p>Browse kindergartens, save favorites, and use the community when you need a second opinion.</p>
				<div className={'family-help-actions'}>
					<Link href={'/property'}>Find Kindergartens</Link>
					<Link href={'/community'}>Visit Community</Link>
				</div>
			</Box>
		</Stack>
	);
};

export default Advertisement;
