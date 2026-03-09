export type Config = import("./config").Config;
/**
 * Accept a function that we will execute later and return a deferred placeholder.
 *
 * @template TOriginal
 * @template TResult
 * @param {(this: Config, config: Config, original: TOriginal) => TResult | Promise<TResult>} func
 * @returns {DeferredConfig}
 */
export function deferConfig<TOriginal, TResult>(func: (this: Config, config: Config, original: TOriginal) => TResult | Promise<TResult>): DeferredConfig;
/** @typedef {import('./config').Config} Config */
/**
 * Deferred config placeholder.
 * @constructor
 */
export function DeferredConfig(): void;
export class DeferredConfig {
    /**
     * Prepare this deferred value for lazy resolution.
     *
     * @param {Config} config
     * @param {any} prop
     * @param {string | number} property
     * @returns {DeferredConfig}
     */
    prepare(config: Config, prop: any, property: string | number): DeferredConfig;
    /**
     * Resolve the deferred value.
     *
     * @returns {any}
     */
    resolve(): any;
}
