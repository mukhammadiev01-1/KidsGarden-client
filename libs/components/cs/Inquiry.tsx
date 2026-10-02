import React from 'react';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const Inquiry = () => {
	const { t } = useTranslation('common');
	const device = useDeviceDetect();

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	if (device === 'mobile') {
		return <div>{t('csPage.Inquiry.mobilePlaceholder')}</div>;
	} else {
		return <div>{t('csPage.Inquiry.pcPlaceholder')}</div>;
	}
};

export default Inquiry;
