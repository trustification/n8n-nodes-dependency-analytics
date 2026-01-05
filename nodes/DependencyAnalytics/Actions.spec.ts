import * as advisory from './actions/advisory';
import * as sbom from './actions/sbom';
import * as vulnerability from './actions/vulnerability';
import { dispatch } from './actions';
import { authedRequest, chooseCredential, defaultJsonHeaders, getBase } from './utils/http';
import { multiCmp } from './utils/sort';
import { readSortRules } from './utils/readSort';
import { shapeOutput } from './utils/output';
import { parsePurls } from './utils/parsePurls';
import { throwError } from './utils/errors';

jest.mock('./utils/http');
jest.mock('./utils/errors');
jest.mock('./utils/sort');
jest.mock('./utils/readSort');
jest.mock('./utils/output');
jest.mock('./utils/parsePurls');

describe('Tests for actions/advisory.ts', () => {
  const ctx = {
    getNodeParameter: jest.fn(),
    getNode: jest.fn().mockReturnValue({ name: 'AdvisoryNode' }),
    continueOnFail: jest.fn().mockReturnValue(false),
  } as any;

  const fakeCredential = 'foo';
  const fakeBase = 'http://foobar.com/api/v2';

  beforeEach(() => {
    jest.clearAllMocks();
    ctx.continueOnFail.mockReturnValue(false);
    (chooseCredential as jest.Mock).mockReturnValue(fakeCredential);
    (getBase as jest.Mock).mockReturnValue(fakeBase);
    (shapeOutput as jest.Mock).mockImplementation((_ctx, _i, _r, obj) => ({ shaped: obj }));
  });

  it('It should call authedRequest with correct options and shape output', async () => {
    ctx.getNodeParameter.mockReturnValueOnce('foobar123');
    const fakeResult = { id: 'A1' };
    (authedRequest as jest.Mock).mockResolvedValue(fakeResult);

    const result = await advisory.get({ ctx, itemIndex: 0 });

    expect(chooseCredential).toHaveBeenCalledWith(ctx, 0);
    expect(getBase).toHaveBeenCalledWith(ctx, 0);
    expect(authedRequest).toHaveBeenCalledWith(
      ctx,
      fakeCredential,
      expect.objectContaining({
        method: 'GET',
        url: `${fakeBase}/advisory/foobar123`,
        headers: defaultJsonHeaders,
      }),
    );
    expect(shapeOutput).toHaveBeenCalledWith(ctx, 0, 'advisory', fakeResult);
    expect(result).toEqual({ shaped: fakeResult });
  });

  it('It should fetch advisories and return `shaped items`', async () => {
    ctx.getNodeParameter.mockImplementation((name: any) => (name === 'limit' ? 2 : undefined));

    const fakeItems = [{ id: 1 }, { id: 2 }, { id: 3 }];
    (authedRequest as jest.Mock).mockResolvedValue({ items: fakeItems });
    (readSortRules as jest.Mock).mockReturnValue([]);
    (multiCmp as jest.Mock).mockImplementation(() => 0);

    const result = await advisory.getMany({ ctx, itemIndex: 0 });

    expect(authedRequest).toHaveBeenCalledWith(
      ctx,
      fakeCredential,
      expect.objectContaining({
        method: 'GET',
        url: `${fakeBase}/advisory?limit=2`,
        returnFullResponse: false,
        headers: defaultJsonHeaders,
      }),
    );
    expect(readSortRules).toHaveBeenCalledWith(ctx, 0, 'advisory', 'getMany');
    expect(shapeOutput).toHaveBeenCalledTimes(2);
    expect(result[0].json.advisories).toHaveLength(2);
    expect(result[0].json.advisories[0]).toEqual({ shaped: { id: 1 } });
  });

  it('It should sort items if sort rules are provided', async () => {
    ctx.getNodeParameter.mockImplementation((name: any) => (name === 'limit' ? 10 : undefined));

    const fakeItems = [{ id: 2 }, { id: 1 }];
    const fakeRules = [{ field: 'id', direction: 'asc' }];
    (authedRequest as jest.Mock).mockResolvedValue({ items: fakeItems });
    (readSortRules as jest.Mock).mockReturnValue(fakeRules);
    (multiCmp as jest.Mock).mockImplementation((a, b) => a.id - b.id);

    const result = await advisory.getMany({ ctx, itemIndex: 0 });

    expect(readSortRules).toHaveBeenCalledWith(ctx, 0, 'advisory', 'getMany');
    expect(result[0].json.advisories.map((it: any) => it.shaped.id)).toEqual([1, 2]);
  });

  it('It should handle missing items array gracefully', async () => {
    ctx.getNodeParameter.mockReturnValueOnce(3);
    (authedRequest as jest.Mock).mockResolvedValue({});
    (readSortRules as jest.Mock).mockReturnValue([]);

    const result = await advisory.getMany({ ctx, itemIndex: 0 });

    expect(Array.isArray(result[0].json.advisories)).toBe(true);
    expect(result[0].json.advisories).toEqual([]);
  });

  it('It should throw error if identifier is empty', async () => {
    ctx.getNodeParameter.mockReturnValueOnce('   ');
    (throwError as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('Identifier required');
    });

    await expect(advisory.get({ ctx, itemIndex: 0 })).rejects.toThrow();
    expect(throwError).toHaveBeenCalledWith(
      expect.anything(),
      "The 'Identifier' parameter is required.",
      0,
    );
  });

  describe('advisory.analyze', () => {
    describe('inputType: purls', () => {
      it('should analyze advisories by PURLs', async () => {
        ctx.getNodeParameter
          .mockReturnValueOnce('purls')
          .mockReturnValueOnce('pkg:npm/lodash@4.17.19');

        const parsedPurls = ['pkg:npm/lodash@4.17.19'];
        (parsePurls as jest.Mock).mockReturnValue(parsedPurls);

        const fakeResult = { advisories: [] };
        (authedRequest as jest.Mock).mockResolvedValue(fakeResult);

        const result = await advisory.analyze({ ctx, itemIndex: 0 });

        expect(parsePurls).toHaveBeenCalledWith('pkg:npm/lodash@4.17.19', ctx, 0);
        expect(authedRequest).toHaveBeenCalledWith(
          ctx,
          fakeCredential,
          expect.objectContaining({
            method: 'POST',
            url: `${fakeBase}/vulnerability/analyze`,
            body: { purls: parsedPurls },
            json: true,
          }),
        );
        expect(result).toEqual([{ json: fakeResult }]);
      });

      it('It should throw error if no PURLs provided', async () => {
        ctx.getNodeParameter.mockReturnValueOnce('purls').mockReturnValueOnce('');

        (parsePurls as jest.Mock).mockReturnValue([]);
        (throwError as unknown as jest.Mock).mockImplementation(() => {
          throw new Error('PURLs required');
        });

        await expect(advisory.analyze({ ctx, itemIndex: 0 })).rejects.toThrow();
        expect(throwError).toHaveBeenCalledWith(
          expect.anything(),
          "Provide at least one PURL in 'PURLs'.",
          0,
        );
      });

      it('It should handle errors gracefully when continueOnFail is true', async () => {
        ctx.getNodeParameter.mockReturnValueOnce('purls').mockReturnValueOnce('pkg:npm/foo@1.0.0');
        ctx.continueOnFail.mockReturnValue(true);

        const parsedPurls = ['pkg:npm/foo@1.0.0'];
        (parsePurls as jest.Mock).mockReturnValue(parsedPurls);
        (authedRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

        const result = await advisory.analyze({ ctx, itemIndex: 0 });

        expect(result).toEqual([
          {
            json: {
              message: 'API Error',
              request: { purls: parsedPurls },
            },
          },
        ]);
      });

      it('It should throw error when continueOnFail is false', async () => {
        ctx.getNodeParameter.mockReturnValueOnce('purls').mockReturnValueOnce('pkg:npm/bar@2.0.0');
        ctx.continueOnFail.mockReturnValue(false);

        const parsedPurls = ['pkg:npm/bar@2.0.0'];
        (parsePurls as jest.Mock).mockReturnValue(parsedPurls);
        (authedRequest as jest.Mock).mockRejectedValue(new Error('API Error'));

        await expect(advisory.analyze({ ctx, itemIndex: 0 })).rejects.toThrow('API Error');
      });
    });

    describe('inputType: sbomSha', () => {
      it('It should analyze advisories by SBOM SHA (prefixed)', async () => {
        ctx.getNodeParameter
          .mockReturnValueOnce('sbomSha')
          .mockReturnValueOnce('sha256:abc123def456');

        const sbomResponse = { id: 'sbom-123' };
        const advisoryResponse = [{ id: 'ADV-1' }];
        (authedRequest as jest.Mock)
          .mockResolvedValueOnce(sbomResponse)
          .mockResolvedValueOnce(advisoryResponse);

        const result = await advisory.analyze({ ctx, itemIndex: 0 });
        expect(authedRequest).toHaveBeenNthCalledWith(
          1,
          ctx,
          fakeCredential,
          expect.objectContaining({
            method: 'GET',
            url: `${fakeBase}/sbom/${encodeURIComponent('sha256:abc123def456')}`,
          }),
        );
        expect(authedRequest).toHaveBeenNthCalledWith(
          2,
          ctx,
          fakeCredential,
          expect.objectContaining({
            method: 'GET',
            url: `${fakeBase}/sbom/sbom-123/advisory`,
          }),
        );
        expect(result).toEqual([
          {
            json: {
              sbomId: 'sbom-123',
              advisories: [{ shaped: { id: 'ADV-1' } }],
            },
          },
        ]);
      });

      it('It should throw error if SBOM SHA256 is empty', async () => {
        ctx.getNodeParameter.mockReturnValueOnce('sbomSha').mockReturnValueOnce('  ');

        (throwError as unknown as jest.Mock).mockImplementation(() => {
          throw new Error('SBOM SHA required');
        });

        await expect(advisory.analyze({ ctx, itemIndex: 0 })).rejects.toThrow();
        expect(throwError).toHaveBeenCalledWith(
          expect.anything(),
          "The 'SBOM SHA' parameter is required.",
          0,
        );
      });

      it('It should throw error if SBOM not found', async () => {
        ctx.getNodeParameter.mockReturnValueOnce('sbomSha').mockReturnValueOnce('sha256:abc123');

        (authedRequest as jest.Mock).mockResolvedValueOnce({});
        (throwError as unknown as jest.Mock).mockImplementation(() => {
          throw new Error('SBOM not found');
        });

        await expect(advisory.analyze({ ctx, itemIndex: 0 })).rejects.toThrow();
        expect(throwError).toHaveBeenCalledWith(
          expect.anything(),
          "No SBOM found for the provided value in 'SBOM SHA'.",
          0,
        );
      });
    });
  });
});

