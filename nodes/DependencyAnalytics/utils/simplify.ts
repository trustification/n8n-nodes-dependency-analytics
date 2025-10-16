type SBOM = Record<string, any>;
type Vuln = Record<string, any>;
type Advisory = Record<string, any>;

const first = <T = any>(v: any): T | undefined => (Array.isArray(v) ? v[0] : undefined);

export function simplifyOne(resource: 'sbom' | 'vulnerability' | 'advisory', obj: any) {
	switch (resource) {
		case 'sbom':
			return simplifySbom(obj as SBOM);
		case 'vulnerability':
			return simplifyVuln(obj as Vuln);
		case 'advisory':
			return simplifyAdvisory(obj as Advisory);
	}
}

export function simplifySbom(item: SBOM) {
	const d = first(item?.described_by) ?? {};
	const firstPurl = first(d?.purl)?.purl;
	return {
		id: item.id,
		name: item.name ?? d.name ?? null,
		version: d.version ?? null,
		published: item.published ?? null,
		ingested: item.ingested ?? null,
		packages: item.number_of_packages ?? null,
		size: item.size ?? null,
		sha256: item.sha256 ?? null,
		purl: firstPurl ?? null,
		documentId: item.document_id ?? null,
	};
}

export function simplifyVuln(item: Vuln) {
	return {
		identifier: item.identifier ?? null,
		title: item.title ?? null,
		published: item.published ?? null,
		modified: item.modified ?? null,
		severity: item.average_severity ?? null,
		score: item.average_score ?? null,
		cwe: first(item.cwes) ?? null,
		advisories: Array.isArray(item.advisories) ? item.advisories.length : 0,
		reserved: item.reserved ?? null,
		withdrawn: item.withdrawn ?? null,
	};
}

export function simplifyAdvisory(item: Advisory) {
	return {
		documentId: item.document_id ?? null,
		identifier: item.identifier ?? null,
		title: item.title ?? null,
		issuer: item.issuer?.name ?? null,
		published: item.published ?? null,
		modified: item.modified ?? null,
		severity: item.average_severity ?? null,
		score: item.average_score ?? null,
		size: item.size ?? null,
		ingested: item.ingested ?? null,
	};
}
