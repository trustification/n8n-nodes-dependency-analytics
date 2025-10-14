import { DependencyAnalytics } from './DependencyAnalytics.node';

test('It instantiates and contains the correct name', () => {
	const node = new DependencyAnalytics();
	expect(node.description.displayName).toEqual('Dependency Analytics');
});

test('It contains the icon', () => {
	const node = new DependencyAnalytics();
	expect(node.description.icon).toEqual('file:DependencyAnalytics.svg');
});
