import { AttendanceStatus } from '../../enums/attendance.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface Attendance {
	_id: string;
	childId: string;
	kindergartenId: string;
	groupId: string;
	attendanceDate: Date | string;
	attendanceStatus: AttendanceStatus;
	markedBy: string;
	note?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Attendances {
	list: Attendance[];
	metaCounter: TotalCounter[];
}
