import type { INodeProperties } from 'n8n-workflow';

export const advisoryProperties: INodeProperties[] = [
	{
		displayName: 'Selected Fields',
		name: 'advisorySelectedFields',
		type: 'multiOptions',
		default: [],
		options: [
			{ name: 'Average Score', value: 'average_score' },
			{ name: 'Average Severity', value: 'average_severity' },
			{ name: 'Document ID', value: 'document_id' },
			{ name: 'Identifier', value: 'identifier' },
			{ name: 'Ingested', value: 'ingested' },
			{ name: 'Issuer Name', value: 'issuer.name' },
			{ name: 'Modified', value: 'modified' },
			{ name: 'Published', value: 'published' },
			{ name: 'Size (Bytes)', value: 'size' },
			{ name: 'Title', value: 'title' },
		],
		displayOptions: {
			show: { operation: ['get', 'getMany'], resource: ['advisory'], outputMode: ['selected'] },
		},
	},

	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['advisory'] } },
		options: [
			{ name: 'Get', value: 'get', action: 'Get advisory', description: 'Retrieve an advisory' },
			{ name: 'Get Many', value: 'getMany', action: 'Get many advisories', description: 'Retrieve a list of advisories' },
		],
		default: 'getMany',
	},
];
