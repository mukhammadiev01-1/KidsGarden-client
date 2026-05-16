import { ChildGender, ChildStatus } from '../../enums/child.enum';

export interface ChildUpdate {
	_id: string;
	childFullName?: string;
	childBirthDate?: Date | string;
	childGender?: ChildGender;
	childImage?: string;
	childStatus?: ChildStatus;
	parentId?: string;
	kindergartenId?: string;
	groupId?: string;
}
