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
  const simplifyDescribedBy = (array: any) =>
    Array.isArray(array)
      ? array.map((p: any) => ({
          id: p?.id ?? null,
          name: p?.name ?? null,
          version: p?.version ?? null,
          purl: Array.isArray(p?.purl)
            ? p.purl.map((pu: any) => ({ uuid: pu?.uuid ?? null, purl: pu?.purl ?? null }))
            : null,
        }))
      : null;
  return {
    id: item.id,
    name: item.name ?? d.name ?? null,
    version: d.version ?? null,
    packages: item.number_of_packages ?? null,
    size: item.size ?? null,
    sha256: item.sha256 ?? null,
    described_by: simplifyDescribedBy(item?.described_by) ?? null,
    document_id: item.document_id ?? null,
  };
}

export function simplifyVuln(item: Vuln) {
  const simplifyAdvisories = (array: any) =>
    Array.isArray(array)
      ? array.map((a: any) => ({
          uuid: a?.uuid ?? null,
          identifier: a?.identifier ?? null,
          title: a?.title ?? null,
          severity: a?.severity ?? null,
          score: a?.score ?? null,
          sboms: Array.isArray(a?.sboms)
            ? a.sboms.map((sb: any) => ({
                id: sb?.id ?? null,
                labels: sb?.labels ?? null,
                data_licenses: sb?.data_licenses ?? null,
              }))
            : null,
          purls: {
            fixed: Array.isArray(a?.purls?.fixed)
              ? a.purls.fixed.map((ps: any) => ({
                  base_purl: ps?.base_purl ?? null,
                }))
              : null,
            affected: Array.isArray(a?.purl_status?.affected)
              ? a.purl_status.affected.map((ps: any) => ({
                  base_purl: ps?.base_purl ?? null,
                }))
              : null,
          },
        }))
      : null;
  return {
    identifier: item.identifier ?? null,
    title: item.title ?? null,
    severity: item.average_severity ?? null,
    score: item.average_score ?? null,
    cwe: first(item.cwes) ?? null,
    advisories: simplifyAdvisories(item.advisories) ?? null,
    reserved: item.reserved ?? null,
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
          severity: v?.severity ?? null,
          score: v?.score ?? null,
        }))
      : [],
  };
}
