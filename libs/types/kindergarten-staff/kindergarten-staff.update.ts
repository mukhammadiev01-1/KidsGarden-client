import { StaffRole, StaffStatus } from '../../enums/kindergarten-staff.enum';

export interface KindergartenStaffUpdate {
	_id: string;
	staffRole?: StaffRole;
	staffStatus?: StaffStatus;
}
