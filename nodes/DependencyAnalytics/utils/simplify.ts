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
    advisories: Array.isArray(item.advisories) ? item.advisories : [],
    reserved: item.reserved ?? null,
    withdrawn: item.withdrawn ?? null,
  };
}

export function simplifyAdvisory(item: Advisory) {
  return {
    uuid: item.uuid ?? null,
    identifier: item.identifier ?? null,
    document_id: item.document_id ?? null,
    title: item.title ?? null,
    sha256: item.sha256 ?? null,
    size: item.size ?? null,
    average_severity: item.average_severity ?? null,
    average_score: item.average_score ?? null,
    vulnerabilities: Array.isArray(item.vulnerabilities)
      ? item.vulnerabilities.map((v: any) => ({
          normative: v?.normative ?? null,
          identifier: v?.identifier ?? null,
          title: v?.title ?? null,
          description: v?.description ?? null,
          severity: v?.severity ?? null,
          score: v?.score ?? null,
        }))
      : [],
  };
}
