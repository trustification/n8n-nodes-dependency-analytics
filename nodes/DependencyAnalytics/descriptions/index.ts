import type { INodeProperties } from 'n8n-workflow';
import { commonProperties } from './common.properties';
import { sbomProperties } from './sbom.properties';
import { vulnerabilityProperties } from './vulnerability.properties';
import { advisoryProperties } from './advisory.properties';

export const properties: INodeProperties[] = [
	...commonProperties,
	...sbomProperties,
	...vulnerabilityProperties,
	...advisoryProperties,
];
