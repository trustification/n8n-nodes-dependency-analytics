import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	IExecuteFunctions,
	INodeExecutionData,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';

export class DependencyAnalytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dependency Analytics',
		name: 'dependencyAnalytics',
		icon: 'file:DependencyAnalytics.svg',
		group: ['transform'],
		version: 2,
		subtitle: '={{ $display("operation") + " · " + $display("resource") }}',
		description: 'Get data from Dependency Analytics API',
		defaults: {
			name: 'Dependency Analytics',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'trustifyClientOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authMethod: ['clientCredentials'],
					},
				},
			},
			{
				name: 'trustifyAuthCodeOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authMethod: ['authorizationCode'],
					},
				},
			},
		],

		properties: [
			{
				displayName: 'Authentication Method',
				name: 'authMethod',
				type: 'options',
				options: [
					{
						name: 'Authorization Code',
						value: 'authorizationCode',
					},
					{
						name: 'Client Credentials',
						value: 'clientCredentials',
					},
				],
				default: 'authorizationCode',
				description: 'Choose how to authenticate to Trustify API',
			},
			{
				displayName: 'Base URL',
				name: 'baseURL',
				type: 'string',
				// default: 'https://server-tpa.apps.tpaqe-1.lab.eng.rdu2.redhat.com/api/v2/',
				default: 'http://localhost:8080/api/v2/',
				placeholder: 'https://your-trustify-instance.com/api/v2/',
				description: 'The base URL for your Trustify API instance',
				required: true,
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'SBOM', value: 'sbom' },
					{ name: 'Vulnerability', value: 'vulnerability' },
					{ name: 'Advisory', value: 'advisory' },
				],
				default: 'vulnerability',
			},

			// Operation (SBOM)
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['sbom'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get an SBOM' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many SBOMS' },
				],
				default: 'getMany',
			},

			// Operation (Vulnerability)
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['vulnerability'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get a vulnerability' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many vulnerabilities' },
					{
						name: 'Analyze',
						value: 'analyze',
						action: 'Analyze vulnerabilities from PURLS or SBOM',
					},
				],
				default: 'getMany',
			},

			// Operation (Advisory)
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['advisory'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get an advisory' },
					{ name: 'Get Many', value: 'getMany', action: 'Get many advisories' },
				],
				default: 'getMany',
			},

			// Get (single)
			{
				displayName: 'Identifier',
				name: 'identifier',
				type: 'string',
				required: true,
				default: '',
				description: 'The SHA-256 ID',
				placeholder: 'e.g., 3a7bd3e2360a3d...',
				displayOptions: {
					show: { operation: ['get'], resource: ['sbom', 'vulnerability', 'advisory'] },
				},
			},

			// Get Many
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				displayOptions: {
					show: { operation: ['getMany'], resource: ['sbom', 'vulnerability', 'advisory'] },
				},
				description: 'Max number of results to return',
			},

			{
				displayName: 'Simplify',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description:
					'Whether to return a simplified version of the response instead of the raw data',
				displayOptions: {
					show: {
						resource: ['sbom', 'vulnerability', 'advisory'],
						operation: ['get', 'getMany'],
					},
				},
			},

			// SBOM: Sorting
			{
				displayName: 'Sorting',
				name: 'sortingSbom',
				type: 'fixedCollection',
				placeholder: 'Add sort rule',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { operation: ['getMany'], resource: ['sbom'] } },
				default: {},
				options: [
					{
						displayName: 'Sort',
						name: 'sort',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								options: [
									{ name: 'Name', value: 'name' },
									{ name: 'Packages (Count)', value: 'number_of_packages' },
									{ name: 'Size (Bytes)', value: 'size' },
								],
								default: 'name',
							},
							{
								displayName: 'Direction',
								name: 'direction',
								type: 'options',
								options: [
									{ name: 'Ascending', value: 'asc' },
									{ name: 'Descending', value: 'desc' },
								],
								default: 'desc',
							},
						],
					},
				],
			},

			// Vulnerability: Sorting
			{
				displayName: 'Sorting',
				name: 'sortingVuln',
				type: 'fixedCollection',
				placeholder: 'Add sort rule',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { operation: ['getMany'], resource: ['vulnerability'] } },
				default: {},
				options: [
					{
						displayName: 'Sort',
						name: 'sort',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								options: [
									{ name: 'Identifier (e.g., CVE)', value: 'identifier' },
									{ name: 'Average Severity', value: 'average_severity' },
									{ name: 'Average Score', value: 'average_score' },
								],
								default: 'identifier',
							},
							{
								displayName: 'Direction',
								name: 'direction',
								type: 'options',
								options: [
									{ name: 'Ascending', value: 'asc' },
									{ name: 'Descending', value: 'desc' },
								],
								default: 'desc',
							},
						],
					},
				],
			},

			// Advisory: Sorting
			{
				displayName: 'Sorting',
				name: 'sortingAdvisory',
				type: 'fixedCollection',
				placeholder: 'Add sort rule',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { operation: ['getMany'], resource: ['advisory'] } },
				default: {},
				options: [
					{
						displayName: 'Sort',
						name: 'sort',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								options: [
									{ name: 'Average Score', value: 'average_score' },
									{ name: 'Average Severity', value: 'average_severity' },
									{ name: 'Identifier', value: 'identifier' },
									{ name: 'Size (Bytes)', value: 'size' },
									{ name: 'Title', value: 'title' },
								],
								default: 'title',
							},
							{
								displayName: 'Direction',
								name: 'direction',
								type: 'options',
								options: [
									{ name: 'Ascending', value: 'asc' },
									{ name: 'Descending', value: 'desc' },
								],
								default: 'desc',
							},
						],
					},
				],
			},

			// Analyze (scoped)
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{ name: 'PURLs (Multiline)', value: 'purls' },
					{ name: 'SBOM Lookup (SHA-256)', value: 'sbomSha256' },
				],
				default: 'purls',
				displayOptions: { show: { resource: ['vulnerability'], operation: ['analyze'] } },
			},
			{
				displayName: 'PURLs',
				name: 'purlsRaw',
				type: 'string',
				typeOptions: { rows: 6 },
				default: '',
				placeholder:
					'["pkg:npm/lodash@4.17.21","pkg:maven/org.apache.commons/commons-text@1.10.0"]\n# or:\npkg:npm/lodash@4.17.21\npkg:maven/org.apache.commons/commons-text@1.10.0',
				description: 'Paste a JSON array of PURLs, or one PURL per line',
				displayOptions: {
					show: { resource: ['vulnerability'], operation: ['analyze'], inputType: ['purls'] },
				},
			},
			{
				displayName: 'SBOM SHA-256',
				name: 'sbomSha256',
				type: 'string',
				default: '',
				placeholder: 'e.g., 3a7bd3e2360a3d…',
				description: 'The SHA-256 checksum of the SBOM file to analyze',
				displayOptions: {
					show: { resource: ['vulnerability'], operation: ['analyze'], inputType: ['sbomSha256'] },
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const defaultHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as
				| 'sbom'
				| 'vulnerability'
				| 'advisory';
			const operation = this.getNodeParameter('operation', i) as 'get' | 'getMany' | 'analyze';
			const baseURLRaw = this.getNodeParameter('baseURL', i) as string;
			const base = baseURLRaw.replace(/\/+$/, '');

			// Pick credentials by auth method
			const authMethod = this.getNodeParameter('authMethod', i) as string;
			const credentialName =
				authMethod === 'authorizationCode'
					? 'trustifyAuthCodeOAuth2Api'
					: 'trustifyClientOAuth2Api';

			// Analyze (only for vulnerability)
			if (resource === 'vulnerability' && operation === 'analyze') {
				const inputType = this.getNodeParameter('inputType', i) as 'sbomSha256' | 'purls';

				if (inputType === 'purls') {
					const rawParam = this.getNodeParameter('purlsRaw', i) as unknown;
					let purls: string[] = [];

					if (Array.isArray(rawParam)) {
						purls = rawParam.flatMap((v) => (typeof v === 'string' ? v.trim() : []));
					} else if (typeof rawParam === 'string') {
						const trimmed = rawParam.trim();
						if (trimmed.startsWith('[')) {
							let parsed: unknown;
							try {
								parsed = JSON.parse(trimmed);
							} catch {
								throw new NodeOperationError(
									this.getNode(),
									'Invalid JSON. Provide a JSON array of strings, e.g. ["pkg:...","pkg:..."].',
									{ itemIndex: i },
								);
							}
							if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
								throw new NodeOperationError(
									this.getNode(),
									'PURLs must be a JSON array of strings.',
									{
										itemIndex: i,
									},
								);
							}
							purls = (parsed as string[]).map((s) => s.trim()).filter(Boolean);
						} else {
							purls = trimmed
								.split(/\r?\n/)
								.map((s) => s.trim())
								.filter((s) => s && !s.startsWith('#'));
						}
					} else if (
						rawParam &&
						typeof rawParam === 'object' &&
						Array.isArray((rawParam as any).purls)
					) {
						purls = (rawParam as any).purls.flatMap((v: unknown) =>
							typeof v === 'string' ? v.trim() : [],
						);
					} else {
						throw new NodeOperationError(
							this.getNode(),
							'Provide PURLs as a JSON array, one-per-line string, or an array expression.',
							{ itemIndex: i },
						);
					}

					if (purls.length === 0) {
						throw new NodeOperationError(this.getNode(), 'Provide at least one PURL.', {
							itemIndex: i,
						});
					}

					const uniquePurls = [...new Set(purls)];

					const postOpts: IHttpRequestOptions = {
						method: 'POST',
						url: `${base}/vulnerability/analyze`,
						body: { purls: uniquePurls },
						json: true,
					};

					try {
						const analysis = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialName,
							postOpts,
						);

						returnData.push({ json: analysis, pairedItem: { item: i } });
					} catch (err: any) {
						if (this.continueOnFail()) {
							returnData.push({
								json: { error: err.message, request: { purls: uniquePurls } },
								pairedItem: { item: i },
							});
							continue;
						}
						throw err;
					}

					continue;
				}

				// inputType === 'sbomSha256'
				const q = (this.getNodeParameter('sbomSha256', i) as string)?.trim();
				if (!q) {
					throw new NodeOperationError(
						this.getNode(),
						'SBOM SHA-256 is required for Analyze (SBOM Lookup).',
						{ itemIndex: i },
					);
				}

				// Fetch the SBOM by sha256
				const listOpts: IHttpRequestOptions = {
					method: 'GET',
					url: `${base}/sbom/sha256:${q}`,
					returnFullResponse: false,
				};

				const listResp = await this.helpers.httpRequestWithAuthentication.call(
					this,
					credentialName,
					listOpts,
				);
				const sbomId = listResp?.id;
				if (!sbomId) {
					throw new NodeOperationError(this.getNode(), `No SBOM found for SHA-256 "${q}".`, {
						itemIndex: i,
					});
				}

				// Advisories for that SBOM
				const advOpts: IHttpRequestOptions = {
					method: 'GET',
					url: `${base}/sbom/${encodeURIComponent(sbomId)}/advisory`,
					returnFullResponse: false,
				};
				const advisories = await this.helpers.httpRequestWithAuthentication.call(
					this,
					credentialName,
					advOpts,
				);

				returnData.push({ json: { sbomId, advisories }, pairedItem: { item: i } });
				continue;
			}

			// Standard GET / GET MANY for sbom | vulnerability | advisory
			const fullBase = `${base}/${resource}`;

			if (operation === 'get') {
				// Try to read generic "identifier" first; fallback to your old "sha256Id" if present
				const rawId =
					(this.getNodeParameter('identifier', i, '') as string) ||
					(this.getNodeParameter('sha256Id', i, '') as string);

				const id = (rawId || '').trim();
				if (!id) {
					throw new NodeOperationError(this.getNode(), 'Identifier is required for Get.', {
						itemIndex: i,
					});
				}

				// If the user provided a bare SHA-256, prefix with sha256:
				const normalizedId = /^sha256:/i.test(id)
					? id
					: /^[a-f0-9]{64}$/i.test(id)
						? `sha256:${id}`
						: id;

				const options: IHttpRequestOptions = {
					method: 'GET',
					url: `${fullBase}/${encodeURIComponent(normalizedId)}`,
					returnFullResponse: false,
					headers: defaultHeaders,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					credentialName,
					options,
				);

				const simplify = this.getNodeParameter('simplify', i, true) as boolean;
				const payload = simplify ? simplifyOne(resource, response) : response;

				returnData.push({ json: payload, pairedItem: { item: i } });
				continue;
			}

			if (operation === 'getMany') {
				const limit = (this.getNodeParameter('limit', i, 50) as number) || 50;
				const qs: Record<string, any> = { limit };

				const options: IHttpRequestOptions = {
					method: 'GET',
					url: fullBase,
					qs,
					returnFullResponse: false,
					headers: defaultHeaders,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					credentialName,
					options,
				);

				// Build rules from the resource-specific collection
				let rules: SortRule[] = [];
				if (resource === 'sbom') {
					rules = this.getNodeParameter('sortingSbom.sort', i, []) as SortRule[];
				} else if (resource === 'vulnerability') {
					rules = this.getNodeParameter('sortingVuln.sort', i, []) as SortRule[];
				} else if (resource === 'advisory') {
					rules = this.getNodeParameter('sortingAdvisory.sort', i, []) as SortRule[];
				}

				const items: any[] = Array.isArray(response?.items) ? response.items : [];
				const simplify = this.getNodeParameter('simplify', i, true) as boolean;

				let out = items;
				if (rules.length) {
					out = [...items].sort((a, b) => multiCmp(a, b, rules, resource));
				}

				out = out.slice(0, limit);

				// Re-wrap with original metadata
				let finalPayload = { ...response, items: out };

				if (simplify) {
					if (Array.isArray(finalPayload?.items)) {
						finalPayload = {
							...finalPayload,
							items: finalPayload.items.map((it: any) => simplifyOne(resource, it)),
						};
					}
				}

				returnData.push({ json: finalPayload, pairedItem: { item: i } });
				continue;
			}

			// The operation/resource combo isn't supported.
			throw new NodeOperationError(
				this.getNode(),
				`Unsupported operation "${operation}" for resource "${resource}".`,
				{ itemIndex: i },
			);
		}

		return [returnData];
	}
}
type SortRule = { field: string; direction: 'asc' | 'desc' };

