import { DependencyAnalytics } from './DependencyAnalytics.node';

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
		'Operation',
		'Operation',
		'Operation',
		'Identifier',
		'Limit',
		'Input Type',
		'PURLs',
		'SBOM SHA-256',
	];

	expect(displayNames).toEqual(expectedDisplayNames);
});
