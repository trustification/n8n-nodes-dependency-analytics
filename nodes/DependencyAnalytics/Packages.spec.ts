import * as fs from 'node:fs';
import * as path from 'node:path';

describe('n8n community node package standards (package.json)', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as any;

  test('package name starts with n8n-nodes- or @<scope>/n8n-nodes-', () => {
    const name = pkg?.name;
    expect(typeof name).toBe('string');

    const ok = name.startsWith('n8n-nodes-') || /^@[^/]+\/n8n-nodes-/.test(name);
    expect(ok).toBe(true);
  });

  test('package keywords include n8n-community-node-package', () => {
    const keywords = pkg?.keywords;
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords).toContain('n8n-community-node-package');
  });

  test('package.json includes nodes and credentials under the n8n attribute', () => {
    expect(pkg).toHaveProperty('n8n');

    const nodes = pkg?.n8n?.nodes;
    const credentials = pkg?.n8n?.credentials;

    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);

    expect(Array.isArray(credentials)).toBe(true);
    expect(credentials.length).toBeGreaterThan(0);
  });
});
