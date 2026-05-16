import { GroupStatus } from '../../enums/group.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface Group {
	_id: string;
	kindergartenId: string;
	groupName: string;
	groupAgeRange: string;
	groupCapacity: number;
	teacherIds: string[];
	groupStatus: GroupStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface Groups {
	list: Group[];
	metaCounter: TotalCounter[];
}
