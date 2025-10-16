import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import * as sbom from './sbom';
import * as vulnerability from './vulnerability';
import * as advisory from './advisory';
import { throwError } from '../utils/errors';

type Ctx = { ctx: IExecuteFunctions; itemIndex: number };
type Handler = (args: Ctx) => Promise<INodeExecutionData[] | any>;

export const dispatch: Record<
	number,
	Record<'sbom' | 'vulnerability' | 'advisory', Record<'get' | 'getMany' | 'analyze', Handler>>
> = {
	2: {
		sbom: {
			get: sbom.get,
			getMany: sbom.getMany,
			analyze: async ({ ctx, itemIndex }) => {
				throwError(
					ctx.getNode(),
					'Unsupported operation "analyze" for resource "sbom".',
					itemIndex,
				);
			},
		},
		vulnerability: {
			get: vulnerability.get,
			getMany: vulnerability.getMany,
			analyze: vulnerability.analyze,
		},
		advisory: {
			get: advisory.get,
			getMany: advisory.getMany,
			analyze: async ({ ctx, itemIndex }) => {
				throwError(
					ctx.getNode(),
					'Unsupported operation "analyze" for resource "sbom".',
					itemIndex,
				);
			},
		},
	},
};
