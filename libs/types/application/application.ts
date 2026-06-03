import { ApplicationStatus } from '../../enums/application.enum';
import { Kindergarten, TotalCounter } from '../kindergarten/kindergarten';
import { MemberPreview } from '../member/member';

export interface ApplicationDocument {
	url: string;
	name: string;
	mimeType: string;
	size: number;
}

export interface Application {
	_id: string;
	parentId: string;
	kindergartenId: string;
	kindergartenOwnerId: string;
	childName: string;
	childAge: number;
	parentMessage?: string;
	adminNote?: string;
	documents?: ApplicationDocument[];
	status: ApplicationStatus;
	reviewedBy?: string;
	reviewedAt?: Date | string;
	canceledAt?: Date | string;
	createdAt: Date | string;
	updatedAt: Date | string;
	parentData?: MemberPreview;
	kindergartenData?: Kindergarten;
}

export interface Applications {
	list: Application[];
	metaCounter?: TotalCounter[];
}
