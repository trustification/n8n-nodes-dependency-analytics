export type SortRule = { field: string; direction: 'asc' | 'desc' };
export type ResourceKind = 'sbom' | 'vulnerability' | 'advisory';

const sevRank: Record<string, number> = {
	critical: 4,
	high: 3,
	medium: 2,
	low: 1,
	none: 0,
};

function num(v: unknown): number | null {
	if (v === null || v === undefined) return null;
	if (typeof v === 'number') return v;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

function cmpField(a: any, b: any, field: string, resource: ResourceKind): number {
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

export function multiCmp(a: any, b: any, rules: SortRule[], resource: ResourceKind): number {
	for (const r of rules) {
		const base = cmpField(a, b, r.field, resource);
		if (base !== 0) return r.direction === 'desc' ? -base : base;
	}
	return 0;
}
