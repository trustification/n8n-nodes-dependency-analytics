import type { IExecuteFunctions } from 'n8n-workflow';
import type { ResourceKind, SortRule } from './sort';

export function readSortRules(
  ctx: IExecuteFunctions,
  i: number,
  resource: ResourceKind,
): SortRule[] {
  const path =
    resource === 'sbom'
      ? 'sortingSbom.sort'
      : resource === 'vulnerability'
        ? 'sortingVuln.sort'
        : 'sortingAdvisory.sort';
  return (ctx.getNodeParameter(path, i, []) as SortRule[]) ?? [];
}
