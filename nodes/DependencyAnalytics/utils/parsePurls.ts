import type { IExecuteFunctions } from 'n8n-workflow';
import { throwError } from './errors';

const dedupe = (arr: string[]) => Array.from(new Set(arr));

function isStringArray(v: unknown): v is string[] {
	return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

export function parsePurls(
	rawParam: unknown,
	_ctx: IExecuteFunctions,
	_itemIndex: number,
): string[] {
	// Case 1: already an array
	if (isStringArray(rawParam)) {
		return dedupe(rawParam.map((s) => s.trim()).filter(Boolean));
	}

	// Case 2: string input (JSON array or newline-separated)
	if (typeof rawParam === 'string') {
		const trimmed = rawParam.trim();

		// JSON array
		if (trimmed.startsWith('[')) {
			const parsed = JSON.parse(trimmed);
			if (!isStringArray(parsed)) {
				throwError(_ctx.getNode(), 'PURLs must be a JSON array of strings.', _itemIndex);
			}
			return dedupe(parsed.map((s: any) => s.trim()).filter(Boolean));
		}

		// newline-separated
		return dedupe(
			trimmed
				.split(/\r?\n/)
				.map((s) => s.trim())
				.filter((s) => s && !s.startsWith('#')),
		);
	}

	// Case 3: object with { purls: [...] }
	if (rawParam && typeof rawParam === 'object' && 'purls' in (rawParam as any)) {
		const candidate = (rawParam as { purls: any }).purls;
		if (!isStringArray(candidate)) {
			throwError(_ctx.getNode(), '`purls` must be an array of strings.', _itemIndex);
		}
		return dedupe(candidate.map((s: any) => s.trim()).filter(Boolean));
	}

	throwError(
		_ctx.getNode(),
		'Provide PURLs as a JSON array, one-per-line string, or an array expression.',
		_itemIndex,
	);

	return [];
}
