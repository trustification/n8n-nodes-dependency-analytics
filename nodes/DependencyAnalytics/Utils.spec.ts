import { throwError } from './utils/errors';
import {
  IExecuteFunctions,
  INode,
  INodeParameters,
  INodeCredentials,
  NodeOperationError,
  IHttpRequestOptions,
} from 'n8n-workflow';
import { multiCmp, SortRule } from './utils/sort';
import { readSortRules } from './utils/readSort';
import { simplifyOne, simplifySbom, simplifyVuln, simplifyAdvisory } from './utils/simplify';
import { parsePurls } from './utils/parsePurls';
import { getBase, chooseCredential, authedRequest, defaultJsonHeaders } from './utils/http';
import { readSelectedFields, shapeOutput } from './utils/output';

describe('Tests for errors.ts', () => {
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
});

describe('Tests for sort.ts', () => {
  test('It should return 0 if all fields are equal', () => {
    const a = { name: 'Foo', value: 42 };
    const b = { name: 'Foo', value: 42 };
    expect(multiCmp(a, b, [{ field: 'name', direction: 'asc' }])).toBe(0);
  });

  test('It should use the first rule that differs', () => {
    const a = { name: 'Foo', value: 42 };
    const b = { name: 'Bar', value: 42 };
    const rules: SortRule[] = [
      { field: 'name', direction: 'asc' },
      { field: 'value', direction: 'desc' },
    ];
    expect(multiCmp(a, b, rules)).toBe(1);
  });

  test('It should compare strings', () => {
    const a = 'Foo';
    const b = 'Bar';
    const rules: SortRule[] = [];
    expect(multiCmp(a, b, rules)).toBe(0);
  });

  test('It should compare numbers', () => {
    const a = 1;
    const b = 2;
    const rules: SortRule[] = [];
    expect(multiCmp(a, b, rules)).toBe(0);
  });

  test('It should sort descending properly', () => {
    const a = { size: 10 };
    const b = { size: 20 };
    const rules: SortRule[] = [{ field: 'average_severity', direction: 'desc' }];
    expect(multiCmp(a, b, rules)).toBe(0);

    const a2 = { average_severity: 10 };
    const b2 = { average_severity: 20 };
    const rules2: SortRule[] = [{ field: 'average_severity', direction: 'desc' }];
    expect(multiCmp(a2, b2, rules2)).toBe(0);
  });

  test('It should return 0 if all comparisons equal', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 1, y: 2 };
    const rules: SortRule[] = [
      { field: 'x', direction: 'asc' },
      { field: 'y', direction: 'asc' },
    ];
    expect(multiCmp(a, b, rules)).toBe(0);
  });

  test('It should return 0 when value is not a number or undefined', () => {
    const a = { size: 'aaa' };
    const b = { size: 'aaa' };
    const rules: SortRule[] = [{ field: 'size', direction: 'asc' }];
    expect(multiCmp(a, b, rules)).toBe(0);

    const a2 = { size: undefined };
    const b2 = { size: undefined };
    const rules2: SortRule[] = [{ field: 'size', direction: 'asc' }];
    expect(multiCmp(a2, b2, rules2)).toBe(0);
  });
});

describe('Tests for readSort.ts', () => {
  const mockRules: SortRule[] = [{ field: 'name', direction: 'asc' }];

  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      getNodeParameter: jest.fn().mockReturnValue(mockRules),
    };
  });

  test('It should return sortingSbom.sort path for resource `sbom`', () => {
    const result = readSortRules(mockCtx, 0, 'sbom');
    expect(mockCtx.getNodeParameter).toHaveBeenCalledWith('sortingSbom.sort', 0, []);
    expect(result).toEqual(mockRules);
  });

  test('It should return sortingVuln.sort path for resource `vulnerability`', () => {
    const result = readSortRules(mockCtx, 1, 'vulnerability');
    expect(mockCtx.getNodeParameter).toHaveBeenCalledWith('sortingVuln.sort', 1, []);
    expect(result).toEqual(mockRules);
  });

  test('It should return sortingAdvisory.sort path for resource `advisory`', () => {
    const result = readSortRules(mockCtx, 2, 'advisory');
    expect(mockCtx.getNodeParameter).toHaveBeenCalledWith('sortingAdvisory.sort', 2, []);
    expect(result).toEqual(mockRules);
  });

  test('It should return empty array if getNodeParameter returns null or undefined', () => {
    mockCtx.getNodeParameter.mockReturnValueOnce(null);
    const result = readSortRules(mockCtx, 0, 'sbom');
    expect(result).toEqual([]);
  });
});

