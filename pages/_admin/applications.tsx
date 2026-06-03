import React from 'react';
import type { NextPage } from 'next';
import { Box } from '@mui/material';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import ApplicationList from '../../libs/components/admin/applications/ApplicationList';
import { Direction } from '../../libs/enums/common.enum';

const AdminApplications: NextPage = () => {
	return (
		<Box component="div" className="content">
			<ApplicationList
				initialInquiry={{
					page: 1,
					limit: 50,
					sort: 'createdAt',
					direction: Direction.DESC,
					search: {},
				}}
			/>
		</Box>
	);
};

export default withAdminLayout(AdminApplications);
