import { readFileSync } from 'node:fs';
import process from 'node:process';

import { isEntryPoint } from './utilities.mjs';

/**
 * Shared npm deprecation policy: cron-discover skips deprecated packages and
 * the issue-triggered request workflow rejects them. A package is deprecated
 * when its manifest carries a non-empty `deprecated` message (npm treats an
 * empty string as "not deprecated"). Imports only `node:` builtins and
 * ./utilities.mjs so the validate step needs nothing beyond `npm ci`.
 */

// Exit status of the CLI when the manifest is deprecated.
const DEPRECATION_EXIT_CODE = 3;
const MAX_MESSAGE_LENGTH = 200;
// Markdown-significant punctuation that is backslash-escaped in comments.
const MARKDOWN_SPECIAL = /[\\`*_{}[\]<>#+|~/&]/gu;
// Control, format (zero-width), and line/paragraph-separator characters.
const UNSAFE_CHARACTERS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu;
const ZERO_WIDTH_SPACE = '\u200B';

/**
 * True when the manifest marks this version deprecated.
 * @param {object | null | undefined} manifest
 * @returns {boolean}
 */
function isDeprecated(manifest) {
  return Boolean(manifest?.deprecated);
}

/**
 * Registry-supplied deprecation text made safe to paste into an issue
 * comment: one line, at most 200 characters, markdown escaped, and `@` broken
 * so it can never ping a user or team.
 * @param {object | null | undefined} manifest
 * @returns {string}
 */
function sanitizeDeprecationMessage(manifest) {
  const raw =
    typeof manifest?.deprecated === 'string' ? manifest.deprecated : '';
  return raw
    .replaceAll(UNSAFE_CHARACTERS, ' ')
    .replaceAll(/\s+/gu, ' ')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH)
    .replaceAll(MARKDOWN_SPECIAL, String.raw`\$&`)
    .replaceAll('@', `@${ZERO_WIDTH_SPACE}`);
}

/**
 * CLI: `node deprecation.mjs <package-info.json>`. Exit 0 = not deprecated;
 * exit 3 = deprecated, with the sanitized message on stdout; anything else is
 * an error (unreadable or invalid JSON).
 * @param {string[]} argv
 * @returns {number}
 */
function main(argv) {
  const manifest = JSON.parse(readFileSync(argv[0], 'utf8'));
  if (!isDeprecated(manifest)) {
    return 0;
  }
  process.stdout.write(`${sanitizeDeprecationMessage(manifest)}\n`);
  return DEPRECATION_EXIT_CODE;
}

export { DEPRECATION_EXIT_CODE, isDeprecated, sanitizeDeprecationMessage };

if (isEntryPoint(import.meta.filename)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`deprecation check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
