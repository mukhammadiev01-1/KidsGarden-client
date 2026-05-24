import React from 'react';
import Link from 'next/link';
import { Stack, Box } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';

const FinalCta = () => {
	return (
		<Stack component={'section'} className={'final-cta-section'}>
			<Box component={'div'} className={'final-cta-copy'}>
				<h2>Start your KidsGarden journey today</h2>
				<p>Join thousands of families and centers making learning joyful, connected, and easy.</p>
			</Box>
			<Box component={'div'} className={'final-cta-visual'} aria-hidden />
			<Box component={'div'} className={'final-cta-actions'}>
				<Link href={'/property'}>
					<span>
						<SearchRoundedIcon /> Find Kindergartens
					</span>
				</Link>
				<Link href={'/account/join'}>
					<span>
						<PersonAddAltRoundedIcon /> Join as Parent
					</span>
				</Link>
				<Link href={'/cs'}>
					<span>
						<BusinessRoundedIcon /> For Centers
					</span>
				</Link>
			</Box>
		</Stack>
	);
};

export default FinalCta;
