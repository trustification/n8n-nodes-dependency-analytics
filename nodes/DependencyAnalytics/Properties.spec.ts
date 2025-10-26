import { commonProperties } from './descriptions/common.properties';

describe('Tests for common.properties.ts', () => {
	test('It should be an array of INodeProperties', () => {
		expect(Array.isArray(commonProperties)).toBe(true);
		commonProperties.forEach((prop) => {
			expect(prop).toHaveProperty('displayName');
			expect(prop).toHaveProperty('name');
			expect(prop).toHaveProperty('type');
		});
	});

	test('It should include authMethod property with correct options', () => {
		const authMethod = commonProperties.find((p) => p.name === 'authMethod');
		expect(authMethod).toBeDefined();
		expect(authMethod?.type).toBe('options');
		expect(authMethod?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'Authorization Code', value: 'authorizationCode' }),
				expect.objectContaining({ name: 'Client Credentials', value: 'clientCredentials' }),
			]),
		);
		expect(authMethod?.default).toBe('authorizationCode');
	});

	test('It should include baseURL property with default and description', () => {
		const baseURL = commonProperties.find((p) => p.name === 'baseURL');
		expect(baseURL).toBeDefined();
		expect(baseURL?.type).toBe('string');
		expect(baseURL?.default).toBe('http://localhost:8080/api/v2/');
		expect(baseURL?.description).toContain('The base URL');
	});

	test('It should include resource property with expected options', () => {
		const resource = commonProperties.find((p) => p.name === 'resource');
		expect(resource).toBeDefined();
		expect(resource?.type).toBe('options');
		expect(resource?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'SBOM', value: 'sbom' }),
				expect.objectContaining({ name: 'Vulnerability', value: 'vulnerability' }),
				expect.objectContaining({ name: 'Advisory', value: 'advisory' }),
			]),
		);
		expect(resource?.default).toBe('vulnerability');
	});

	test('It should include limit property with typeOptions.minValue and description', () => {
		const limit = commonProperties.find((p) => p.name === 'limit');
		expect(limit).toBeDefined();
		expect(limit?.type).toBe('number');
		expect(limit?.typeOptions?.minValue).toBe(1);
		expect(limit?.description).toContain('Max number of results');
	});

	test('It should include outputMode property with correct options', () => {
		const outputMode = commonProperties.find((p) => p.name === 'outputMode');
		expect(outputMode).toBeDefined();
		expect(outputMode?.type).toBe('options');
		expect(outputMode?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'Simplified', value: 'simplified' }),
				expect.objectContaining({ name: 'Raw', value: 'raw' }),
				expect.objectContaining({ name: 'Selected Fields', value: 'selected' }),
			]),
		);
		expect(outputMode?.default).toBe('simplified');
		expect(outputMode?.description).toContain('How to shape the response');
	});
});
