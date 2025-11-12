import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export function getBase(ctx: IExecuteFunctions, itemIndex: number): string {
  let baseURLRaw = ctx.getNodeParameter('baseURL', itemIndex, 'https://rhtpa.stage.devshift.net/api/v2/') as string;
  return baseURLRaw.replace(/\/+$/, '');
}

export function chooseCredential(ctx: IExecuteFunctions, itemIndex: number): string {
  const authMethod = ctx.getNodeParameter('authMethod', itemIndex) as string;
  switch (authMethod) {
    case 'rhtpaClientCredentials':
      return 'rhtpaClientCredsOAuth2Api';
    case 'trustifyClientCredentials':
      return 'trustifyClientCredsOAuth2Api';
    default:
      throw new Error(`Invalid authentication method: ${authMethod}`);
  }
}

export async function authedRequest<T = any>(
  ctx: IExecuteFunctions,
  credentialName: string,
  opts: IHttpRequestOptions,
) {
  return ctx.helpers.httpRequestWithAuthentication.call(ctx, credentialName, opts) as Promise<T>;
}

export const defaultJsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
