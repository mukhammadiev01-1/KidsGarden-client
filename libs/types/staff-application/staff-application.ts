import { StaffRole } from '../../enums/kindergarten-staff.enum';
import { StaffApplicationStatus } from '../../enums/staff-application.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface StaffApplication {
	_id: string;
	kindergartenId: string;
	applicantId: string;
	requestedRole: StaffRole;
	applicationStatus: StaffApplicationStatus;
	message?: string;
	reviewedBy?: string;
	reviewedAt?: Date;
	rejectReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface StaffApplications {
	list: StaffApplication[];
	metaCounter: TotalCounter[];
}
