import { GroupStatus } from '../../enums/group.enum';

export interface GroupUpdate {
	_id: string;
	groupName?: string;
	groupAgeRange?: string;
	groupCapacity?: number;
	teacherIds?: string[];
	groupStatus?: GroupStatus;
}
