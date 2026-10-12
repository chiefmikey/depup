/**
 * Test-only preload (`node --import <this file> scripts/depup.mjs ...`): points
 * the pacote calls depup.mjs makes at the fake registry in FAKE_REGISTRY_URL,
 * and tells the package canary which process is the root of the stage run.
 * It lives next to the tests so production code carries no registry seam.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pacote = require('pacote');

const registry = process.env.FAKE_REGISTRY_URL;

if (!registry) {
  throw new Error('FAKE_REGISTRY_URL is required');
}

const withRegistry =
  (original, optionsIndex) =>
  (...parameters) => {
    const next = [...parameters];
    next[optionsIndex] = { registry, ...next[optionsIndex] };
    return original(...next);
  };

pacote.manifest = withRegistry(pacote.manifest, 1);
pacote.packument = withRegistry(pacote.packument, 1);
pacote.extract = withRegistry(pacote.extract, 2);
process.env.CANARY_ROOT_PID = String(process.pid);
