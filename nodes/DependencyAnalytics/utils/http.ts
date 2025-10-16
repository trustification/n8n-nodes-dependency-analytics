import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export function getBase(ctx: IExecuteFunctions, itemIndex: number): string {
	const baseURLRaw = ctx.getNodeParameter('baseURL', itemIndex) as string;
	return baseURLRaw.replace(/\/+$/, '');
}

export function chooseCredential(ctx: IExecuteFunctions, itemIndex: number): string {
	const authMethod = ctx.getNodeParameter('authMethod', itemIndex) as string;
	return authMethod === 'authorizationCode' ? 'trustifyAuthCodeOAuth2Api' : 'trustifyClientOAuth2Api';
}

export async function authedRequest<T = any>(
	ctx: IExecuteFunctions,
	credentialName: string,
	opts: IHttpRequestOptions,
) {
	return ctx.helpers.httpRequestWithAuthentication.call(ctx, credentialName, opts) as Promise<T>;
}

export const defaultJsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };
