import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { authedRequest, chooseCredential, defaultJsonHeaders, getBase } from '../utils/http';
import { throwError } from '../utils/errors';
import { multiCmp, SortRule } from '../utils/sort';
import { readSortRules } from '../utils/readSort';
import { shapeOutput } from '../utils/output';

export async function get({ ctx, itemIndex }: { ctx: IExecuteFunctions; itemIndex: number }) {
  const credentialName = chooseCredential(ctx, itemIndex);
  const base = getBase(ctx, itemIndex);
  const identifierRaw = (ctx.getNodeParameter('identifierSha', itemIndex, '') as string).trim();
  if (!identifierRaw)
    throwError(ctx.getNode(), "The 'Identifier' parameter is required.", itemIndex);

  // If a bare SHA digest is provided without a sha* prefix, instruct the user to add it
  if (
    (/^[a-f0-9]{64}$/i.test(identifierRaw) ||
      /^[a-f0-9]{96}$/i.test(identifierRaw) ||
      /^[a-f0-9]{128}$/i.test(identifierRaw)) &&
    !/^sha(?:256|384|512):/i.test(identifierRaw)
  ) {
    throwError(
      ctx.getNode(),
      "Provide 'SBOM SHA' with a prefix: sha256:, sha384:, or sha512:.",
      itemIndex,
    );
  }

  const normalizedId = identifierRaw;

  const options: IHttpRequestOptions = {
    method: 'GET',
    url: `${base}/sbom/${encodeURIComponent(normalizedId)}`,
    returnFullResponse: false,
    headers: defaultJsonHeaders,
  };

  const res = await authedRequest(ctx, credentialName, options);
  return shapeOutput(ctx, itemIndex, 'sbom', res);
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
  const rules: SortRule[] = readSortRules(ctx, itemIndex, 'sbom', 'getMany');

  let out = items;
  if (rules.length) out = [...out].sort((a, b) => multiCmp(a, b, rules));

  out = out.slice(0, limit);

  const finalItems = out.map((it) => shapeOutput(ctx, itemIndex, 'sbom', it));
  return [{ json: { sboms: finalItems } }];
}
