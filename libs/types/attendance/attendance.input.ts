import { Direction } from '../../enums/common.enum';
import { AttendanceStatus } from '../../enums/attendance.enum';

export interface AttendanceInput {
	childId: string;
	kindergartenId: string;
	groupId: string;
	attendanceDate: Date | string;
	attendanceStatus: AttendanceStatus;
	note?: string;
}

interface AISearch {
	childId?: string;
	kindergartenId?: string;
	groupId?: string;
	attendanceDate?: Date | string;
	attendanceStatus?: AttendanceStatus;
}

export interface AttendancesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AISearch;
}

export interface AttendancePaginationInput {
	page: number;
	limit: number;
	attendanceDate?: Date | string;
	attendanceStatus?: AttendanceStatus;
}
