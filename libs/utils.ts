import numeral from 'numeral';
import { sweetMixinErrorAlert } from './sweetAlert';

export const formatterStr = (value: number | undefined): string => {
	return numeral(value).format('0,0') != '0' ? numeral(value).format('0,0') : '';
};

export const getKindergartenTypeLabel = (type?: string): string => {
	switch (type) {
		case 'PRIVATE_KINDERGARTEN':
		case 'APARTMENT':
			return 'Private Kindergarten';
		case 'PUBLIC_KINDERGARTEN':
		case 'VILLA':
			return 'Public Kindergarten';
		case 'DAYCARE_CENTER':
		case 'HOUSE':
			return 'Daycare Center';
		case 'PRESCHOOL':
			return 'Preschool';
		case 'EARLY_LEARNING_CENTER':
			return 'Early Learning Center';
		default:
			return type || '';
	}
};

export const formatMonthlyFee = (value?: number): string => {
	const formattedValue = formatterStr(value);
	return formattedValue ? `${formattedValue} UZS per month` : 'Fee on request';
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
