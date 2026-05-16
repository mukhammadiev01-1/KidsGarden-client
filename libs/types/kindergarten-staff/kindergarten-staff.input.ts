import { Direction } from '../../enums/common.enum';
import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';

export interface KindergartenStaffInput {
	kindergartenId: string;
	memberId: string;
	staffRole: StaffRole;
	staffStatus?: StaffStatus;
}

interface KSSearch {
	kindergartenId?: string;
	memberId?: string;
	staffRole?: StaffRole;
	staffStatus?: StaffStatus;
}

export interface KindergartenStaffsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: KSSearch;
}
