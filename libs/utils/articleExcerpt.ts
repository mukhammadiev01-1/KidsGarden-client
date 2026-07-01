const DEFAULT_EXCERPT = 'Helpful ideas and safe community support for KidsGarden families.';

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const getArticleExcerpt = (
	content?: string | null,
	maxLength = 118,
	fallback = DEFAULT_EXCERPT,
): string => {
	const text = normalizeWhitespace(
		(content || '')
			.replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
			.replace(/\[([^\]]+)]\((?:[^)]+)\)/g, '$1')
			.replace(/https?:\/\/\S*\/uploads\/article\/\S+/g, ' ')
			.replace(/\/uploads\/article\/\S+/g, ' ')
			.replace(/https?:\/\/[^\s)]+/g, ' ')
			.replace(/<[^>]*>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/[`*_~>#-]+/g, ' '),
	);

	if (!text) return fallback;
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
};
