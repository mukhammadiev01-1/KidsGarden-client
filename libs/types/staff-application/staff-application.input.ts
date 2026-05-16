import { Direction } from '../../enums/common.enum';
import { StaffRole } from '../../enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';

export interface StaffApplicationInput {
	kindergartenId: string;
	requestedRole: StaffRole;
	message?: string;
}

interface StaffApplicationSearch {
	kindergartenId?: string;
	applicantId?: string;
	requestedRole?: StaffRole;
	applicationStatus?: StaffApplicationStatus;
}

export interface StaffApplicationsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: StaffApplicationSearch;
}

export interface StaffApplicationReviewInput {
	_id: string;
	rejectReason?: string;
}
