/**
 * Static hardening checks for the issue-driven publish workflows.
 * Reads the workflow files as text (and parses them when a YAML parser is
 * available) and asserts the security/robustness properties we rely on.
 * Regexes are extracted from the workflow text so tests and workflow cannot drift.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from '@jest/globals';

import * as rateLimitModule from '../request-rate-limit.mjs';

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

const jobOf = (name) => requestDocument.jobs[name];
const stepNamed = (job, name) => job.steps.find((step) => step.name === name);
const runsOf = (job) => job.steps.map((step) => step.run).filter(Boolean);

// Every distinct `secrets.NAME` a parsed job refers to, sorted.
const secretsOf = (job) =>
  [
    ...new Set(
      [...JSON.stringify(job).matchAll(/secrets\.(\w+)/gu)].map(
        (match) => match[1],
      ),
    ),
  ].toSorted();

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
      const publish = requestText.indexOf('- name: Publish Staged Package');

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

      const job = jobOf('gate');

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
      expect(step.env.PUBLISH_OUTCOME).toBe(
        expr('needs.publish.outputs.publish_outcome'),
      );
      expect(step.env.PUBLISH_RESULT).toBe(expr('needs.publish.result'));
      expect(step.env.TEST_FAILED).toBe(
        expr('needs.process.outputs.test_failed'),
      );
      expect(step.env.COMMIT_OUTCOME).toBe(expr('steps.commit.outcome'));
      expect(step.with.script).not.toContain(exprOpen);
      expect(step.with.script).toContain('process.env.QUEUE_OUTCOME');

      const ids = stepsOf(requestDocument)
        .map((candidate) => candidate.id)
        .filter(Boolean);

      expect(ids).toStrictEqual(
        expect.arrayContaining(['stage', 'publish', 'commit', 'queue']),
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

    it('only the commit job can write; everything else is read-only', () => {
      expect(requestDocument.permissions).toStrictEqual({ contents: 'read' });
      expect(jobOf('gate').permissions).toStrictEqual({
        contents: 'read',
        issues: 'write',
      });
      expect(jobOf('process').permissions).toStrictEqual({ contents: 'read' });
      expect(jobOf('commit').permissions).toStrictEqual({
        contents: 'write',
        issues: 'write',
      });
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

    it('commit checkout keeps its credential (push steps need it)', () => {
      const checkout = stepNamed(jobOf('commit'), 'Checkout');

      expect(checkout.with['persist-credentials']).toBeUndefined();
      expect(checkout.with.token).toBe(expr('secrets.GITHUB_TOKEN'));
    });
  });

  describe('author trust gate', () => {
    const gateStep = stepNamed(jobOf('gate'), 'Check Submitter Trust');
    const gateScript = gateStep.with.script;
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Run the gate script exactly as written, against a mocked GitHub client.
    const runGate = async ({
      ageDays = 400,
      association = 'NONE',
      author = 'someone',
      authorType = 'User',
      createdAt,
      permission = 'none',
      permissionError = false,
      recentIssues = [],
      sender = 'someone',
      userError = false,
    } = {}) => {
      const outputs = {};
      const failures = [];
      const calls = [];
      const imported = [];
      const runnableScript = gateScript.replaceAll(
        'await import(',
        'await importModule(',
      );
      const sandbox = {
        console: { log() {} },
        context: { repo: { owner: 'owner', repo: 'repo' } },
        core: {
          setFailed: (message) => failures.push(message),
          setOutput: (key, value) => {
            outputs[key] = value;
          },
          warning() {},
        },
        github: {
          rest: {
            issues: {
              listForRepo: async () => ({ data: recentIssues }),
            },
            repos: {
              getCollaboratorPermissionLevel: async ({ username }) => {
                calls.push(`permission:${username}`);
                if (permissionError) {
                  throw new Error('permission lookup failed');
                }
                return { data: { permission } };
              },
            },
            users: {
              getByUsername: async ({ username }) => {
                calls.push(`user:${username}`);
                if (userError) {
                  throw new Error('user lookup failed');
                }
                return {
                  data: {
                    created_at:
                      createdAt ??
                      new Date(Date.now() - ageDays * DAY_MS).toISOString(),
                    type: authorType,
                  },
                };
              },
            },
          },
        },
        // A vm context has no dynamic import(): the script is run with its
        // import() call routed to this shim, which hands back the real module.
        importModule: async (specifier) => {
          imported.push(specifier);
          return rateLimitModule;
        },
        process: {
          env: {
            AUTHOR_ASSOCIATION: association,
            AUTHOR_LOGIN: author,
            AUTHOR_TYPE: authorType,
            GITHUB_WORKSPACE: repoRoot,
            ISSUE_NUMBER: '1',
            SENDER_LOGIN: sender,
          },
        },
      };
      await vm.runInNewContext(
        `(async () => {\n${runnableScript}\n})()`,
        sandbox,
      );
      return {
        calls,
        failures: failures.length,
        imported,
        outputs: { ...outputs },
      };
    };

    it('is the first job and gates every later job on allowed == true', () => {
      expect(Object.keys(requestDocument.jobs)[0]).toBe('gate');
      expect(jobOf('gate').outputs.allowed).toBe(
        expr('steps.gate.outputs.allowed'),
      );
      expect(jobOf('process').needs).toBe('gate');
      expect(jobOf('process').if).toBe("needs.gate.outputs.allowed == 'true'");
      // publish only runs after a successful process job, which itself only
      // runs when the gate allowed the request.
      expect(jobOf('publish').needs).toStrictEqual(['gate', 'process']);
      expect(jobOf('publish').if).toBe("needs.process.result == 'success'");
      expect(jobOf('commit').needs).toStrictEqual([
        'gate',
        'process',
        'publish',
      ]);
      expect(jobOf('commit').if).toContain(
        "needs.gate.outputs.allowed == 'true'",
      );
    });

    it('keeps the label gate on the gate job so other labels start nothing', () => {
      expect(jobOf('gate').if).toContain(
        "github.event.label.name == 'package-request'",
      );
      expect(jobOf('process').if).not.toContain('label');
    });

    it('passes event data through env only, never into the script text', () => {
      expect(gateScript).not.toContain(exprOpen);
      expect(gateStep.env.AUTHOR_ASSOCIATION).toBe(
        expr('github.event.issue.author_association'),
      );
      expect(gateStep.env.AUTHOR_LOGIN).toBe(
        expr('github.event.issue.user.login'),
      );
    });

    describe('per-author rate cap', () => {
      const recent = (count, login = 'someone') =>
        Array.from({ length: count }, (_, index) => ({
          created_at: new Date(Date.now() - 60_000).toISOString(),
          number: 100 + index,
          user: { login },
        }));

      it('allows an established account under the cap', async () => {
        const result = await runGate({ recentIssues: recent(4) });

        expect(result.outputs.allowed).toBe('true');
        expect(result.outputs.reason).toBe('account_age');
        expect(result.imported).toStrictEqual([
          `${repoRoot}/scripts/request-rate-limit.mjs`,
        ]);
      });

      it('denies an established account at the cap without failing the job', async () => {
        const result = await runGate({ recentIssues: recent(5) });

        expect(result.outputs).toStrictEqual({
          allowed: 'false',
          reason: 'rate_limited',
        });
        expect(result.failures).toBe(0);
      });

      it('gives members a higher cap', async () => {
        const under = await runGate({
          association: 'MEMBER',
          recentIssues: recent(24),
        });
        const over = await runGate({
          association: 'MEMBER',
          recentIssues: recent(25),
        });

        expect(under.outputs.allowed).toBe('true');
        expect(over.outputs.reason).toBe('rate_limited');
      });

      it('lets a maintainer relabel bypass the cap', async () => {
        const result = await runGate({
          permission: 'write',
          recentIssues: recent(50),
          sender: 'maintainer',
        });

        expect(result.outputs.reason).toBe('maintainer_label');
      });
    });

    it('checks out only the rate cap module, holds no secret, comments with the workflow token', () => {
      const checkouts = jobOf('gate').steps.filter((step) =>
        (step.uses ?? '').startsWith('actions/checkout'),
      );

      expect(checkouts).toHaveLength(1);
      expect(checkouts[0].with['persist-credentials']).toBe(false);
      expect(checkouts[0].with['sparse-checkout']).toBe(
        'scripts/request-rate-limit.mjs',
      );
      expect(secretsOf(jobOf('gate'))).toStrictEqual([]);
      expect(runsOf(jobOf('gate'))).toStrictEqual([]);
    });

    it('denies by default before any rule can allow', () => {
      const denyFirst = gateScript.indexOf(
        "core.setOutput('allowed', 'false')",
      );

      expect(denyFirst).toBeGreaterThan(-1);
      expect(denyFirst).toBeLessThan(gateScript.indexOf('finish(true'));
    });

    it('posts a denial comment, leaves the issue open, never closes it', () => {
      const denial = stepNamed(jobOf('gate'), 'Explain Denied Request');

      expect(denial.if).toContain("steps.gate.outputs.allowed != 'true'");
      expect(denial.with['github-token']).toBeUndefined();
      expect(denial.with.script).toContain('createComment');
      expect(denial.with.script).toContain('left open');
      expect(denial.with.script).not.toContain("state: 'closed'");
    });

    it.each(['OWNER', 'MEMBER', 'COLLABORATOR'])(
      'allows a %s author without any lookup',
      async (association) => {
        const result = await runGate({ association });

        expect(result.outputs.allowed).toBe('true');
        expect(result.calls).toStrictEqual([]);
      },
    );

    it.each(['NONE', 'CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN'])(
      'does not trust the %s association by itself',
      async (association) => {
        const result = await runGate({ ageDays: 1, association });

        expect(result.outputs.allowed).toBe('false');
      },
    );

    it('allows an established account', async () => {
      const result = await runGate({ ageDays: 400 });

      expect(result.outputs).toStrictEqual({
        allowed: 'true',
        reason: 'account_age',
      });
    });

    it('denies a new account', async () => {
      const result = await runGate({ ageDays: 3 });

      expect(result.outputs).toStrictEqual({
        allowed: 'false',
        reason: 'new_account',
      });
      expect(result.failures).toBe(0);
    });

    it('draws the account age line at 30 days', async () => {
      const older = await runGate({ ageDays: 30.01 });
      const younger = await runGate({ ageDays: 29.9 });

      expect(older.outputs.allowed).toBe('true');
      expect(younger.outputs.allowed).toBe('false');
    });

    it('denies bots without an account lookup', async () => {
      const typed = await runGate({ authorType: 'Bot' });
      const named = await runGate({ author: 'robot[bot]' });

      expect(typed.outputs).toStrictEqual({ allowed: 'false', reason: 'bot' });
      expect(named.outputs).toStrictEqual({ allowed: 'false', reason: 'bot' });
      expect(
        typed.calls.filter((call) => call.startsWith('user:')),
      ).toHaveLength(0);
    });

    it('allows a maintainer re-applying the label on a new account', async () => {
      const result = await runGate({
        ageDays: 1,
        permission: 'write',
        sender: 'maintainer',
      });

      expect(result.outputs).toStrictEqual({
        allowed: 'true',
        reason: 'maintainer_label',
      });
      expect(result.calls).toStrictEqual(['permission:maintainer']);
    });

    it('does not let a read-only labeler approve a new account', async () => {
      const result = await runGate({ ageDays: 1, permission: 'read' });

      expect(result.outputs.allowed).toBe('false');
    });

    it('fails closed when the account lookup errors', async () => {
      const result = await runGate({ userError: true });

      expect(result.outputs).toStrictEqual({
        allowed: 'false',
        reason: 'lookup_error',
      });
      expect(result.failures).toBe(1);
    });

    it('fails closed when the permission and account lookups both error', async () => {
      const result = await runGate({ permissionError: true, userError: true });

      expect(result.outputs.allowed).toBe('false');
      expect(result.failures).toBe(1);
    });

    it('fails closed on an unusable creation date or missing author', async () => {
      const badDate = await runGate({ createdAt: 'not-a-date' });
      const noAuthor = await runGate({ author: '' });

      for (const result of [badDate, noAuthor]) {
        expect(result.outputs).toStrictEqual({
          allowed: 'false',
          reason: 'lookup_error',
        });
        expect(result.failures).toBe(1);
      }
    });

    it('still denies when only the permission lookup errors', async () => {
      const result = await runGate({ ageDays: 1, permissionError: true });

      expect(result.outputs.allowed).toBe('false');
    });
  });

  describe('untrusted processing is split from secret-bearing steps', () => {
    const processJob = jobOf('process');
    const commitJob = jobOf('commit');

    const withTemporaryDirectory = (callback) => {
      const directory = mkdtempSync(path.join(tmpdir(), 'workflow-step-'));
      try {
        return callback(directory);
      } finally {
        rmSync(directory, { force: true, recursive: true });
      }
    };

    // Run a workflow step's script in bash, inside the temp directory. `prelude`
    // defines shell functions (e.g. a stub `node`) that win over any PATH lookup.
    const runStep = (
      step,
      directory,
      { environment = {}, prelude = '' } = {},
    ) => {
      const output = path.join(directory, 'step-output');
      writeFileSync(output, '');
      const result = spawnSync(
        'bash',
        ['--noprofile', '--norc', '-e', '-c', `${prelude}\n${step.run}`],
        {
          cwd: directory,
          encoding: 'utf8',
          env: {
            GITHUB_OUTPUT: output,
            PATH: process.env.PATH,
            RUNNER_TEMP: directory,
            ...environment,
          },
        },
      );
      return { output: readFileSync(output, 'utf8'), status: result.status };
    };

    it('process job references no secret at all', () => {
      expect(secretsOf(processJob)).toStrictEqual([]);

      const text = JSON.stringify(processJob);

      expect(text).not.toContain('NPM_TOKEN');
      expect(text).not.toContain('NODE_AUTH_TOKEN');
      expect(text).not.toContain('BOT_PAT');
      expect(text).not.toContain('GPG_PRIVATE_KEY');
      expect(text).not.toContain('gpg ');
      // setup-node's registry-url would export a placeholder NODE_AUTH_TOKEN,
      // which stage mode refuses.
      expect(
        stepNamed(processJob, 'Setup Node.js').with['registry-url'],
      ).toBeUndefined();
    });

    it('publish job holds NPM_TOKEN and nothing else, and runs no package code', () => {
      const publishJob = jobOf('publish');

      expect(secretsOf(publishJob)).toStrictEqual(['NPM_TOKEN']);
      expect(publishJob.permissions).toStrictEqual({ contents: 'read' });
      expect(
        stepNamed(publishJob, 'Checkout Publisher').with['persist-credentials'],
      ).toBe(false);

      const runs = runsOf(publishJob).join('\n');

      expect(runs).not.toContain('depup.mjs');
      expect(runs).not.toMatch(/\bnpm (?:ci|install|i|view|run|test)\b/u);
      expect(runs).not.toMatch(/git (?:push|commit|config)/u);

      // Only the publish step itself sees the token; it is not a job-level env.
      expect(JSON.stringify(publishJob.env ?? {})).not.toContain('NPM_TOKEN');
      expect(stepNamed(publishJob, 'Publish Staged Package').env).toStrictEqual(
        {
          NODE_AUTH_TOKEN: expr('secrets.NPM_TOKEN'),
          PACKAGE_NAME: expr('needs.process.outputs.package_name'),
        },
      );
    });

    it('process job checks out without persisting the credential', () => {
      const checkout = stepNamed(processJob, 'Checkout');

      expect(checkout.with['persist-credentials']).toBe(false);
      expect(checkout.with.token).toBeUndefined();
      expect(processJob.permissions).toStrictEqual({ contents: 'read' });
    });

    it('process job never pushes or signs', () => {
      for (const run of runsOf(processJob)) {
        expect(run).not.toMatch(/git (?:push|commit|config)/u);
      }
    });

    it('commit job holds no NPM_TOKEN and never executes package code', () => {
      expect(secretsOf(commitJob)).toStrictEqual([
        'GITHUB_TOKEN',
        'GPG_PRIVATE_KEY',
      ]);

      const runs = runsOf(commitJob).join('\n');

      expect(runs).not.toContain('depup.mjs');
      expect(runs).not.toMatch(/\bnpm (?:ci|install|i|publish|view|run)\b/u);
      expect(runs).not.toMatch(/\bnpx\b/u);

      const scripts = [...runs.matchAll(/node scripts\/([\w-]+\.mjs)/gu)].map(
        (match) => match[1],
      );

      // add-package.mjs and staged-publish.mjs (finalize-integrity) use only
      // Node built-ins; neither executes package code.
      expect(scripts.length).toBeGreaterThan(0);
      expect(new Set(scripts)).toStrictEqual(
        new Set(['add-package.mjs', 'staged-publish.mjs']),
      );
      expect(JSON.stringify(commitJob)).not.toContain('NPM_TOKEN');
      expect(JSON.stringify(commitJob)).not.toContain('NODE_AUTH_TOKEN');
    });

    it('commit job installs no dependencies and no npm registry auth', () => {
      const setupNode = stepNamed(commitJob, 'Setup Node.js');

      expect(setupNode.with['registry-url']).toBeUndefined();
    });

    it('commit job stages only the validated package path', () => {
      const { run } = stepNamed(commitJob, 'Commit and Push');

      expect(run).toContain('git add -- "$destination"');
      expect(run).not.toMatch(/git add (?:-A|\.|packages\/?\s)/u);
    });

    it('commit job runs on failure but only after the process and publish jobs', () => {
      expect(commitJob.needs).toContain('process');
      expect(commitJob.needs).toContain('publish');
      expect(commitJob.if).toContain('always()');
      expect(stepNamed(commitJob, 'Import GPG Key').if).toBe('always()');
    });

    it('commits only what the publish job confirmed', () => {
      const commit = stepNamed(commitJob, 'Commit and Push');
      const record = stepNamed(commitJob, 'Record Publish Result');

      expect(commit.if).toContain("needs.publish.result == 'success'");
      expect(record.if).toContain("needs.publish.result == 'success'");
      expect(record.run).toContain('finalize-integrity');
      expect(record.run).toContain('--require-results');
      // Recorded before the commit step copies the data into place.
      expect(commitJob.steps.indexOf(record)).toBeLessThan(
        commitJob.steps.indexOf(commit),
      );
    });

    it('hands the staged tarball, package data and publish results over as run-scoped artifacts', () => {
      const pairs = [
        [processJob, 'Upload Package Data', commitJob, 'Download Package Data'],
        [
          processJob,
          'Upload Staged Package',
          jobOf('publish'),
          'Download Staged Package',
        ],
        [
          jobOf('publish'),
          'Upload Publish Results',
          commitJob,
          'Download Publish Results',
        ],
      ];
      for (const [producer, upload, consumer, download] of pairs) {
        const up = stepNamed(producer, upload);
        const down = stepNamed(consumer, download);

        expect(up.with.name).toBe(down.with.name);
        expect(up.with.name).toContain('github.run_id');
      }

      expect(stepNamed(processJob, 'Upload Package Data').if).toBe(
        "steps.stage.outcome == 'success'",
      );
      expect(stepNamed(commitJob, 'Download Package Data').if).toContain(
        "needs.process.result == 'success'",
      );
    });

    it('exposes only runner-set outcomes and parse outputs from the process job', () => {
      expect(processJob.outputs).toStrictEqual({
        exists: expr('steps.check-existing.outputs.exists'),
        gate_blocked: expr('steps.stage.outputs.gate_blocked'),
        npm_outcome: expr('steps.npm-info.outcome'),
        package_name: expr('steps.parse.outputs.package_name'),
        parse_outcome: expr('steps.parse.outcome'),
        test_failed: expr('steps.stage.outputs.test_failed'),
        validate_outcome: expr('steps.validate-package-name.outcome'),
      });
      expect(jobOf('publish').outputs).toStrictEqual({
        publish_outcome: expr('steps.publish.outcome'),
      });
    });

    it.each([
      [0, 0, false, false],
      [3, 3, true, false],
      [4, 4, false, true],
      [1, 1, false, false],
    ])(
      'stage step maps depup exit %i to step status %i, test_failed=%s, gate_blocked=%s',
      (code, status, testFailed, gateBlocked) => {
        const step = stepNamed(processJob, 'Process and Stage Package');
        const result = withTemporaryDirectory((directory) =>
          runStep(step, directory, {
            environment: { PACKAGE_NAME: 'lodash' },
            prelude: `node() { return ${code}; }`,
          }),
        );

        expect(result.status).toBe(status);
        expect(result.output.includes('test_failed=true')).toBe(testFailed);
        expect(result.output.includes('gate_blocked=true')).toBe(gateBlocked);
      },
    );

    it('stage step passes --stage-only and never --publish', () => {
      const { run } = stepNamed(processJob, 'Process and Stage Package');

      expect(run).toContain('--stage-only "$RUNNER_TEMP/stage"');
      expect(run).not.toContain('--publish');
    });

    it('does not queue a verification failure for retry and says so', () => {
      const queue = stepNamed(commitJob, 'Queue for Retry on Failure');

      expect(queue.if).toContain("needs.process.outputs.test_failed != 'true'");
      expect(queue.if).toContain(
        "needs.process.outputs.npm_outcome == 'success'",
      );
      expect(queue.if).toContain("needs.process.outputs.exists == 'false'");
      expect(queue.if).toContain("needs.process.result == 'failure'");

      const comment = stepNamed(commitJob, 'Comment on Issue').with.script;

      expect(comment).toContain("process.env.TEST_FAILED === 'true'");
      expect(comment).toContain('failed verification and was not published');
      expect(comment).toContain('not queued for automatic retry');
    });

    it('closes the issue only when every job succeeded', () => {
      const close = stepNamed(commitJob, 'Close Issue on Success');

      expect(close.if).toBe(
        "success() && needs.process.result == 'success' && needs.publish.result == 'success'",
      );
    });

    it('queues a transient publish failure for retry', () => {
      const queue = stepNamed(commitJob, 'Queue for Retry on Failure');

      expect(queue.if).toContain("needs.publish.result == 'failure'");
    });

    describe('package name re-validation in the commit job', () => {
      const step = stepNamed(commitJob, 'Re-validate Package Name');
      const check = (name) =>
        withTemporaryDirectory((directory) =>
          runStep(step, directory, { environment: { PACKAGE_NAME: name } }),
        );

      it.each(['lodash', '@types/node', 'a.b-c_d'])('accepts %s', (name) => {
        const result = check(name);

        expect(result.status).toBe(0);
        expect(result.output).toContain('valid=true');
      });

      it.each(['a..b', '..', '@a/b/c', '-x', 'a b', '@scope/', 'a/b'])(
        'rejects %s',
        (name) => {
          const result = check(name);

          expect(result.status).not.toBe(0);
          expect(result.output).not.toContain('valid=true');
        },
      );

      it('skips cleanly when the process job produced no name', () => {
        const result = check('');

        expect(result.status).toBe(0);
        expect(result.output).toContain('valid=false');
      });
    });

    describe('untrusted artifact validation', () => {
      const step = stepNamed(commitJob, 'Validate Package Data');
      const validate = (populate) =>
        withTemporaryDirectory((directory) => {
          const incoming = path.join(directory, 'incoming');
          mkdirSync(path.join(incoming, '1.0.0', 'rev-0'), { recursive: true });
          writeFileSync(path.join(incoming, 'README.md'), 'readme');
          populate(incoming);
          return runStep(step, directory);
        });

      it('accepts plain files and directories', () => {
        const result = validate((incoming) => {
          writeFileSync(
            path.join(incoming, '1.0.0', 'rev-0', 'package.json'),
            '{}',
          );
        });

        expect(result.status).toBe(0);
      });

      it('rejects symlinks', () => {
        const result = validate((incoming) => {
          symlinkSync('/etc', path.join(incoming, 'link'));
        });

        expect(result.status).not.toBe(0);
      });

      it('rejects dangling symlinks', () => {
        const result = validate((incoming) => {
          symlinkSync('../../nowhere', path.join(incoming, 'link'));
        });

        expect(result.status).not.toBe(0);
      });

      it.each(['.git', '.gitmodules', '.gitattributes'])(
        'rejects a %s entry',
        (name) => {
          const result = validate((incoming) => {
            mkdirSync(path.join(incoming, '1.0.0', name), { recursive: true });
          });

          expect(result.status).not.toBe(0);
        },
      );

      it('rejects control characters in names', () => {
        const result = validate((incoming) => {
          writeFileSync(path.join(incoming, 'bad\u0001name'), 'x');
        });

        expect(result.status).not.toBe(0);
      });

      it('rejects an empty artifact', () => {
        const result = withTemporaryDirectory((directory) => {
          mkdirSync(path.join(directory, 'incoming'));
          return runStep(step, directory);
        });

        expect(result.status).not.toBe(0);
      });

      it('rejects a missing download directory', () => {
        const result = withTemporaryDirectory((directory) =>
          runStep(step, directory),
        );

        expect(result.status).not.toBe(0);
      });
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

  it('the sandbox container is started without any credential', () => {
    const run = secureDocument.jobs['secure-processing'].steps
      .map((step) => step.run ?? '')
      .join('\n');

    // No token reaches docker, so there is nothing to redact in the echo.
    expect(run).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/u);
    expect(run).toContain('echo "Running: docker ${DOCKER_ARGS[*]}"');
    expect(run).toContain('"--stage-only" "/app/staging"');
    expect(run).not.toContain('"--publish"');
  });

  describe('scan-time install of the untrusted package', () => {
    const downloadStep = secureDocument.jobs['security-validation'].steps.find(
      (step) => step.id === 'download',
    );

    it('never runs lifecycle scripts of the package it is about to scan', () => {
      const installLines = downloadStep.run
        .split('\n')
        .filter((line) => /\bnpm (?:install|i|add)\b/u.test(line));

      expect(installLines.length).toBeGreaterThan(0);

      for (const line of installLines) {
        expect(line).toContain('--ignore-scripts');
      }
    });

    it('does not execute a postinstall script when the step runs', () => {
      const directory = mkdtempSync(path.join(tmpdir(), 'secure-install-'));
      const fixture = path.join(directory, 'fixture');
      const marker = path.join(directory, 'postinstall-ran');
      mkdirSync(fixture);
      writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({
          name: 'scan-fixture',
          scripts: {
            postinstall:
              "node -e \"require('node:fs').writeFileSync(process.env.MARKER_FILE, 'ran')\"",
          },
          version: '1.0.0',
        }),
      );
      const work = path.join(directory, 'work');
      mkdirSync(work);
      const pack = spawnSync('npm', ['pack', fixture, '--silent'], {
        cwd: directory,
        encoding: 'utf8',
        env: { HOME: directory, PATH: process.env.PATH },
      });

      expect(pack.status).toBe(0);

      const tarball = path.join(directory, pack.stdout.trim());
      const outputFile = path.join(directory, 'github-output');
      writeFileSync(outputFile, '');

      const result = spawnSync(
        'bash',
        ['--noprofile', '--norc', '-e', '-c', downloadStep.run],
        {
          cwd: work,
          encoding: 'utf8',
          env: {
            GITHUB_OUTPUT: outputFile,
            HOME: directory,
            MARKER_FILE: marker,
            npm_config_cache: path.join(directory, 'cache'),
            // npm 12 blocks dependency install scripts by default; allow them
            // so the test proves --ignore-scripts, not the npm default.
            npm_config_dangerously_allow_all_scripts: 'true',
            npm_config_offline: 'true',
            PACKAGE_NAME: tarball,
            PATH: process.env.PATH,
          },
        },
      );

      expect({
        installed: existsSync(
          path.join(work, 'temp-package', 'node_modules', 'scan-fixture'),
        ),
        postinstallRan: existsSync(marker),
        status: result.status,
      }).toStrictEqual({ installed: true, postinstallRan: false, status: 0 });
    });
  });

  it('both workflows are valid YAML with parseable jobs', () => {
    expect(Object.keys(secureDocument.jobs).length).toBeGreaterThan(0);
    expect(Object.keys(requestDocument.jobs)).toStrictEqual([
      'gate',
      'process',
      'publish',
      'commit',
    ]);
  });
});