describe('Tests for actions/sbom.ts', () => {
  const ctx = {
    getNodeParameter: jest.fn(),
    getNode: jest.fn().mockReturnValue({ name: 'SBOMNode' }),
  } as any;

  const fakeCredential = 'foo';
  const fakeBase = 'http://foobar.com/api/v2';

  beforeEach(() => {
    jest.clearAllMocks();
    (chooseCredential as jest.Mock).mockReturnValue(fakeCredential);
    (getBase as jest.Mock).mockReturnValue(fakeBase);
    (shapeOutput as jest.Mock).mockImplementation((_ctx, _i, _r, obj) => ({ shaped: obj }));
  });

  describe('sbom.get', () => {
    it('It should accept SHA256 identifier with prefix', async () => {
      const identifier = 'sha256:abc123def456789012345678901234567890123456789012345678901234';
      ctx.getNodeParameter.mockReturnValueOnce(identifier);
      const fakeResult = { id: 'SBOM2' };
      (authedRequest as jest.Mock).mockResolvedValue(fakeResult);

      await sbom.get({ ctx, itemIndex: 0 });

      expect(authedRequest).toHaveBeenCalledWith(
        ctx,
        fakeCredential,
        expect.objectContaining({
          url: `${fakeBase}/sbom/${encodeURIComponent(identifier)}`,
        }),
      );
    });

    it('It should accept non-SHA256 identifier (e.g., name)', async () => {
      const identifier = 'my-sbom-name';
      ctx.getNodeParameter.mockReturnValueOnce(identifier);
      const fakeResult = { id: 'SBOM3' };
      (authedRequest as jest.Mock).mockResolvedValue(fakeResult);

      await sbom.get({ ctx, itemIndex: 0 });

      expect(authedRequest).toHaveBeenCalledWith(
        ctx,
        fakeCredential,
        expect.objectContaining({
          url: `${fakeBase}/sbom/${identifier}`,
        }),
      );
    });

    it('It should throw error if identifier is empty', async () => {
      ctx.getNodeParameter.mockReturnValueOnce('   ');
      (throwError as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Identifier required');
      });

      await expect(sbom.get({ ctx, itemIndex: 0 })).rejects.toThrow();
      expect(throwError).toHaveBeenCalledWith(
        expect.anything(),
        "The 'Identifier' parameter is required.",
        0,
      );
    });
  });

  describe('sbom.getMany', () => {
    it('It should fetch SBOMs with limit and return shaped items', async () => {
      ctx.getNodeParameter.mockImplementation((name: any) => (name === 'limit' ? 3 : undefined));

      const fakeItems = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      (authedRequest as jest.Mock).mockResolvedValue({ items: fakeItems });
      (readSortRules as jest.Mock).mockReturnValue([]);
      (multiCmp as jest.Mock).mockImplementation(() => 0);

      const result = await sbom.getMany({ ctx, itemIndex: 0 });

      expect(authedRequest).toHaveBeenCalledWith(
        ctx,
        fakeCredential,
        expect.objectContaining({
          method: 'GET',
          url: `${fakeBase}/sbom?limit=3`,
          returnFullResponse: false,
          headers: defaultJsonHeaders,
        }),
      );
      expect(readSortRules).toHaveBeenCalledWith(ctx, 0, 'sbom', 'getMany');
      expect(shapeOutput).toHaveBeenCalledTimes(3);
      expect(result[0].json.sboms).toHaveLength(3);
    });

    it('It should sort SBOMs when sort rules are provided', async () => {
      ctx.getNodeParameter.mockImplementation((name: any) => (name === 'limit' ? 10 : undefined));

      const fakeItems = [{ name: 'b' }, { name: 'a' }];
      const fakeRules = [{ field: 'name', direction: 'asc' }];
      (authedRequest as jest.Mock).mockResolvedValue({ items: fakeItems });
      (readSortRules as jest.Mock).mockReturnValue(fakeRules);
      (multiCmp as jest.Mock).mockImplementation((a, b) => a.name.localeCompare(b.name));

      const result = await sbom.getMany({ ctx, itemIndex: 0 });

      expect(readSortRules).toHaveBeenCalledWith(ctx, 0, 'sbom', 'getMany');
      expect(result[0].json.sboms.map((it: any) => it.shaped.name)).toEqual(['a', 'b']);
    });

    it('It should handle missing items array gracefully', async () => {
      ctx.getNodeParameter.mockReturnValueOnce(5);
      (authedRequest as jest.Mock).mockResolvedValue({});
      (readSortRules as jest.Mock).mockReturnValue([]);

      const result = await sbom.getMany({ ctx, itemIndex: 0 });

      expect(Array.isArray(result[0].json.sboms)).toBe(true);
      expect(result[0].json.sboms).toEqual([]);
    });
  });
});

