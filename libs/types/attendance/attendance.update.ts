import { AttendanceStatus } from '../../enums/attendance.enum';

export interface AttendanceUpdate {
	_id: string;
	childId?: string;
	kindergartenId?: string;
	groupId?: string;
	attendanceDate?: Date | string;
	attendanceStatus?: AttendanceStatus;
	note?: string;
}
