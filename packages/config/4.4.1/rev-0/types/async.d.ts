export type Config = import("./lib/config").Config;
export type DeferredConfig = import("./defer").DeferredConfig;
/**
 * @template T
 * @overload
 * @param {Promise<T>} promiseOrFunc
 * @returns {Promise<T>}
 */
export function asyncConfig<T>(promiseOrFunc: Promise<T>): Promise<T>;
/**
 * @template T
 * @overload
 * @param {(config: Config, original: any) => Promise<T>} promiseOrFunc
 * @returns {DeferredConfig}
 */
export function asyncConfig<T>(promiseOrFunc: (config: Config, original: any) => Promise<T>): DeferredConfig;
/**
 * Do not use `config.get` before executing this method, it will freeze the config object.
 * @param {Config} config the main config object, returned from require('config')
 * @returns {Promise<Config>}   once all promises are resolved, return the original config object
 * @deprecated please use async functions with defer and Util.resolveAsyncConfigs
 */
export function resolveAsyncConfigs(config: Config): Promise<Config>;
