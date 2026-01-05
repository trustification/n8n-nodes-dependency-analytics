import type { IExecuteFunctions } from 'n8n-workflow';
import { simplifyOne } from './simplify';

type Resource = 'sbom' | 'vulnerability' | 'advisory';

function ensureId(resource: Resource, fields: string[]): string[] {
  const must =
    resource === 'sbom' ? 'id' : resource === 'vulnerability' ? 'identifier' : 'document_id';
  return fields.includes(must) ? fields : [must, ...fields];
}

// dot-path get for nested fields (issuer.name)
function getPath(obj: any, path: string) {
  if (!path.includes('.')) return obj?.[path];
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function project(obj: any, fields: string[]) {
  const out: Record<string, any> = {};
  for (const f of fields) out[f] = getPath(obj, f);
  return out;
}

// Derive convenient top-level fields for SBOM when using Selected Fields mode.
function first<T = any>(v: any): T | undefined {
  return Array.isArray(v) ? v[0] : undefined;
}

function deriveSbomFields(source: any): any {
  const described = first(source?.described_by) ?? {};
  const firstPurl = first(described?.purl)?.purl;
  const derived = {
    name: source?.name ?? described?.name ?? null,
    version: described?.version ?? null,
    purl: firstPurl ?? null,
  };
  return { ...source, ...derived };
}

export function readSelectedFields(
  ctx: IExecuteFunctions,
  i: number,
  resource: Resource,
): string[] {
  const name =
    resource === 'sbom'
      ? 'sbomSelectedFields'
      : resource === 'vulnerability'
        ? 'vulnSelectedFields'
        : 'advisorySelectedFields';
  const v = ctx.getNodeParameter(name, i, []) as string[];
  return Array.isArray(v) ? v : [];
}

export function shapeOutput(ctx: IExecuteFunctions, i: number, resource: Resource, obj: any): any {
  const mode = ctx.getNodeParameter('outputMode', i, 'simplified') as
    | 'simplified'
    | 'raw'
    | 'selected';

  if (mode === 'raw') return obj;

  if (mode === 'simplified') {
    return simplifyOne(resource, obj);
  }

  // selected fields
  let selected = readSelectedFields(ctx, i, resource);
  selected = ensureId(resource, selected);
  const source = resource === 'sbom' ? deriveSbomFields(obj) : obj;
  return project(source, selected);
}
