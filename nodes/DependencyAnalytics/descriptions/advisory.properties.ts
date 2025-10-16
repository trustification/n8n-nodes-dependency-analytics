import type { INodeProperties } from 'n8n-workflow';

export const advisoryProperties: INodeProperties[] = [
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
];
