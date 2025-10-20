import type { INodeProperties } from 'n8n-workflow';

export const sbomProperties: INodeProperties[] = [
	{
		displayName: 'Selected Fields',
		name: 'sbomSelectedFields',
		type: 'multiOptions',
		default: [],
		options: [
			{ name: 'Document ID', value: 'document_id' },
			{ name: 'ID', value: 'id' },
			{ name: 'Ingested', value: 'ingested' },
			{ name: 'Name', value: 'name' },
			{ name: 'Packages (Count)', value: 'number_of_packages' },
			{ name: 'Published', value: 'published' },
			{ name: 'PURL', value: 'purl' },
			{ name: 'SHA-256', value: 'sha256' },
			{ name: 'Size (Bytes)', value: 'size' },
			{ name: 'Version', value: 'version' },
		],
		description: 'Fields to include when using “Selected fields”. ID is always included.',
		displayOptions: { show: { operation: ['get', 'getMany'], resource: ['sbom'], outputMode: ['selected'] } },
	},

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


];
