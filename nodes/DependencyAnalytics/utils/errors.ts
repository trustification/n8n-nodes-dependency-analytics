import { INode, NodeOperationError } from 'n8n-workflow';

export const throwError = (node: INode, message: string, index: number) => {
	throw new NodeOperationError(node, message, {
		itemIndex: index,
	});
};
