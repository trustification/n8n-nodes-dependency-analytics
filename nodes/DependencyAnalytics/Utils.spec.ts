import { throwError } from './utils/errors';
import { INode, INodeParameters, INodeCredentials, NodeOperationError } from 'n8n-workflow';

test('It should throw error with specified INode, message and index', () => {
	const fakeNode: INode = {
		id: 'node-12345',
		name: 'Fake Data Node',
		typeVersion: 1,
		type: 'mockType',
		position: [100, 200],
		disabled: false,
		notes: 'This is a fake node used for testing purposes.',
		notesInFlow: true,
		retryOnFail: true,
		maxTries: 3,
		waitBetweenTries: 5000,
		alwaysOutputData: true,
		executeOnce: false,
		onError: 'stopWorkflow',
		continueOnFail: false,
		parameters: {
			sampleParam1: 'testValue',
			sampleParam2: 42,
			nestedParam: {
				subKey: 'example',
			},
		} as INodeParameters,
		credentials: {
			apiKey: {
				id: 'cred-123',
				name: 'Mock API Key',
			},
		} as INodeCredentials,
		webhookId: 'webhook-xyz',
		extendsCredential: 'base-credential-001',
	};

	expect(() => throwError(fakeNode, 'aaa', 1)).toThrow(NodeOperationError);
	expect(() => throwError(fakeNode, 'aaa', 1)).toThrow('aaa');
});
