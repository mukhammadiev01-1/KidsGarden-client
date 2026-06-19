import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';

const RecentlyVisited: NextPage = () => {
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/

	/** HANDLERS **/

	if (device === 'mobile') {
		return <div>Recently visited kindergartens are available on desktop for now.</div>;
	} else {
		return (
			<div id="my-favorites-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Recently Visited</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					<div className={'no-data coming-soon-state'}>
						<img src="/img/icons/icoAlert.svg" alt="" />
						<p>Recently visited kindergartens are coming soon.</p>
						<span>Your browsing history will appear here after account history is connected.</span>
					</div>
				</Stack>
			</div>
		);
	}
};

export default RecentlyVisited;
