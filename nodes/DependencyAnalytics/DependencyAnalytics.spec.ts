import { DependencyAnalytics } from './DependencyAnalytics.node';
import { dispatch } from './actions';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

jest.mock('./actions');

test('It instantiates and contains the correct name', () => {
  const node = new DependencyAnalytics();
  expect(node.description.displayName).toEqual('Dependency Analytics');
});

test('It contains the icon', () => {
  const node = new DependencyAnalytics();
  expect(node.description.icon).toEqual('file:DependencyAnalytics.svg');
});

test('It contains all expected displayNames in properties', () => {
  const node = new DependencyAnalytics();
  const displayNames = node.description.properties.map((prop: any) => prop.displayName);
  const expectedDisplayNames = [
    'Authentication Method',
    'Base URL',
    'Resource',
    'Identifier',
    'Identifier',
    'Limit',
    'Output',
    'Selected Fields',
    'Operation',
    'Sorting',
    'Selected Fields',
    'Selected Fields (Advisory)',
    'Operation',
    'Input Type',
    'PURLs',
    'SBOM SHA',
    'Sorting',
    'Selected Fields',
    'Operation',
    'Sorting',
  ];
  expect(displayNames).toEqual(expectedDisplayNames);
});

describe('execute function', () => {
  let node: DependencyAnalytics;
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

  beforeEach(() => {
    node = new DependencyAnalytics();
    mockExecuteFunctions = {
      getInputData: jest.fn(),
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ typeVersion: 2 }),
    } as any;

    jest.clearAllMocks();
  });

  it('should execute with single item for SBOM get operation', async () => {
    const inputData: INodeExecutionData[] = [{ json: { id: 1 } }];
    const mockResult = { id: 'sbom-123', name: 'test-sbom' };

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('sbom').mockReturnValueOnce('get');

    const mockHandler = jest.fn().mockResolvedValue(mockResult);
    (dispatch as any)[2] = {
      sbom: {
        get: mockHandler,
      },
    };

    const result = await node.execute.call(mockExecuteFunctions);

    expect(mockExecuteFunctions.getInputData).toHaveBeenCalled();
    expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('resource', 0);
    expect(mockExecuteFunctions.getNodeParameter).toHaveBeenCalledWith('operation', 0);
    expect(mockHandler).toHaveBeenCalledWith({
      ctx: mockExecuteFunctions,
      itemIndex: 0,
    });
    expect(result).toEqual([[{ json: mockResult, pairedItem: { item: 0 } }]]);
  });

  it('should execute with single item for vulnerability getMany operation', async () => {
    const inputData: INodeExecutionData[] = [{ json: { id: 1 } }];
    const mockResult = [{ json: { items: [{ id: 'CVE-1' }, { id: 'CVE-2' }] } }];

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('vulnerability')
      .mockReturnValueOnce('getMany');

    const mockHandler = jest.fn().mockResolvedValue(mockResult);
    (dispatch as any)[2] = {
      vulnerability: {
        getMany: mockHandler,
      },
    };

    const result = await node.execute.call(mockExecuteFunctions);

    expect(mockHandler).toHaveBeenCalledWith({
      ctx: mockExecuteFunctions,
      itemIndex: 0,
    });
    expect(result).toEqual([
      [{ json: { items: [{ id: 'CVE-1' }, { id: 'CVE-2' }] }, pairedItem: { item: 0 } }],
    ]);
  });

  it('should execute with single item for advisory get operation', async () => {
    const inputData: INodeExecutionData[] = [{ json: { id: 1 } }];
    const mockResult = { id: 'RHSA-2024-1234', title: 'Security Advisory' };

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('advisory')
      .mockReturnValueOnce('get');

    const mockHandler = jest.fn().mockResolvedValue(mockResult);
    (dispatch as any)[2] = {
      advisory: {
        get: mockHandler,
      },
    };

    const result = await node.execute.call(mockExecuteFunctions);

    expect(mockHandler).toHaveBeenCalledWith({
      ctx: mockExecuteFunctions,
      itemIndex: 0,
    });
    expect(result).toEqual([[{ json: mockResult, pairedItem: { item: 0 } }]]);
  });

  it('should execute with multiple items', async () => {
    const inputData: INodeExecutionData[] = [
      { json: { id: 1 } },
      { json: { id: 2 } },
      { json: { id: 3 } },
    ];
    const mockResults = [
      { id: 'sbom-1', name: 'test-1' },
      { id: 'sbom-2', name: 'test-2' },
      { id: 'sbom-3', name: 'test-3' },
    ];

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('sbom')
      .mockReturnValueOnce('get')
      .mockReturnValueOnce('sbom')
      .mockReturnValueOnce('get')
      .mockReturnValueOnce('sbom')
      .mockReturnValueOnce('get');

    const mockHandler = jest
      .fn()
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2]);

    (dispatch as any)[2] = {
      sbom: {
        get: mockHandler,
      },
    };

    const result = await node.execute.call(mockExecuteFunctions);

    expect(mockHandler).toHaveBeenCalledTimes(3);
    expect(mockHandler).toHaveBeenNthCalledWith(1, { ctx: mockExecuteFunctions, itemIndex: 0 });
    expect(mockHandler).toHaveBeenNthCalledWith(2, { ctx: mockExecuteFunctions, itemIndex: 1 });
    expect(mockHandler).toHaveBeenNthCalledWith(3, { ctx: mockExecuteFunctions, itemIndex: 2 });

    expect(result).toEqual([
      [
        { json: mockResults[0], pairedItem: { item: 0 } },
        { json: mockResults[1], pairedItem: { item: 1 } },
        { json: mockResults[2], pairedItem: { item: 2 } },
      ],
    ]);
  });

  it('should handle array results from dispatch', async () => {
    const inputData: INodeExecutionData[] = [{ json: { id: 1 } }];
    const mockArrayResult = [{ json: { id: 'result-1' } }, { json: { id: 'result-2' } }];

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('vulnerability')
      .mockReturnValueOnce('analyze');

    const mockHandler = jest.fn().mockResolvedValue(mockArrayResult);
    (dispatch as any)[2] = {
      vulnerability: {
        analyze: mockHandler,
      },
    };

    const result = await node.execute.call(mockExecuteFunctions);

    expect(mockHandler).toHaveBeenCalledWith({
      ctx: mockExecuteFunctions,
      itemIndex: 0,
    });
    expect(result).toEqual([
      [
        { json: { id: 'result-1' }, pairedItem: { item: 0 } },
        { json: { id: 'result-2' }, pairedItem: { item: 0 } },
      ],
    ]);
  });

  it('should handle mixed resources and operations across multiple items', async () => {
    const inputData: INodeExecutionData[] = [{ json: { id: 1 } }, { json: { id: 2 } }];

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('sbom')
      .mockReturnValueOnce('get')
      .mockReturnValueOnce('advisory')
      .mockReturnValueOnce('getMany');

    const sbomHandler = jest.fn().mockResolvedValue({ id: 'sbom-1' });
    const advisoryHandler = jest.fn().mockResolvedValue([{ json: { items: [] } }]);

    (dispatch as any)[2] = {
      sbom: {
        get: sbomHandler,
      },
      advisory: {
        getMany: advisoryHandler,
      },
    };

    const result = await node.execute.call(mockExecuteFunctions);

    expect(sbomHandler).toHaveBeenCalledWith({ ctx: mockExecuteFunctions, itemIndex: 0 });
    expect(advisoryHandler).toHaveBeenCalledWith({ ctx: mockExecuteFunctions, itemIndex: 1 });

    expect(result).toEqual([
      [
        { json: { id: 'sbom-1' }, pairedItem: { item: 0 } },
        { json: { items: [] }, pairedItem: { item: 1 } },
      ],
    ]);
  });

  it('should use correct typeVersion from getNode()', async () => {
    const inputData: INodeExecutionData[] = [{ json: { id: 1 } }];
    const mockResult = { id: 'test' };

    mockExecuteFunctions.getInputData.mockReturnValue(inputData);
    mockExecuteFunctions.getNode.mockReturnValue({ typeVersion: 2 } as any);
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('sbom').mockReturnValueOnce('get');

    const mockHandler = jest.fn().mockResolvedValue(mockResult);
    (dispatch as any)[2] = {
      sbom: {
        get: mockHandler,
      },
    };

    await node.execute.call(mockExecuteFunctions);

    expect(mockExecuteFunctions.getNode).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalled();
  });
});