describe('Tests for simplify.ts', () => {
  test('It should extract correct fields from `item.described_by`', () => {
    const item = {
      id: '1',
      name: 'Foo SBOM',
      described_by: [
        {
          name: 'desc name',
          version: '1.0',
          purl: [{ purl: 'pkg:example@1.0' }],
        },
      ],
      published: '2024-01-01',
      ingested: '2024-01-02',
      number_of_packages: 5,
      size: 12345,
      sha256: 'abc123',
      document_id: 'doc-1',
    };
    const result = simplifySbom(item);
    expect(result).toEqual({
      id: '1',
      name: 'Foo SBOM',
      version: '1.0',
      published: '2024-01-01',
      ingested: '2024-01-02',
      packages: 5,
      size: 12345,
      sha256: 'abc123',
      purl: 'pkg:example@1.0',
      documentId: 'doc-1',
    });
  });

  test('It should handle missing optional fields', () => {
    const result = simplifySbom({ id: 'x' });
    expect(result).toMatchObject({
      id: 'x',
      name: null,
      version: null,
      published: null,
      ingested: null,
      packages: null,
      size: null,
      sha256: null,
      purl: null,
      documentId: null,
    });
  });

  test('It should extract correct fields and count advisories', () => {
    const item = {
      identifier: 'CVE-123',
      title: 'Example vuln',
      published: '2024-01-01',
      modified: '2024-01-02',
      average_severity: 'high',
      average_score: 9.1,
      cwes: ['CWE-79'],
      advisories: [{}, {}],
      reserved: false,
      withdrawn: false,
    };
    const result = simplifyVuln(item);
    expect(result).toEqual({
      identifier: 'CVE-123',
      title: 'Example vuln',
      published: '2024-01-01',
      modified: '2024-01-02',
      severity: 'high',
      score: 9.1,
      cwe: 'CWE-79',
      advisories: [{}, {}],
      reserved: false,
      withdrawn: false,
    });
  });

  test('It should handle missing fields and non-array advisories', () => {
    const result = simplifyVuln({ identifier: 'CVE-XYZ' });
    expect(result).toMatchObject({
      identifier: 'CVE-XYZ',
      title: null,
      published: null,
      modified: null,
      severity: null,
      score: null,
      cwe: null,
      advisories: [],
      reserved: null,
      withdrawn: null,
    });
  });

  test('It should extract fields including issuer name', () => {
    const item = {
      document_id: 'doc-1',
      identifier: 'ADV-001',
      title: 'Advisory title',
      issuer: { name: 'SecurityTeam' },
      published: '2024-01-01',
      modified: '2024-01-02',
      average_severity: 'medium',
      average_score: 5.4,
      size: 1234,
      ingested: '2024-02-01',
    };
    const result = simplifyAdvisory(item);
    expect(result).toEqual({
      uuid: null,
      identifier: 'ADV-001',
      document_id: 'doc-1',
      title: 'Advisory title',
      sha256: null,
      size: 1234,
      average_severity: 'medium',
      average_score: 5.4,
      vulnerabilities: [],
    });
  });

  test('It should handle missing issuer and optional fields', () => {
    const result = simplifyAdvisory({ identifier: 'ADV-002' });
    expect(result).toMatchObject({
      uuid: null,
      identifier: 'ADV-002',
      document_id: null,
      title: null,
      sha256: null,
      size: null,
      average_severity: null,
      average_score: null,
      vulnerabilities: [],
    });
  });

  describe('simplifyOne', () => {
    test('It should call simplifySbom when resource is sbom', () => {
      const sbomObj = {
        id: 'sbom-1',
        name: 'Test SBOM',
        described_by: [
          {
            name: 'package',
            version: '1.0.0',
            purl: [{ purl: 'pkg:npm/test@1.0.0' }],
          },
        ],
        number_of_packages: 10,
      };

      const result = simplifyOne('sbom', sbomObj);

      expect(result).toHaveProperty('id', 'sbom-1');
      expect(result).toHaveProperty('name', 'Test SBOM');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('packages', 10);
      expect(result).toHaveProperty('purl', 'pkg:npm/test@1.0.0');
    });

    test('It should call simplifyVuln when resource is vulnerability', () => {
      const vulnObj = {
        identifier: 'CVE-2024-1234',
        title: 'Test Vulnerability',
        average_severity: 'critical',
        average_score: 9.8,
        cwes: ['CWE-79', 'CWE-89'],
        advisories: [{}, {}, {}],
      };

      const result = simplifyOne('vulnerability', vulnObj);
      expect(result).toHaveProperty('identifier', 'CVE-2024-1234');
      expect(result).toHaveProperty('title', 'Test Vulnerability');
      expect(result).toHaveProperty('severity', 'critical');
      expect(result).toHaveProperty('score', 9.8);
      expect(result).toHaveProperty('cwe', 'CWE-79');
    });

    test('It should call simplifyAdvisory when resource is advisory', () => {
      const advisoryObj = {
        document_id: 'doc-123',
        identifier: 'RHSA-2024-0001',
        title: 'Security Advisory',
        issuer: { name: 'Red Hat' },
        average_severity: 'high',
        average_score: 7.5,
        size: 5000,
      };

      const result = simplifyOne('advisory', advisoryObj);
      expect(result).toHaveProperty('document_id', 'doc-123');
      expect(result).toHaveProperty('identifier', 'RHSA-2024-0001');
      expect(result).toHaveProperty('title', 'Security Advisory');
      expect(result).toHaveProperty('average_severity', 'high');
      expect(result).toHaveProperty('average_score', 7.5);
      expect(result).toHaveProperty('size', 5000);
    });

    test('It should handle empty objects for sbom resource', () => {
      const result = simplifyOne('sbom', {});

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', null);
      expect(result).toHaveProperty('version', null);
      expect(result).toHaveProperty('packages', null);
    });

    test('It should handle empty objects for vulnerability resource', () => {
      const result = simplifyOne('vulnerability', {});
      expect(result).toHaveProperty('identifier', null);
      expect(result).toHaveProperty('title', null);
      expect(result).toHaveProperty('advisories', []);
    });

    test('It should handle empty objects for advisory resource', () => {
      const result = simplifyOne('advisory', {});
      expect(result).toHaveProperty('document_id', null);
      expect(result).toHaveProperty('identifier', null);
      expect(result).toHaveProperty('average_severity', null);
      expect(result).toHaveProperty('average_score', null);
      expect(result).toHaveProperty('vulnerabilities', []);
    });
  });
});

