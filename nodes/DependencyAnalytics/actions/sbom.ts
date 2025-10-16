import type { IExecuteFunctions, INodeExecutionData, IHttpRequestOptions } from 'n8n-workflow';
import { authedRequest, chooseCredential, defaultJsonHeaders, getBase } from '../utils/http';
import { simplifyOne } from '../utils/simplify';
import { throwError } from '../utils/errors';

export async function get({ ctx, itemIndex }: { ctx: IExecuteFunctions; itemIndex: number }) {
	const credentialName = chooseCredential(ctx, itemIndex);
	const base = getBase(ctx, itemIndex);
	const identifierRaw = (ctx.getNodeParameter('identifier', itemIndex, '') as string).trim();
	if (!identifierRaw) throwError(ctx.getNode(), 'ID is required in "Get" mode.', itemIndex);

	const normalizedId = /^sha256:/i.test(identifierRaw)
		? identifierRaw
		: /^[a-f0-9]{64}$/i.test(identifierRaw)
			? `sha256:${identifierRaw}`
			: identifierRaw;

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${base}/sbom/${encodeURIComponent(normalizedId)}`,
		returnFullResponse: false,
		headers: defaultJsonHeaders,
	};

	const res = await authedRequest(ctx, credentialName, options);
	const simplify = ctx.getNodeParameter('simplify', itemIndex, true) as boolean;
	return simplify ? { ...simplifyOne('sbom', res) } : res;
}

export async function getMany({ ctx, itemIndex }: { ctx: IExecuteFunctions; itemIndex: number }) {
	const credentialName = chooseCredential(ctx, itemIndex);
	const base = getBase(ctx, itemIndex);
	const limit = (ctx.getNodeParameter('limit', itemIndex, 50) as number) || 50;

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${base}/sbom`,
		qs: { limit },
		returnFullResponse: false,
		headers: defaultJsonHeaders,
	};

	const res = (await authedRequest(ctx, credentialName, options)) as any;
	const items: any[] = Array.isArray(res?.items) ? res.items.slice(0, limit) : [];
	const simplify = ctx.getNodeParameter('simplify', itemIndex, true) as boolean;

	const finalItems = simplify ? items.map((it) => simplifyOne('sbom', it)) : items;

	return [{ json: { ...res, items: finalItems } } as INodeExecutionData];
}
