import type { INodeProperties } from 'n8n-workflow';

export const commonProperties: INodeProperties[] = [
	{
		displayName: 'Authentication Method',
		name: 'authMethod',
		type: 'options',
		options: [
			{ name: 'Authorization Code', value: 'authorizationCode' },
			{ name: 'Client Credentials', value: 'clientCredentials' },
		],
		default: 'authorizationCode',
		description: 'Choose how to authenticate to Trustify API',
	},
	{
		displayName: 'Base URL',
		name: 'baseURL',
		type: 'string',
		default: 'http://localhost:8080/api/v2/',
		placeholder: 'e.g. https://your-trustify-instance.com/api/v2/',
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

	// common “get” param
	{
		displayName: 'Identifier',
		name: 'identifier',
		type: 'string',
		required: true,
		default: '',
		description: 'The SHA-256 ID or normalized identifier',
		placeholder: 'e.g. 3a7bd3e2360a3d...',
		displayOptions: {
			show: { operation: ['get'], resource: ['sbom', 'vulnerability', 'advisory'] },
		},
	},

	// common “getMany” params
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
		displayName: 'Output',
		name: 'outputMode',
		type: 'options',
		default: 'simplified',
		description:
			'How to shape the response. In AI tool mode, keep it small to avoid context issues.',
		options: [
			{ name: 'Simplified', value: 'simplified' },
			{ name: 'Raw', value: 'raw' },
			{ name: 'Selected Fields', value: 'selected' },
		],
		displayOptions: {
			show: {
				operation: ['get', 'getMany'],
				resource: ['sbom', 'vulnerability', 'advisory'],
			},
		},
	},
];
