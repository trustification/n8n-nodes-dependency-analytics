import type { INodeProperties } from 'n8n-workflow';

export const advisoryProperties: INodeProperties[] = [
  {
    displayName: 'Selected Fields',
    name: 'advisorySelectedFields',
    type: 'multiOptions',
    default: [],
    description: "Fields to include when 'Selected Fields' output mode is selected",
    options: [
      { name: 'Average Score', value: 'average_score' },
      { name: 'Average Severity', value: 'average_severity' },
      { name: 'Document ID', value: 'document_id' },
      { name: 'Identifier', value: 'identifier' },
      { name: 'Ingested', value: 'ingested' },
      { name: 'Issuer', value: 'issuer' },
      { name: 'Issuer Name', value: 'issuer.name' },
      { name: 'Label File', value: 'labels.file' },
      { name: 'Label Importer', value: 'labels.importer' },
      { name: 'Label Source', value: 'labels.source' },
      { name: 'Label Type', value: 'labels.type' },
      { name: 'Labels (All)', value: 'labels' },
      { name: 'Modified', value: 'modified' },
      { name: 'Published', value: 'published' },
      { name: 'SHA-256', value: 'sha256' },
      { name: 'SHA-384', value: 'sha384' },
      { name: 'SHA-512', value: 'sha512' },
      { name: 'Size (Bytes)', value: 'size' },
      { name: 'Title', value: 'title' },
      { name: 'UUID', value: 'uuid' },
      { name: 'Vulnerabilities', value: 'vulnerabilities' },
      { name: 'Withdrawn', value: 'withdrawn' },
    ],
    displayOptions: {
      show: { operation: ['get', 'getMany'], resource: ['advisory'], outputMode: ['selected'] },
    },
  },

  {
    displayName: 'Selected Fields',
    name: 'advisorySelectedFields',
    type: 'multiOptions',
    default: [],
    description: "Advisory fields to include when 'Selected Fields' output mode is selected",
    options: [
      { name: 'CWEs', value: 'cwes' },
      { name: 'Description', value: 'description' },
      { name: 'Discovered', value: 'discovered' },
      { name: 'Document ID', value: 'document_id' },
      { name: 'Identifier', value: 'identifier' },
      { name: 'Issuer', value: 'issuer' },
      { name: 'Issuer Name', value: 'issuer.name' },
      { name: 'Labels', value: 'labels' },
      { name: 'Modified', value: 'modified' },
      { name: 'Normative', value: 'normative' },
      { name: 'Package', value: 'package' },
      { name: 'Published', value: 'published' },
      { name: 'Released', value: 'released' },
      { name: 'Reserved', value: 'reserved' },
      { name: 'Scores', value: 'scores' },
      { name: 'Size (Bytes)', value: 'size' },
      { name: 'Status', value: 'status' },
      { name: 'Title', value: 'title' },
      { name: 'UUID', value: 'uuid' },
      { name: 'Withdrawn', value: 'withdrawn' },
    ],
    displayOptions: {
      show: {
        resource: ['advisory'],
        operation: ['analyze'],
        inputType: ['purls', 'sbomSha'],
        outputMode: ['selected'],
      },
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
      {
        name: 'Analyze',
        value: 'analyze',
        action: 'Analyze advisories',
        description: 'Analyze advisories from purls or an SBOM',
      },
    ],
    default: 'getMany',
  },

  {
    displayName: 'Input Type',
    name: 'inputType',
    type: 'options',
    description: 'Analyze by providing PURLs directly or by referencing an SBOM via SHA',
    options: [
      { name: 'PURLs (Multiline)', value: 'purls' },
      { name: 'SBOM Lookup (SHA)', value: 'sbomSha' },
    ],
    default: 'purls',
    displayOptions: { show: { resource: ['advisory'], operation: ['analyze'] } },
  },
  {
    displayName: 'PURLs',
    name: 'purlsRaw',
    type: 'string',
    typeOptions: { rows: 6 },
    default: '',
    placeholder:
      'e.g. ["pkg:npm/lodash@4.17.21","pkg:maven/org.apache.commons/commons-text@1.10.0"]\n# or:\npkg:npm/lodash@4.17.21\npkg:maven/org.apache.commons/commons-text@1.10.0',
    description: 'Paste a JSON array of PURLs, or one PURL per line',
    displayOptions: {
      show: { resource: ['advisory'], operation: ['analyze'], inputType: ['purls'] },
    },
  },
  {
    displayName: 'SBOM SHA',
    name: 'sbomSha',
    type: 'string',
    default: '',
    placeholder: 'e.g. sha256:3a7bd3…, sha384:…, or sha512:…',
    description:
      'SHA checksum of the SBOM to analyze. Format: sha256:[64-hex] | sha384:[96-hex] | sha512:[128-hex].',
    displayOptions: {
      show: { resource: ['advisory'], operation: ['analyze'], inputType: ['sbomSha'] },
    },
  },

  {
    displayName: 'Sorting',
    name: 'sortingAdvisoryGetMany',
    type: 'fixedCollection',
    placeholder: 'Add sort rule',
    description: 'Add one or more sorting rules to order the advisories',
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
            description: 'Property to sort by',
            options: [
              { name: 'Published', value: 'published' },
              { name: 'Title', value: 'title' },
              { name: 'Size (Bytes)', value: 'size' },
            ],
            default: 'published',
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
  {
    displayName: 'Sorting',
    name: 'sortingAdvisoryAnalyze',
    type: 'fixedCollection',
    placeholder: 'Add sort rule',
    description:
      'Add one or more sorting rules to order advisories returned by Analyze (severity order: Critical > High > Medium > Low > None > Unknown)',
    typeOptions: { multipleValues: true },
    displayOptions: { show: { operation: ['analyze'], resource: ['advisory'] } },
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
              { name: 'Title', value: 'title' },
              { name: 'Average Score', value: 'scores_value_avg' },
              { name: 'Average Severity', value: 'scores_severity_avg' },
            ],
            default: 'published',
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
