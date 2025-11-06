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
      { name: 'UUID', value: 'uuid' },
      { name: 'Vulnerabilities', value: 'vulnerabilities' },
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
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many advisories',
        description: 'Retrieve a list of advisories',
      },
    ],
    default: 'getMany',
  },

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
];
