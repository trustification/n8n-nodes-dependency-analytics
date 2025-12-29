import type { IExecuteFunctions } from 'n8n-workflow';
import type { ResourceKind, SortRule } from './sort';

export type OperationKind = 'get' | 'getMany' | 'analyze';

const sortPath: Record<ResourceKind, Partial<Record<OperationKind, string>>> = {
  sbom: {
    getMany: 'sortingSbom.sort',
  },
  vulnerability: {
    getMany: 'sortingVuln.sort',
  },
  advisory: {
    getMany: 'sortingAdvisoryGetMany.sort',
    analyze: 'sortingAdvisoryAnalyze.sort',
  },
};

export function readSortRules(
  ctx: IExecuteFunctions,
  i: number,
  resource: ResourceKind,
  operation: OperationKind,
): SortRule[] {
  const path = sortPath[resource]?.[operation];
  if (!path) return [];
  return (ctx.getNodeParameter(path, i, []) as SortRule[]) ?? [];
}
