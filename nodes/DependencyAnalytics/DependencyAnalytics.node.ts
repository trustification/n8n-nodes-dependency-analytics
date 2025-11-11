import {
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  IExecuteFunctions,
  INodeExecutionData,
  INodeCredentialDescription,
} from 'n8n-workflow';

import { properties } from './descriptions';
import { dispatch } from './actions';

const credentials: INodeCredentialDescription[] = [
  {
    name: 'trustifyClientCredsOAuth2Api',
    required: true,
    displayOptions: {
      show: {
        authMethod: ['trustifyClientCredentials'],
      },
    },
  },
  {
    name: 'trustifyAuthCodeOAuth2Api',
    required: true,
    displayOptions: {
      show: {
        authMethod: ['trustifyAuthorizationCode'],
      },
    },
  },
  {
    name: 'rhtpaClientCredsOAuth2Api',
    required: true,
    displayOptions: {
      show: {
        authMethod: ['rhtpaClientCredentials'],
      },
    },
  },
  {
    name: 'rhtpaAuthCodeOAuth2Api',
    required: true,
    displayOptions: {
      show: {
        authMethod: ['rhtpaAuthorizationCode'],
      },
    },
  },
];

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
    credentials: credentials,
    requestDefaults: {
      baseURL: 'https://rhtpa.stage.redhat.com/api/v2/',
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
