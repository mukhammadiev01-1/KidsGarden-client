import { Direction } from '../../enums/common.enum';
import { ApplicationStatus } from '../../enums/application.enum';

export interface ApplicationDocumentInput {
	url: string;
	name: string;
	mimeType: string;
	size: number;
}

export interface ApplicationInput {
	kindergartenId: string;
	childName: string;
	childAge: number;
	parentMessage?: string;
	documents?: ApplicationDocumentInput[];
}

interface ApplicationSearch {
	parentId?: string;
	kindergartenId?: string;
	kindergartenOwnerId?: string;
	status?: ApplicationStatus;
}

export interface ApplicationsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ApplicationSearch;
}
