export enum ApplicationStatus {
	PENDING = 'PENDING',
	REVIEWING = 'REVIEWING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	CANCELED = 'CANCELED',
	NEED_MORE_INFO = 'NEED_MORE_INFO',
}

export const ACTIVE_APPLICATION_STATUSES = [
	ApplicationStatus.PENDING,
	ApplicationStatus.REVIEWING,
	ApplicationStatus.NEED_MORE_INFO,
];

export const FINAL_APPLICATION_STATUSES = [
	ApplicationStatus.APPROVED,
	ApplicationStatus.REJECTED,
	ApplicationStatus.CANCELED,
];