describe('Tests for actions/vulnerability.ts', () => {
  const ctx = {
    getNodeParameter: jest.fn(),
    getNode: jest.fn().mockReturnValue({ name: 'VulnerabilityNode' }),
    continueOnFail: jest.fn().mockReturnValue(false),
  } as any;

  const fakeCredential = 'foo';
  const fakeBase = 'http://foobar.com/api/v2';

  beforeEach(() => {
    jest.clearAllMocks();
    (chooseCredential as jest.Mock).mockReturnValue(fakeCredential);
    (getBase as jest.Mock).mockReturnValue(fakeBase);
    (shapeOutput as jest.Mock).mockImplementation((_ctx, _i, _r, obj) => ({ shaped: obj }));
  });

  describe('vulnerability.get', () => {
    it('It should fetch vulnerability by identifier', async () => {
      ctx.getNodeParameter.mockReturnValueOnce('CVE-2024-1234');
      const fakeResult = { id: 'CVE-2024-1234', severity: 'HIGH' };
      (authedRequest as jest.Mock).mockResolvedValue(fakeResult);

      const result = await vulnerability.get({ ctx, itemIndex: 0 });

      expect(authedRequest).toHaveBeenCalledWith(
        ctx,
        fakeCredential,
        expect.objectContaining({
          method: 'GET',
          url: `${fakeBase}/vulnerability/CVE-2024-1234`,
          headers: defaultJsonHeaders,
        }),
      );
      expect(shapeOutput).toHaveBeenCalledWith(ctx, 0, 'vulnerability', fakeResult);
      expect(result).toEqual({ shaped: fakeResult });
    });

    it('It should throw error if identifier is empty', async () => {
      ctx.getNodeParameter.mockReturnValueOnce('  ');
      (throwError as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Identifier required');
      });

      await expect(vulnerability.get({ ctx, itemIndex: 0 })).rejects.toThrow();
      expect(throwError).toHaveBeenCalledWith(
        expect.anything(),
        "The 'Identifier' parameter is required.",
        0,
      );
    });
  });

  describe('vulnerability.getMany', () => {
    it('It should fetch vulnerabilities with limit', async () => {
      ctx.getNodeParameter.mockImplementation((name: any) => (name === 'limit' ? 2 : undefined));

      const fakeItems = [{ id: 'CVE-1' }, { id: 'CVE-2' }];
      (authedRequest as jest.Mock).mockResolvedValue({ items: fakeItems });
      (readSortRules as jest.Mock).mockReturnValue([]);
      (multiCmp as jest.Mock).mockImplementation(() => 0);

      const result = await vulnerability.getMany({ ctx, itemIndex: 0 });

      expect(authedRequest).toHaveBeenCalledWith(
        ctx,
        fakeCredential,
        expect.objectContaining({
          method: 'GET',
          url: `${fakeBase}/vulnerability?limit=2`,
          returnFullResponse: false,
          headers: defaultJsonHeaders,
        }),
      );
      expect(readSortRules).toHaveBeenCalledWith(ctx, 0, 'vulnerability', 'getMany');
      expect(shapeOutput).toHaveBeenCalledTimes(2);
      expect(result[0].json.vulnerabilities).toHaveLength(2);
    });

    it('It should handle missing items array gracefully', async () => {
      ctx.getNodeParameter.mockReturnValueOnce(5);
      (authedRequest as jest.Mock).mockResolvedValue({});
      (readSortRules as jest.Mock).mockReturnValue([]);

      const result = await vulnerability.getMany({ ctx, itemIndex: 0 });

      expect(Array.isArray(result[0].json.vulnerabilities)).toBe(true);
      expect(result[0].json.vulnerabilities).toEqual([]);
    });
  });
});

