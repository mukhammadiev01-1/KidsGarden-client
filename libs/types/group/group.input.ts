import { Direction } from '../../enums/common.enum';
import { GroupStatus } from '../../enums/group.enum';

export interface GroupInput {
	kindergartenId: string;
	groupName: string;
	groupAgeRange: string;
	groupCapacity: number;
	teacherIds?: string[];
	groupStatus?: GroupStatus;
}

interface GSearch {
	kindergartenId?: string;
	teacherId?: string;
	groupStatus?: GroupStatus;
	text?: string;
}

export interface GroupsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: GSearch;
}
