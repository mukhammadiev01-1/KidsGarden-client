import { Direction } from '../../enums/common.enum';
import { ChildGender, ChildStatus } from '../../enums/child.enum';

export interface ChildInput {
	childFullName: string;
	childBirthDate: Date | string;
	childGender: ChildGender;
	childImage?: string;
	childStatus?: ChildStatus;
	parentId: string;
	kindergartenId: string;
	groupId: string;
}

interface CSearch {
	parentId?: string;
	kindergartenId?: string;
	groupId?: string;
	childStatus?: ChildStatus;
	text?: string;
}

export interface ChildrenInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: CSearch;
}
