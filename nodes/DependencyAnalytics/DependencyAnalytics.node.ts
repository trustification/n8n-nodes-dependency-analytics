import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	IExecuteFunctions,
	INodeExecutionData,
	IHttpRequestOptions,
} from 'n8n-workflow';

import { throwError } from './Utils';

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
		usableAsTool: true,
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
		requestDefaults: {
			// baseURL: 'https://server-tpa.apps.tpaqe-1.lab.eng.rdu2.redhat.com',
			baseURL: 'http://localhost:8080/api/v2/',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
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
				displayName: 'Resources',
				name: 'resources',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'SBOMs', value: 'sbom' },
					{ name: 'Vulnerabilities', value: 'vulnerability' },
					{ name: 'Advisories', value: 'advisory' },
					{ name: 'Analyze Vulnerability', value: 'analyze' },
				],
				default: 'vulnerability',
			},
			// List vs One
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'List', value: 'list' },
					{ name: 'One', value: 'one' },
				],

				default: 'list',
				displayOptions: {
					show: { resources: ['sbom', 'advisory', 'vulnerability'] },
				},
			},

			// ID shows only when "one"
			{
				displayName: 'SHA-256 ID',
				name: 'sha256Id',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resources: ['sbom', 'advisory', 'vulnerability'], mode: ['one'] },
				},
			},

			// Query params only when "list"
			{
				displayName: 'Query Params',
				name: 'query',
				type: 'collection',
				placeholder: 'Add param',
				default: {},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 50,
						description: 'Max number of results to return',
						typeOptions: {
							minValue: 1,
						},
					},
				],
				displayOptions: {
					show: { resources: ['sbom', 'advisory', 'vulnerability'], mode: ['list'] },
				},
			},
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{ name: 'PURLs (Multiline)', value: 'purls' },
					{ name: 'SBOM Lookup (SHA-256)', value: 'sbomSha256' },
				],
				default: 'purls',
				displayOptions: { show: { resources: ['analyze'] } },
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
				displayOptions: { show: { resources: ['analyze'], inputType: ['purls'] } },
			},
			{
				displayName: 'SBOM SHA-256',
				name: 'sbomSha256',
				type: 'string',
				default: '',
				placeholder: 'e.g., 3a7bd3e2360a3d...',
				description: 'The SHA-256 checksum of the SBOM file to analyze',
				displayOptions: {
					show: {
						resources: ['analyze'],
						inputType: ['sbomSha256'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resources', i) as string;
			const baseURLRaw = this.getNodeParameter('baseURL', i) as string;
			const base = baseURLRaw.replace(/\/+$/, '');

			// Pick credentials by auth method
			const authMethod = this.getNodeParameter('authMethod', i) as string;
			const credentialName =
				authMethod === 'authorizationCode'
					? 'trustifyAuthCodeOAuth2Api'
					: 'trustifyClientOAuth2Api';

			if (resource === 'analyze') {
				const inputType = this.getNodeParameter('inputType', i) as 'sbomSha256' | 'purls';

				if (inputType === 'purls') {
					const rawParam = this.getNodeParameter('purlsRaw', i) as unknown;
					let purls: string[] = [];

					if (Array.isArray(rawParam)) {
						// Expression returning an array
						purls = rawParam.flatMap((v) => (typeof v === 'string' ? v.trim() : []));
					} else if (typeof rawParam === 'string') {
						const trimmed = rawParam.trim();
						if (trimmed.startsWith('[')) {
							// JSON array pasted as text
							let parsed: unknown;
							try {
								parsed = JSON.parse(trimmed);
							} catch {
								throwError(
									this.getNode(),
									'Invalid JSON. Provide a JSON array of strings, e.g. ["pkg:...","pkg:..."].',
									i,
								);
							}
							if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
								throwError(this.getNode(), 'PURLs must be a JSON array of strings.', i);
							}
							purls = (parsed as string[]).map((s) => s.trim()).filter(Boolean);
						} else {
							// One-per-line text
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
						throwError(
							this.getNode(),
							'Provide PURLs as a JSON array, one-per-line string, or an array expression.',
							i,
						);
					}

					if (purls.length === 0) {
						throwError(this.getNode(), 'Provide at least one PURL.', i);
					}

					const uniquePurls = [...new Set(purls)];

					const postOpts: IHttpRequestOptions = {
						method: 'POST',
						url: `${base}/vulnerability/analyze`,
						body: { purls: uniquePurls },
						json: true,
					};

					let analysis: any;
					try {
						analysis = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialName,
							postOpts,
						);
					} catch (err) {
						if (this.continueOnFail()) {
							returnData.push({
								json: { error: err.message, request: { purls: uniquePurls } },
								pairedItem: { item: i },
							});
							continue;
						}
						throw err;
					}

					returnData.push({
						json: { request: analysis },
						pairedItem: { item: i },
					});

					continue;
				}

				if (inputType === 'sbomSha256') {
					const q = (this.getNodeParameter('sbomSha256', i) as string)?.trim();
					console.log('SBOM Q', q);

					if (!q) {
						throwError(this.getNode(), 'SBOM Query is required for Analyze (SBOM Lookup).', i);
					}

					// List SBOMs
					const listOpts: IHttpRequestOptions = {
						method: 'GET',
						url: `${base}/sbom/sha256:${q}`,
						qs: { query: q },
						returnFullResponse: false,
					};

					const listResp = await this.helpers.httpRequestWithAuthentication.call(
						this,
						credentialName,
						listOpts,
					);
					console.log('LIST RESP', listResp);

					const sbomId = listResp?.id;
					if (!sbomId) {
						throwError(this.getNode(), `No SBOM found for query "${q}".`, i);
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

					console.log('ADVISORIES', advisories);

					returnData.push({
						json: {
							sbomId,
							query: q,
							advisories,
						},
						pairedItem: { item: i },
					});
					continue;
				}
			}

			// Generic GET path (sbom / vulnerability / advisory; list/one)
			const fullBase = `${base}/${resource}`;
			let fullUrl = fullBase;
			const mode = this.getNodeParameter('mode', i) as string;

			if (mode === 'one') {
				const id = this.getNodeParameter('sha256Id', i) as string;
				if (!id) {
					throwError(this.getNode(), 'ID is required in "One" mode.', i);
				}
				fullUrl += `/sha:${encodeURIComponent(id)}`;
			}

			// Query parameters for list mode
			let qs: Record<string, any> = {};
			if (mode === 'list') {
				qs = (this.getNodeParameter('query', i) as any) ?? {};
			}

			const options: IHttpRequestOptions = {
				method: 'GET',
				url: fullUrl,
				qs,
				returnFullResponse: false,
			};

			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				credentialName,
				options,
			);

			returnData.push({
				json: response,
				pairedItem: { item: i },
			});
		}

		return [returnData];
	}
}
