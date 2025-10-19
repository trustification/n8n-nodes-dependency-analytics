module.exports = {
	preset: 'ts-jest',
	testPathIgnorePatterns: ['node_modules/', 'dist/'],
	verbose: true,
	collectCoverage: true,
	coverageReporters: ['text', 'cobertura'],
};
