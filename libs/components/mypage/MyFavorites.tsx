import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';

const MyFavorites: NextPage = () => {
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/

	/** HANDLERS **/

	if (device === 'mobile') {
		return <div>Favorite kindergartens are available on desktop for now.</div>;
	} else {
		return (
			<div id="my-favorites-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">My Favorites</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					<div className={'no-data coming-soon-state'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>Saved kindergarten lists are coming soon.</p>
						<span>Favorites will appear here after this feature is connected to your account.</span>
					</div>
				</Stack>
			</div>
		);
	}
};

export default MyFavorites;
