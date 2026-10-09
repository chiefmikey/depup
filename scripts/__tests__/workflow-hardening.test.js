/**
 * Static hardening checks for the issue-driven publish workflows.
 * Reads the workflow files as text (and parses them when a YAML parser is
 * available) and asserts the security/robustness properties we rely on.
 * Regexes are extracted from the workflow text so tests and workflow cannot drift.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from '@jest/globals';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const readWorkflow = (name) =>
  readFileSync(path.join(repoRoot, '.github', 'workflows', name), 'utf8');

const requestText = readWorkflow('process-package-request.yml');
const secureText = readWorkflow('depup-secure.yml');

// YAML parser comes from the lockfile (transitive dependency); prefer js-yaml, then yaml.
const loadYamlParse = async () => {
  const jsYaml = await import('js-yaml').catch(() => null);
  if (jsYaml) {
    return (text) => (jsYaml.load ?? jsYaml.default.load)(text);
  }
  const yaml = await import('yaml');
  return (text) => (yaml.parse ?? yaml.default.parse)(text);
};
const parseYaml = await loadYamlParse();

const requestDocument = parseYaml(requestText);
const secureDocument = parseYaml(secureText);

// Build a GitHub expression marker without a literal dollar-brace string.
const exprOpen = `\${{`;
const secretsOpen = `${exprOpen} secrets.`;
const expr = (inner) => `${exprOpen} ${inner} }}`;

const stepsOf = (document_) =>
  Object.values(document_.jobs).flatMap((job) => job.steps);

// Return the text of a "- name: <stepName>" block up to the next step.
const stepBlock = (text, stepName) => {
  const lines = text.split('\n');
  const start = lines.findIndex((line) =>
    line.trim().startsWith(`- name: ${stepName}`),
  );
  if (start === -1) {
    throw new Error(`step not found: ${stepName}`);
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.trim().startsWith('- name:'));
  return [lines[start], ...(end === -1 ? rest : rest.slice(0, end))].join('\n');
};

// Turn a "/source/flags" regex literal found in the workflow text into a RegExp.
const toRegExp = (literal) => {
  const split = literal.lastIndexOf('/');
  return new RegExp(literal.slice(1, split), literal.slice(split + 1));
};

const safePattern = toRegExp(
  /const safePattern = (\/.*\/[a-z]*);/u.exec(requestText)[1],
);
const bodyPattern = toRegExp(
  /issueBody\.match\((\/### Package Name.*\/[a-z]*)\);/u.exec(requestText)[1],
);
const bashRegex = /[=]~ (\^\(@\[.*\$) \]\]/u.exec(requestText)[1];

// Mirrors the Parse Issue Content step: capture from the body, then validate.
const parseName = (rawValue, eol = '\n') => {
  const body = `### Package Name${eol}${eol}${rawValue}${eol}${eol}### NPM Package URL${eol}${eol}https://x.test${eol}`;
  const match = body.match(bodyPattern);
  const name = match ? match[1].trim() : '';
  const accepted =
    name !== '' && name !== '.' && name !== '..' && safePattern.test(name);
  return { accepted, name };
};

const bashAccepts = (name) => {
  try {
    execFileSync('bash', ['-c', '[[ "$1" =~ $2 ]]', '_', name, bashRegex]);
    return true;
  } catch {
    return false;
  }
};

describe('process-package-request.yml', () => {
  describe('secrets handling', () => {
    it('never interpolates secrets into run scripts (line scan)', () => {
      const allowedMapping = /^\s*[\w-]+:\s*\$\{\{\s*secrets\.\w+\s*\}\}\s*$/u;
      const offenders = requestText
        .split('\n')
        .filter((line) => line.includes(secretsOpen))
        .filter((line) => !allowedMapping.test(line));

      expect(offenders).toStrictEqual([]);
    });

    it('has no secrets expression inside any run block', () => {
      const runs = stepsOf(requestDocument)
        .map((step) => step.run)
        .filter(Boolean);

      expect(runs.length).toBeGreaterThan(0);

      for (const run of runs) {
        expect(run).not.toContain(secretsOpen);
        expect(run).not.toMatch(/\$\{\{\s*secrets\./u);
      }
    });

    it('imports the GPG key from env, keeps if: always(), fails on empty', () => {
      const block = stepBlock(requestText, 'Import GPG Key');

      expect(block).toContain('if: always()');
      expect(block).toContain(
        `GPG_PRIVATE_KEY: ${expr('secrets.GPG_PRIVATE_KEY')}`,
      );
      expect(block).toContain(
        String.raw`printf '%s\n' "$GPG_PRIVATE_KEY" | gpg --batch --import`,
      );
      expect(block).toContain('[ -z "$GPG_PRIVATE_KEY" ]');
    });

    it('verifies NPM_TOKEN before the publish step', () => {
      const whoami = requestText.indexOf('- name: Verify npm auth');
      const publish = requestText.indexOf(
        '- name: Process and Publish Package',
      );

      expect(whoami).toBeGreaterThan(-1);
      expect(whoami).toBeLessThan(publish);

      const block = stepBlock(requestText, 'Verify npm auth');

      expect(block).toContain(`NODE_AUTH_TOKEN: ${expr('secrets.NPM_TOKEN')}`);
      expect(block).toContain('npm whoami');
      expect(block).toContain('::error::');
    });
  });

  describe('concurrency and label gating', () => {
    it('does not cancel in-flight publishes', () => {
      expect(requestText).toMatch(/cancel-in-progress:\s*false/u);
      expect(requestText).not.toMatch(/cancel-in-progress:\s*true/u);
    });

    it('only runs for the package-request label event', () => {
      expect(requestText).toContain(
        "github.event.label.name == 'package-request'",
      );
    });

    it('parsed concurrency and job if agree', () => {
      expect(requestDocument.concurrency['cancel-in-progress']).toBe(false);

      const job = requestDocument.jobs['validate-and-process'];

      expect(job.if).toContain("github.event.label.name == 'package-request'");
      expect(job.if).toContain(
        "contains(github.event.issue.labels.*.name, 'package-request')",
      );
    });
  });

  describe('package name validation', () => {
    const accepted = ['lodash', '`lodash`', '@scope/pkg', 'a.b-c_d', 'Foo9'];
    const rejected = [
      'lodash evil',
      '..',
      '.',
      '-x',
      '@a/b/c',
      '@/pkg',
      '@scope/',
      'a/b',
      '.hidden',
      '_No response_',
    ];

    it.each(accepted)('jS parse + validation accepts %s', (value) => {
      const { accepted: ok, name } = parseName(value);

      expect(ok).toBe(true);
      expect(name).toBe(value.replaceAll('`', ''));
    });

    it.each(rejected)('jS parse + validation rejects %s', (value) => {
      expect(parseName(value).accepted).toBe(false);
    });

    it('does not truncate "lodash evil" to "lodash"', () => {
      expect(parseName('lodash evil').name).not.toBe('lodash');
    });

    it('accepts a CRLF-terminated issue body value', () => {
      expect(parseName('lodash', '\r\n')).toStrictEqual({
        accepted: true,
        name: 'lodash',
      });
    });

    it('is no stricter than add-package for legitimate names', () => {
      for (const name of ['lodash', '@types/node', 'a_b', 'A.B', '0x']) {
        expect(safePattern.test(name)).toBe(true);
      }
    });

    it.each(['lodash', '@scope/pkg', 'a.b-c_d'])(
      'bash regex accepts %s',
      (v) => {
        expect(bashAccepts(v)).toBe(true);
      },
    );

    it.each(['..', '.', '-x', '.x', '@a/b/c', '@scope/', '@/p', 'a/b'])(
      'bash regex rejects %s',
      (v) => {
        expect(bashAccepts(v)).toBe(false);
      },
    );

    it('rejects "." and ".." explicitly in bash and JS', () => {
      expect(requestText).toContain('[ "$PACKAGE_NAME" = "." ]');
      expect(requestText).toContain('[ "$PACKAGE_NAME" = ".." ]');
      expect(requestText).toContain("packageName === '..'");
    });
  });

  describe('error visibility', () => {
    it('does not discard stderr of add-package, depup or git add', () => {
      const offenders = requestText
        .split('\n')
        .filter((line) => line.includes('2>/dev/null'))
        .filter((line) =>
          /add-package|depup\.mjs|git add|npm view/u.test(line),
        );

      expect(offenders).toStrictEqual([]);
    });

    it('keeps npm view stderr in a file and prints its tail on failure', () => {
      expect(requestText).toContain('2> "$NPM_STDERR"');
      expect(requestText).toContain('tail -n 5 "$NPM_STDERR"');
    });

    it('turns swallowed comment errors into annotations', () => {
      expect(requestText).toContain('core.warning(');
      expect(requestText).not.toContain(
        "console.log('Could not create comment",
      );
    });

    it('comment step reads outcomes from env only', () => {
      const step = stepsOf(requestDocument).find(
        (candidate) => candidate.name === 'Comment on Issue',
      );

      expect(step.env.QUEUE_OUTCOME).toBe(expr('steps.queue.outcome'));
      expect(step.env.PUBLISH_OUTCOME).toBe(expr('steps.publish.outcome'));
      expect(step.env.COMMIT_OUTCOME).toBe(expr('steps.commit.outcome'));
      expect(step.with.script).not.toContain(exprOpen);
      expect(step.with.script).toContain('process.env.QUEUE_OUTCOME');

      const ids = stepsOf(requestDocument)
        .map((candidate) => candidate.id)
        .filter(Boolean);

      expect(ids).toStrictEqual(
        expect.arrayContaining(['publish', 'commit', 'queue']),
      );
    });

    it('only claims queuing when the queue step succeeded', () => {
      expect(requestText).toContain("process.env.QUEUE_OUTCOME === 'success'");
      expect(requestText).toContain("jobStatus === 'cancelled'");
    });
  });

  describe('unchanged guarantees', () => {
    it('triggers only on issues labeled', () => {
      const lines = requestText.split('\n');
      const start = lines.indexOf('on:');
      const block = [];
      for (const line of lines.slice(start + 1)) {
        if (line !== '' && !line.startsWith(' ')) {
          break;
        }
        if (line.trim() !== '') {
          block.push(line.trim());
        }
      }

      expect(block).toStrictEqual(['issues:', 'types: [labeled]']);
    });

    it('parsed triggers are exactly issues: labeled', () => {
      const trigger = requestDocument.on ?? requestDocument.true;

      expect(trigger).toStrictEqual({ issues: { types: ['labeled'] } });
    });

    it('permissions remain contents: write only', () => {
      expect(requestDocument.permissions).toStrictEqual({ contents: 'write' });
    });

    it('keeps every action pinned by commit SHA', () => {
      const uses = requestText
        .split('\n')
        .filter((line) => line.trim().startsWith('uses:'));

      expect(uses.length).toBeGreaterThan(0);

      for (const line of uses) {
        expect(line).toMatch(/@[\da-f]{40}\b/u);
      }
    });

    it('does not set persist-credentials (push steps need checkout creds)', () => {
      expect(requestText).not.toContain('persist-credentials');
    });
  });
});

describe('depup-secure.yml', () => {
  it.each(['Upload security reports', 'Upload processing reports'])(
    '%s runs even when earlier steps fail',
    (stepName) => {
      expect(stepBlock(secureText, stepName)).toContain('if: always()');
    },
  );

  it('does not echo the raw docker args (token env value)', () => {
    expect(secureText).not.toMatch(/echo "Running: docker \$\{DOCKER_ARGS/u);
    expect(secureText).toContain('NODE_AUTH_TOKEN=***');
  });

  it('redacts the token in the echoed docker args', () => {
    // Run the redaction + echo lines exactly as written in the workflow.
    const redactLine = /^\s*(SAFE_ARGS=.*)$/mu.exec(secureText)[1];
    const echoLine = /^\s*(echo "Running: docker .*)$/mu.exec(secureText)[1];
    const script = [
      String.raw`DOCKER_ARGS=(run -e NPM_TOKEN "-e" "NODE_AUTH_TOKEN=$NPM_TOKEN" img pkg)`,
      redactLine,
      echoLine,
    ].join('\n');
    const output = execFileSync('bash', ['-c', script], {
      env: { ...process.env, NPM_TOKEN: 'super-secret-token' },
    }).toString();

    expect(output).not.toContain('super-secret-token');
    expect(output).toContain('NODE_AUTH_TOKEN=***');
  });

  it('both workflows are valid YAML with parseable jobs', () => {
    expect(Object.keys(secureDocument.jobs).length).toBeGreaterThan(0);
    expect(Object.keys(requestDocument.jobs)).toStrictEqual([
      'validate-and-process',
    ]);
  });
});
