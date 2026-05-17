import React from 'react';
import { Stack, Box } from '@mui/material';

const Notice = () => {
	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	const data = [
		{
			no: 1,
			event: true,
			title: 'Welcome to the KidsGarden Help Center',
			date: '01.03.2024',
		},
		{
			no: 2,
			title: 'Share questions, family experiences, and kindergarten updates in Community',
			date: '31.03.2024',
		},
	];

	return (
		<Stack className={'notice-content'}>
			<span className={'title'}>Notices</span>
			<Stack className={'main'}>
				<Box component={'div'} className={'top'}>
					<span>number</span>
					<span>title</span>
					<span>date</span>
				</Box>
				<Stack className={'bottom'}>
					{data.map((ele: any) => (
						<div className={`notice-card ${ele?.event && 'event'}`} key={ele.title}>
							{ele?.event ? <div>notice</div> : <span className={'notice-number'}>{ele.no}</span>}
							<span className={'notice-title'}>{ele.title}</span>
							<span className={'notice-date'}>{ele.date}</span>
						</div>
					))}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Notice;
