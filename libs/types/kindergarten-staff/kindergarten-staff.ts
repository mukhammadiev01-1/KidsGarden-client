import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface KindergartenStaff {
	_id: string;
	kindergartenId: string;
	memberId: string;
	staffRole: StaffRole;
	staffStatus: StaffStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface KindergartenStaffs {
	list: KindergartenStaff[];
	metaCounter: TotalCounter[];
}
