import type { IExecuteFunctions, INodeExecutionData, IHttpRequestOptions } from 'n8n-workflow';
import { authedRequest, chooseCredential, defaultJsonHeaders, getBase } from '../utils/http';
import { simplifyOne } from '../utils/simplify';
import { throwError } from '../utils/errors';
import { multiCmp, SortRule } from '../utils/sort';
import { readSortRules } from '../utils/readSort';

export async function get({ ctx, itemIndex }: { ctx: IExecuteFunctions; itemIndex: number }) {
	const credentialName = chooseCredential(ctx, itemIndex);
	const base = getBase(ctx, itemIndex);
	const identifierRaw = (ctx.getNodeParameter('identifier', itemIndex, '') as string).trim();
	if (!identifierRaw) throwError(ctx.getNode(), 'ID is required in "Get" mode.', itemIndex);

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${base}/advisory/${encodeURIComponent(identifierRaw)}`,
		returnFullResponse: false,
		headers: defaultJsonHeaders,
	};

	const res = await authedRequest(ctx, credentialName, options);
	const simplify = ctx.getNodeParameter('simplify', itemIndex, true) as boolean;
	return simplify ? { ...simplifyOne('advisory', res) } : res;
}

export async function getMany({ ctx, itemIndex }: { ctx: IExecuteFunctions; itemIndex: number }) {
	const credentialName = chooseCredential(ctx, itemIndex);
	const base = getBase(ctx, itemIndex);
	const limit = (ctx.getNodeParameter('limit', itemIndex, 50) as number) || 50;

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${base}/advisory`,
		qs: { limit },
		returnFullResponse: false,
		headers: defaultJsonHeaders,
	};

	const res = (await authedRequest(ctx, credentialName, options)) as any;
	const items: any[] = Array.isArray(res?.items) ? res.items : [];
	const rules: SortRule[] = readSortRules(ctx, itemIndex, 'advisory');
	const simplify = ctx.getNodeParameter('simplify', itemIndex, true) as boolean;

	let out = items;
	if (rules.length) out = [...out].sort((a, b) => multiCmp(a, b, rules, 'advisory'));

	out = out.slice(0, limit);

	const finalItems = simplify ? out.map((it) => simplifyOne('advisory', it)) : out;

	return [{ json: { ...res, items: finalItems } } as INodeExecutionData];
}
