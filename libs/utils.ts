import numeral from 'numeral';
import { sweetMixinErrorAlert } from './sweetAlert';

export const formatterStr = (value: number | undefined): string => {
	return numeral(value).format('0,0') != '0' ? numeral(value).format('0,0') : '';
};

export const getKindergartenTypeLabel = (type?: string): string => {
	switch (type) {
		case 'APARTMENT':
			return 'Private Kindergarten';
		case 'VILLA':
			return 'Public Kindergarten';
		case 'HOUSE':
			return 'Daycare Center';
		default:
			return type || '';
	}
};

export const formatMonthlyFee = (value?: number): string => {
	const formattedValue = formatterStr(value);
	return formattedValue ? `$${formattedValue} / mo` : 'Fee on request';
};

export const likeTargetPropertyHandler = async (likeTargetProperty: any, id: string) => {
	try {
		await likeTargetProperty({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetPropertyHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};

export const likeTargetBoardArticleHandler = async (likeTargetBoardArticle: any, id: string) => {
	try {
		await likeTargetBoardArticle({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		console.log('ERROR, likeTargetBoardArticleHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};
