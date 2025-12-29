export type SortRule = { field: string; direction: 'asc' | 'desc' };
export type ResourceKind = 'sbom' | 'vulnerability' | 'advisory';

const sevRank: Record<string, number> = {
  critical: 5,
  high: 4,
  hight: 4,
  medium: 3,
  low: 2,
  none: 1,
  unknown: 0,
};

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sevValue(v: unknown): number | null {
  const key = String(v ?? '').toLowerCase();
  return key in sevRank ? sevRank[key] : null;
}

function avgScoreValue(scores: any): number | null {
  if (!Array.isArray(scores)) return null;
  const values = scores
    .map((s: any) => num((s as any)?.value))
    .filter((v: number | null): v is number => v !== null);
  if (values.length === 0) return null;
  const total = values.reduce((sum, v) => sum + v, 0);
  return total / values.length;
}

function avgSeverity(scores: any): number | null {
  if (!Array.isArray(scores)) return null;
  const values = scores
    .map((s: any) => sevValue((s as any)?.severity))
    .filter((v: number | null): v is number => v !== null);
  if (values.length === 0) return null;
  const total = values.reduce((sum, v) => sum + v, 0);
  return total / values.length;
}

function cmpName(a: any, b: any): number {
  const avRaw = typeof a?.name === 'string' ? a.name : null;
  const bvRaw = typeof b?.name === 'string' ? b.name : null;
  const av = (avRaw ?? '').trim();
  const bv = (bvRaw ?? '').trim();

  const aMissing = av.length === 0;
  const bMissing = bv.length === 0;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1; // missing names go last
  if (bMissing) return -1;

  const aLower = av.toLowerCase();
  const bLower = bv.toLowerCase();
  return aLower < bLower ? -1 : aLower > bLower ? 1 : 0;
}

function cmpField(a: any, b: any, field: string): number {
  if (field === 'scores_value_avg') {
    const av = avgScoreValue(a?.scores);
    const bv = avgScoreValue(b?.scores);
    const aa = av ?? -Infinity;
    const bb = bv ?? -Infinity;
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  }

  if (field === 'scores_severity_avg') {
    const av = avgSeverity(a?.scores);
    const bv = avgSeverity(b?.scores);
    const aa = av ?? -Infinity;
    const bb = bv ?? -Infinity;
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  }

  if (field === 'name') {
    return cmpName(a, b);
  }

  // Numeric comparisons
  if (['number_of_packages', 'size', 'average_score'].includes(field)) {
    const av = num(a?.[field]);
    const bv = num(b?.[field]);
    const aa = av ?? -Infinity;
    const bb = bv ?? -Infinity;
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  }

  // Severity rank for vulnerabilities/advisories
  if (field === 'average_severity') {
    const av = String(a?.average_severity ?? '').toLowerCase();
    const bv = String(b?.average_severity ?? '').toLowerCase();
    const aa = sevRank[av] ?? -1;
    const bb = sevRank[bv] ?? -1;
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  }

  // String-ish
  const av = String(a?.[field] ?? '').toLowerCase();
  const bv = String(b?.[field] ?? '').toLowerCase();
  return av < bv ? -1 : av > bv ? 1 : 0;
}

export function multiCmp(a: any, b: any, rules: SortRule[]): number {
  for (const r of rules) {
    const base = cmpField(a, b, r.field);
    if (base !== 0) return r.direction === 'desc' ? -base : base;
  }
  return 0;
}
