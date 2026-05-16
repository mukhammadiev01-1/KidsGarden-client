import { ChildGender, ChildStatus } from '../../enums/child.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface Child {
	_id: string;
	childFullName: string;
	childBirthDate: Date | string;
	childGender: ChildGender;
	childImage?: string;
	childStatus: ChildStatus;
	parentId: string;
	kindergartenId: string;
	groupId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Children {
	list: Child[];
	metaCounter: TotalCounter[];
}
