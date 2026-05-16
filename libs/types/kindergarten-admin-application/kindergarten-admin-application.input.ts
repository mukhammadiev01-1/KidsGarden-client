import { Direction } from '../../enums/common.enum';
import { KindergartenAdminApplicationStatus } from '../../enums/kindergarten-admin-application.enum';

export interface KindergartenAdminApplicationInput {
	message?: string;
	kindergartenTitle?: string;
	kindergartenAddress?: string;
	kindergartenPhone?: string;
	businessInfo?: string;
}

interface KindergartenAdminApplicationSearch {
	applicantId?: string;
	applicationStatus?: KindergartenAdminApplicationStatus;
}

export interface KindergartenAdminApplicationsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search?: KindergartenAdminApplicationSearch;
}

export interface KindergartenAdminApplicationReviewInput {
	_id: string;
	rejectReason?: string;
}
