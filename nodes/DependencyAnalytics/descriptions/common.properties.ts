import type { INodeProperties } from 'n8n-workflow';

export const commonProperties: INodeProperties[] = [
  {
    displayName: 'Authentication Method',
    name: 'authMethod',
    type: 'options',
    options: [
      { name: 'Trustify Client Credentials', value: 'trustifyClientCredentials' },
      { name: 'RHTPA Client Credentials', value: 'rhtpaClientCredentials' },
    ],
    default: 'rhtpaClientCredentials',
    description: 'Choose how to authenticate to the API',
    required: true,
  },
  {
    displayName: 'Base URL',
    name: 'baseURL',
    type: 'string',
    default: 'http://localhost:8080/api/v2/',
    placeholder: 'e.g. http://localhost:8080/api/v2/',
    description: 'The base URL for your Trustify API instance',
    required: true,
    displayOptions: {
      show: {
        authMethod: ['trustifyClientCredentials'],
      },
    },
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
    description:
      'Choose which Trustify resource to work with. This affects available operations and fields.',
  },

  // common “get” param
  {
    displayName: 'Identifier',
    name: 'identifierCve',
    type: 'string',
    required: true,
    default: '',
    description: 'Vulnerability identifier (CVE)',
    placeholder: 'e.g. CVE-2024-1234',
    displayOptions: {
      show: { operation: ['get'], resource: ['vulnerability'] },
    },
  },
  {
    displayName: 'Identifier',
    name: 'identifierSha',
    type: 'string',
    required: true,
    default: '',
    description: 'SHA ID (sha256|sha384|sha512) or a normalized identifier',
    placeholder: 'e.g. sha256:3a7bd3…, sha384:…, or sha512:…',
    displayOptions: {
      show: { operation: ['get'], resource: ['sbom', 'advisory'] },
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
      show: { operation: ['getMany', 'analyze'], resource: ['sbom', 'vulnerability', 'advisory'] },
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
        operation: ['get', 'getMany', 'analyze'],
        resource: ['sbom', 'vulnerability', 'advisory'],
      },
    },
  },
];