const sevRank: Record<string, number> = {
	critical: 4,
	high: 3,
	medium: 2,
	low: 1,
	none: 0,
};

function num(v: any): number | null {
	if (v === null || v === undefined) return null;
	return typeof v === 'number' ? v : (Number(v) ?? null);
}

function cmpField(
	a: any,
	b: any,
	field: string,
	resource: 'sbom' | 'vulnerability' | 'advisory',
): number {
	// Numbers
	if (['number_of_packages', 'size', 'average_score'].includes(field)) {
		return (num(a?.[field]) ?? -Infinity) - (num(b?.[field]) ?? -Infinity);
	}
	// Vulnerability.severity rank
	if (resource === 'vulnerability' && field === 'average_severity') {
		const av = (a?.average_severity ?? '').toString().toLowerCase();
		const bv = (b?.average_severity ?? '').toString().toLowerCase();
		return (sevRank[av] ?? -1) - (sevRank[bv] ?? -1);
	}
	// Generic string-ish
	const av = (a?.[field] ?? '').toString().toLowerCase();
	const bv = (b?.[field] ?? '').toString().toLowerCase();
	return av < bv ? -1 : av > bv ? 1 : 0;
}

function multiCmp(
	a: any,
	b: any,
	rules: SortRule[],
	resource: 'sbom' | 'vulnerability' | 'advisory',
): number {
	for (const r of rules) {
		const base = cmpField(a, b, r.field, resource);
		if (base !== 0) return r.direction === 'desc' ? -base : base;
	}
	return 0;
}

type SBOM = Record<string, any>;
type Vuln = Record<string, any>;
type Advisory = Record<string, any>;

function first<T = any>(v: any): T | undefined {
	return Array.isArray(v) ? v[0] : undefined;
}

function simplifySbom(item: SBOM) {
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

function simplifyVuln(item: Vuln) {
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

function simplifyAdvisory(item: Advisory) {
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

function simplifyOne(resource: 'sbom' | 'vulnerability' | 'advisory', obj: any) {
	switch (resource) {
		case 'sbom':
			return simplifySbom(obj);
		case 'vulnerability':
			return simplifyVuln(obj);
		case 'advisory':
			return simplifyAdvisory(obj);
	}
}
