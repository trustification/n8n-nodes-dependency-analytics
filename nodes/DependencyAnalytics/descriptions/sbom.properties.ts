import type { INodeProperties } from 'n8n-workflow';

export const sbomProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['sbom'] } },
		options: [
			{ name: 'Get', value: 'get', action: 'Get an SBOM' },
			{ name: 'Get Many', value: 'getMany', action: 'Get many sboms' },
		],
		default: 'getMany',
	},
];