describe('Tests for actions/index.ts', () => {
  describe('dispatch object structure', () => {
    it('should have version 2 with all resources and operations', () => {
      expect(dispatch).toHaveProperty('2');
      expect(dispatch[2]).toHaveProperty('sbom');
      expect(dispatch[2]).toHaveProperty('vulnerability');
      expect(dispatch[2]).toHaveProperty('advisory');

      ['sbom', 'vulnerability', 'advisory'].forEach((resource) => {
        expect(dispatch[2][resource as 'sbom' | 'vulnerability' | 'advisory']).toHaveProperty(
          'get',
        );
        expect(dispatch[2][resource as 'sbom' | 'vulnerability' | 'advisory']).toHaveProperty(
          'getMany',
        );
        expect(dispatch[2][resource as 'sbom' | 'vulnerability' | 'advisory']).toHaveProperty(
          'analyze',
        );
      });
    });

    it('should map sbom operations to correct handlers', () => {
      expect(dispatch[2].sbom.get).toBe(sbom.get);
      expect(dispatch[2].sbom.getMany).toBe(sbom.getMany);
      expect(dispatch[2].sbom.analyze).toBeInstanceOf(Function);
    });

    it('should map vulnerability operations to correct handlers', () => {
      expect(dispatch[2].vulnerability.get).toBe(vulnerability.get);
      expect(dispatch[2].vulnerability.getMany).toBe(vulnerability.getMany);
      expect(dispatch[2].vulnerability.analyze).toBeInstanceOf(Function);
    });

    it('should map advisory operations to correct handlers', () => {
      expect(dispatch[2].advisory.get).toBe(advisory.get);
      expect(dispatch[2].advisory.getMany).toBe(advisory.getMany);
      expect(dispatch[2].advisory.analyze).toBe(advisory.analyze);
    });
  });

  describe('unsupported analyze operations', () => {
    const ctx = {
      getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error when calling analyze on sbom', async () => {
      (throwError as unknown as jest.Mock).mockImplementation(() => {
        throw new Error("The 'Analyze' operation is not available for 'SBOM'.");
      });

      await expect(dispatch[2].sbom.analyze({ ctx, itemIndex: 0 })).rejects.toThrow(
        "The 'Analyze' operation is not available for 'SBOM'.",
      );

      expect(throwError).toHaveBeenCalledWith(
        { name: 'TestNode' },
        "The 'Analyze' operation is not available for 'SBOM'.",
        0,
      );
    });

    it('should throw error when calling analyze on vulnerability', async () => {
      (throwError as unknown as jest.Mock).mockImplementation(() => {
        throw new Error("The 'Analyze' operation is not available for 'Vulnerability'.");
      });

      await expect(dispatch[2].vulnerability.analyze({ ctx, itemIndex: 0 })).rejects.toThrow(
        "The 'Analyze' operation is not available for 'Vulnerability'.",
      );

      expect(throwError).toHaveBeenCalledWith(
        { name: 'TestNode' },
        "The 'Analyze' operation is not available for 'Vulnerability'.",
        0,
      );
    });

    it('should throw error with correct itemIndex', async () => {
      (throwError as unknown as jest.Mock).mockImplementation(() => {
        throw new Error("The 'Analyze' operation is not available for 'SBOM'.");
      });

      await expect(dispatch[2].sbom.analyze({ ctx, itemIndex: 5 })).rejects.toThrow();

      expect(throwError).toHaveBeenCalledWith(
        expect.anything(),
        "The 'Analyze' operation is not available for 'SBOM'.",
        5,
      );
    });
  });
});
