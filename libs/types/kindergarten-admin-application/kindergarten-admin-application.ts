import { KindergartenAdminApplicationStatus } from '../../enums/kindergarten-admin-application.enum';
import { TotalCounter } from '../kindergarten/kindergarten';
import { MemberPreview } from '../member/member';

export interface KindergartenAdminApplication {
	_id: string;
	applicantId: string;
	applicationStatus: KindergartenAdminApplicationStatus;
	message?: string;
	kindergartenTitle?: string;
	kindergartenAddress?: string;
	kindergartenPhone?: string;
	businessInfo?: string;
	reviewedBy?: string;
	reviewedAt?: Date;
	rejectReason?: string;
	applicantData?: MemberPreview;
	createdAt: Date;
	updatedAt: Date;
}

export interface KindergartenAdminApplications {
	list: KindergartenAdminApplication[];
	metaCounter: TotalCounter[];
}
