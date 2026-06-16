import React from 'react';
import { Stack, Box } from '@mui/material';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ToysRoundedIcon from '@mui/icons-material/ToysRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import LunchDiningRoundedIcon from '@mui/icons-material/LunchDiningRounded';
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded';
import BackpackRoundedIcon from '@mui/icons-material/BackpackRounded';

const storeItems = [
	{
		title: 'Books',
		copy: 'Fun and educational storybooks.',
		icon: MenuBookRoundedIcon,
	},
	{
		title: 'Toys & Games',
		copy: 'Learning through play.',
		icon: ToysRoundedIcon,
	},
	{
		title: 'Learning Supplies',
		copy: 'Creative tools for every class.',
		icon: SchoolRoundedIcon,
	},
	{
		title: 'Lunchbox / Uniforms',
		copy: 'Practical and kid-friendly essentials.',
		icon: LunchDiningRoundedIcon,
		altIcon: CheckroomRoundedIcon,
	},
];

const Advertisement = () => {
	return (
		<Stack component={'section'} className={'video-frame kg-store-section'}>
			<Stack className={'store-heading'}>
				<h2>
					KidsGarden Store <span className={'sprout-accent'} aria-hidden />
				</h2>
				<p>Carefully selected items for your little one - coming soon!</p>
			</Stack>
			<Stack className={'store-container'}>
				<Box component={'article'} className={'store-feature-card'}>
					<Box component={'div'} className={'store-feature-copy'}>
						<h3>Everything they need for a happy day</h3>
						<p>Books, toys, lunch supplies, uniforms and more.</p>
						<span>Coming Soon</span>
					</Box>
					<Box component={'div'} className={'store-feature-visual'} aria-hidden>
						<BackpackRoundedIcon />
					</Box>
				</Box>
				<Box component={'div'} className={'store-product-grid'}>
					{storeItems.map((item) => {
						const Icon = item.icon;
						const AltIcon = item.altIcon;

						return (
							<Box component={'article'} className={'store-product-card'} key={item.title}>
								<strong>Coming Soon</strong>
								<span className={'store-product-icon'}>
									<Icon />
									{AltIcon && <AltIcon />}
								</span>
								<h3>{item.title}</h3>
								<p>{item.copy}</p>
							</Box>
						);
					})}
				</Box>
			</Stack>
		</Stack>
	);
};

export default Advertisement;
