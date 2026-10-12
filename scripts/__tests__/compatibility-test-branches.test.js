import { describe, expect, it, jest } from '@jest/globals';

import { CompatibilityTester } from '../compatibility-test.mjs';

const newResults = () => ({
  compatibility: { issues: [], recommendations: [], warnings: [] },
  dependencies: {},
});

describe('compatibilityTester branch coverage', () => {
  it('analyzeDependencies tolerates results without issues/warnings arrays', async () => {
    const tester = new CompatibilityTester();
    jest
      .spyOn(tester, 'checkDependencyCompatibility')
      .mockResolvedValue({ compatible: true });
    const results = newResults();

    await tester.analyzeDependencies(
      { dependencies: { 'some-dep': '1.0.0' } },
      results,
    );

    expect(results.compatibility.issues).toStrictEqual([]);
    expect(results.compatibility.warnings).toStrictEqual([]);
    expect(results.dependencies['some-dep']).toStrictEqual({
      compatibility: { compatible: true },
      version: '1.0.0',
    });
  });

  it('analyzeDependencies aggregates issues and warnings when present', async () => {
    const tester = new CompatibilityTester();
    jest.spyOn(tester, 'checkDependencyCompatibility').mockResolvedValue({
      issues: ['an issue'],
      warnings: ['a warning'],
    });
    const results = newResults();

    await tester.analyzeDependencies(
      { dependencies: { a: '1.0.0' }, devDependencies: { b: '2.0.0' } },
      results,
    );

    expect(results.compatibility.issues).toStrictEqual([
      'an issue',
      'an issue',
    ]);
    expect(results.compatibility.warnings).toStrictEqual([
      'a warning',
      'a warning',
    ]);
  });

  it('checkDependencyCompatibility warns on potential circular dependency', async () => {
    const tester = new CompatibilityTester();
    jest.spyOn(tester, 'detectPotentialCircularDeps').mockReturnValue(true);

    const result = await tester.checkDependencyCompatibility(
      'unknown-dep',
      '1.2.3',
      { 'unknown-dep': '1.2.3' },
    );

    expect(result.warnings).toContain(
      'Potential circular dependency involving unknown-dep',
    );
  });
});