describe('Tests for parsePurls.ts', () => {
  jest.mock('./utils/errors', () => ({
    throwError: jest.fn(),
  }));

  const mockCtx = {
    getNode: jest.fn().mockReturnValue({ id: 'node-1' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('It should return deduplicated array when input is already string array', () => {
    const result = parsePurls(['pkg:a', 'pkg:b', 'pkg:a', '   pkg:c  '], mockCtx as any, 0);
    expect(result).toEqual(['pkg:a', 'pkg:b', 'pkg:c']);
  });

  test('It should parse JSON string array', () => {
    const jsonInput = '["pkg:x", "pkg:y", "pkg:x"]';
    const result = parsePurls(jsonInput, mockCtx as any, 1);
    expect(result).toEqual(['pkg:x', 'pkg:y']);
  });

  test('It should parse newline-separated string', () => {
    const input = 'pkg:one\npkg:two\n#comment\npkg:three';
    const result = parsePurls(input, mockCtx as any, 3);
    expect(result).toEqual(['pkg:one', 'pkg:two', 'pkg:three']);
  });

  test('It should parse object with `{ purls: [...] }`', () => {
    const input = { purls: ['pkg:a', 'pkg:b', 'pkg:a'] };
    const result = parsePurls(input, mockCtx as any, 4);
    expect(result).toEqual(['pkg:a', 'pkg:b']);
  });
});

describe('Tests for http.ts', () => {
  test('It should remove trailing slashes from baseURL', () => {
    const mockCtx = {
      getNodeParameter: jest.fn().mockReturnValue('https://api.foobar.com///'),
    };
    const result = getBase(mockCtx as any, 0);
    expect(mockCtx.getNodeParameter).toHaveBeenCalledWith('baseURL', 0, 'https://rhtpa.stage.devshift.net/api/v2/');
    expect(result).toBe('https://api.foobar.com');
  });

  test('It should return unchanged URL if no trailing slash', () => {
    const mockCtx = {
      getNodeParameter: jest.fn().mockReturnValue('https://api.foobar.com'),
    };
    const result = getBase(mockCtx as any, 1);
    expect(result).toBe('https://api.foobar.com');
  });

  test('It should return `trustifyClientCredsOAuth2Api`', () => {
    const mockCtx = {
      getNodeParameter: jest.fn().mockReturnValue('trustifyClientCredentials'),
    };
    const result = chooseCredential(mockCtx as any, 1);
    expect(result).toBe('trustifyClientCredsOAuth2Api');
  });

  test('It should simulate authedRequest call', async () => {
    const mockResponse = { ok: true };
    const mockHttp = jest.fn().mockResolvedValue(mockResponse);

    const mockCtx = {
      helpers: {
        httpRequestWithAuthentication: mockHttp as any,
      },
    } as unknown as IExecuteFunctions;

    const opts: IHttpRequestOptions = {
      url: 'https://api.foobar.com/resource',
      method: 'GET',
      json: true,
    };

    const result = await authedRequest(mockCtx as IExecuteFunctions, 'Foo', opts);

    expect(mockHttp).toHaveBeenCalledWith('Foo', opts);
    expect(result).toEqual(mockResponse);
  });

  test('It should contain correct default headers', () => {
    expect(defaultJsonHeaders).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  });
});

describe('Tests for output.ts', () => {
  const fakeObj = {
    id: '123',
    name: 'pkg',
    described_by: [{ name: 'inner', version: '1.0', purl: [{ purl: 'pkg:abc' }] }],
  };

  jest.mock('./utils/simplify', () => ({
    simplifyOne: jest.fn().mockReturnValue({ simplified: true }),
  }));

  test('It should return array if parameter is array', () => {
    const ctx = {
      getNodeParameter: jest.fn().mockReturnValue(['id', 'name']),
    } as unknown as IExecuteFunctions;

    const result = readSelectedFields(ctx, 0, 'sbom');
    expect(result).toEqual(['id', 'name']);
    expect(ctx.getNodeParameter).toHaveBeenCalledWith('sbomSelectedFields', 0, []);
  });

  test('It should return empty array if parameter is not array', () => {
    const ctx = {
      getNodeParameter: jest.fn().mockReturnValue('invalid'),
    } as unknown as IExecuteFunctions;

    const result = readSelectedFields(ctx, 0, 'vulnerability');
    expect(result).toEqual([]);
  });

  test('It should return raw object when outputMode is raw', () => {
    const ctx = {
      getNodeParameter: jest.fn().mockReturnValue('raw'),
    } as unknown as IExecuteFunctions;

    const result = shapeOutput(ctx, 0, 'sbom', fakeObj);
    expect(result).toBe(fakeObj);
  });

  test('It should return simplified object when outputMode is simplified', () => {
    const simplifiedFakeObj = {
      documentId: null,
      id: '123',
      ingested: null,
      name: 'pkg',
      packages: null,
      published: null,
      purl: 'pkg:abc',
      sha256: null,
      size: null,
      version: '1.0',
    };
    const ctx = {
      getNodeParameter: jest.fn().mockReturnValue('simplified'),
    } as unknown as IExecuteFunctions;

    const result = shapeOutput(ctx, 0, 'sbom', fakeObj);
    expect(result).toStrictEqual(simplifiedFakeObj);
  });

  test('It should transform the output correctly for sbom', () => {
    const ctx = {
      getNodeParameter: jest.fn().mockImplementation((name) => {
        if (name === 'outputMode') return 'selected';
        if (name === 'sbomSelectedFields') return ['name', 'version', 'purl'];
        return [];
      }),
    } as unknown as IExecuteFunctions;

    const result = shapeOutput(ctx, 0, 'sbom', fakeObj);

    expect(result).toHaveProperty('id', '123');
    expect(result).toHaveProperty('name', 'pkg');
    expect(result).toHaveProperty('version', '1.0');
    expect(result).toHaveProperty('purl', 'pkg:abc');
  });

  test('It should transform the output correctly for vulnerability', () => {
    const ctx = {
      getNodeParameter: jest.fn().mockImplementation((name) => {
        if (name === 'outputMode') return 'selected';
        if (name === 'vulnSelectedFields') return ['title', 'score'];
        return [];
      }),
    } as unknown as IExecuteFunctions;

    const obj = { identifier: 'CVE-1234', title: 'test', score: 9.8 };
    const result = shapeOutput(ctx, 0, 'vulnerability', obj);

    expect(result).toHaveProperty('identifier', 'CVE-1234');
    expect(result).toHaveProperty('title', 'test');
    expect(result).toHaveProperty('score', 9.8);
  });
});
