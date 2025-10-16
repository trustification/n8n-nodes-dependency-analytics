import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

import { properties } from './descriptions';
import { dispatch } from './actions';

export class DependencyAnalytics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dependency Analytics',
		name: 'dependencyAnalytics',
		icon: 'file:DependencyAnalytics.svg',
		group: ['transform'],
		version: 2,
		subtitle: '={{ $display("operation") + " · " + $display("resource") }}',
		description: 'Get data from Dependency Analytics API',
		defaults: {
			name: 'Dependency Analytics',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'trustifyClientOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authMethod: ['clientCredentials'],
					},
				},
			},
			{
				name: 'trustifyAuthCodeOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authMethod: ['authorizationCode'],
					},
				},
			},
		],
		requestDefaults: {
			// baseURL: 'https://server-tpa.apps.tpaqe-1.lab.eng.rdu2.redhat.com',
			baseURL: 'http://localhost:8080/api/v2/',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},

		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as
				| 'sbom'
				| 'vulnerability'
				| 'advisory';
			const operation = this.getNodeParameter('operation', i) as 'get' | 'getMany' | 'analyze';

			const result = await dispatch[this.getNode().typeVersion][resource][operation]({
				ctx: this,
				itemIndex: i,
			});

			const push = Array.isArray(result) ? result : [{ json: result }];
			for (const r of push) returnData.push({ ...r, pairedItem: { item: i } });
		}

		return [returnData];
	}
}
