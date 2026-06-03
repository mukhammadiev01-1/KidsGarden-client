export const truncateId = (id?: string, visible = 6) => {
	if (!id) return '-';
	if (id.length <= visible * 2 + 3) return id;
	return `${id.slice(0, visible)}...${id.slice(-visible)}`;
};

export const formatDate = (date?: Date | string) => {
	if (!date) return '-';
	const parsedDate = new Date(date);
	if (Number.isNaN(parsedDate.getTime())) return String(date).slice(0, 10);

	return parsedDate.toLocaleDateString();
};

export const getStatusLabel = (status?: string) => {
	if (!status) return '-';
	if (status === 'SOLD') return 'Closed';
	return status
		.toLowerCase()
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const getStatusChipSx = (status?: string) => {
	const normalizedStatus = status ?? '';
	const palette: Record<string, { color: string; background: string }> = {
		ACTIVE: { color: '#166534', background: '#dcfce7' },
		APPROVED: { color: '#166534', background: '#dcfce7' },
		PRESENT: { color: '#166534', background: '#dcfce7' },
		PENDING: { color: '#92400e', background: '#fef3c7' },
		CLOSED: { color: '#92400e', background: '#fef3c7' },
		SOLD: { color: '#92400e', background: '#fef3c7' },
		LATE: { color: '#92400e', background: '#fef3c7' },
		FULL: { color: '#1d4ed8', background: '#dbeafe' },
		EXCUSED: { color: '#1d4ed8', background: '#dbeafe' },
		INACTIVE: { color: '#4b5563', background: '#f3f4f6' },
		REMOVED: { color: '#4b5563', background: '#f3f4f6' },
		ARCHIVED: { color: '#4b5563', background: '#f3f4f6' },
		GRADUATED: { color: '#4b5563', background: '#f3f4f6' },
		TRANSFERRED: { color: '#4b5563', background: '#f3f4f6' },
		CANCELED: { color: '#4b5563', background: '#f3f4f6' },
		ABSENT: { color: '#991b1b', background: '#fee2e2' },
		BLOCKED: { color: '#991b1b', background: '#fee2e2' },
		REJECTED: { color: '#991b1b', background: '#fee2e2' },
	};

	return {
		height: 26,
		fontWeight: 700,
		color: palette[normalizedStatus]?.color ?? '#4b5563',
		backgroundColor: palette[normalizedStatus]?.background ?? '#f3f4f6',
	};
};

export const shouldHideKindergartenSelector = (memberType?: string, kindergartens: any[] = []) => {
	return memberType === 'KINDERGARTEN_ADMIN' && kindergartens.length === 1;
};

export const getSelectedKindergartenTitle = (kindergartens: any[] = [], selectedKindergartenId?: string) => {
	return (
		kindergartens.find((kindergarten) => kindergarten._id === selectedKindergartenId)?.kindergartenTitle ||
		kindergartens[0]?.kindergartenTitle ||
		'Selected kindergarten'
	);
};

export const getDashboardRoleHeading = (memberType?: string) => {
	switch (memberType) {
		case 'KINDERGARTEN_ADMIN':
			return 'KINDERGARTEN ADMIN';
		case 'TEACHER':
			return 'TEACHER DASHBOARD';
		case 'PARENT':
			return 'PARENT DASHBOARD';
		case 'SUPER_ADMIN':
			return 'SUPER ADMIN';
		default:
			return 'DASHBOARD';
	}
};
