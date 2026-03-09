import { RawConfig } from "./lib/util";
/**
 * @param {any} rawObj
 * @returns {RawConfig & { resolve: () => any }}
 */
export function raw(rawObj: any): RawConfig & {
    resolve: () => any;
};
export { RawConfig };
