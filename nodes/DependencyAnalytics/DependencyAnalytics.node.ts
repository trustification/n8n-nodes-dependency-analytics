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

			// --- Operation (SBOM) ---
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

			// --- Operation (Vulnerability) ---
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

			// --- Operation (Advisory) ---
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

				returnData.push({ json: response, pairedItem: { item: i } });
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

				returnData.push({ json: response, pairedItem: { item: i } });
				continue;
			}

			// If we reached here, the operation/resource combo isn't supported.
			throw new NodeOperationError(
				this.getNode(),
				`Unsupported operation "${operation}" for resource "${resource}".`,
				{ itemIndex: i },
			);
		}

		return [returnData];
	}
}
