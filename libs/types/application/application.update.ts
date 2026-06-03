import { ApplicationStatus } from '../../enums/application.enum';

export interface ApplicationStatusUpdateInput {
	_id: string;
	status: ApplicationStatus;
	adminNote?: string;
}
