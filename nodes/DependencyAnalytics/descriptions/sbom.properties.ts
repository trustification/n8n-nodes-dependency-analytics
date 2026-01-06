import type { INodeProperties } from 'n8n-workflow';

export const sbomProperties: INodeProperties[] = [
  {
    displayName: 'Selected Fields',
    name: 'sbomSelectedFields',
    type: 'multiOptions',
    default: [],
    options: [
      { name: 'Authors', value: 'authors' },
      { name: 'Data Licenses', value: 'data_licenses' },
      { name: 'Described By', value: 'described_by' },
      { name: 'Described By CPE (First)', value: 'described_by.0.cpe' },
      { name: 'Described By Group (First)', value: 'described_by.0.group' },
      { name: 'Described By ID (First)', value: 'described_by.0.id' },
      {
        name: 'Described By License Ref Mapping',
        value: 'described_by.0.licenses_ref_mapping',
      },
      { name: 'Described By Licenses', value: 'described_by.0.licenses' },
      { name: 'Described By Name', value: 'described_by.0.name' },
      { name: 'Described By PURL', value: 'described_by.0.purl' },
      { name: 'Described By Version', value: 'described_by.0.version' },
      { name: 'Document ID', value: 'document_id' },
      { name: 'Ingested', value: 'ingested' },
      { name: 'Label File', value: 'labels.file' },
      { name: 'Label Importer', value: 'labels.importer' },
      { name: 'Label Source', value: 'labels.source' },
      { name: 'Label Type', value: 'labels.type' },
      { name: 'Labels (All)', value: 'labels' },
      { name: 'Name', value: 'name' },
      { name: 'Packages (Count)', value: 'number_of_packages' },
      { name: 'Published', value: 'published' },
      { name: 'PURL', value: 'purl' },
      { name: 'SHA-256', value: 'sha256' },
      { name: 'SHA-384', value: 'sha384' },
      { name: 'SHA-512', value: 'sha512' },
      { name: 'Size (Bytes)', value: 'size' },
      { name: 'Suppliers', value: 'suppliers' },
      { name: 'Version', value: 'version' },
    ],
    description: "Fields to include when using 'Selected Fields'. 'ID' is always included.",
    displayOptions: {
      show: { operation: ['get', 'getMany'], resource: ['sbom'], outputMode: ['selected'] },
    },
  },

  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['sbom'] } },
    options: [
      { name: 'Get', value: 'get', action: 'Get sbom', description: 'Retrieve an sbom' },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many sboms',
        description: 'Retrieve a list of sboms',
      },
    ],
    default: 'getMany',
  },

  {
    displayName: 'Sorting',
    name: 'sortingSbom',
    type: 'fixedCollection',
    placeholder: 'Add sort rule',
    description: 'Add one or more sorting rules to order the SBOMs',
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
            description: 'Property to sort by',
            options: [
              { name: 'Published', value: 'published' },
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
            description: 'Sort order',
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
