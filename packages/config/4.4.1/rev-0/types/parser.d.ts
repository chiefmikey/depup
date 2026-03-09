/**
 * @param {string} filename
 * @param {string} content
 * @returns {object | undefined}
 */
export function parse(filename: string, content: string): object | undefined;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function xmlParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function jsParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function tsParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function coffeeParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object | undefined}
 */
export function icedParser(filename: string, content: string): object | undefined;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object | undefined}
 */
export function yamlParser(filename: string, content: string): object | undefined;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function jsonParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function json5Parser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function hjsonParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function tomlParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function csonParser(filename: string, content: string): object;
/**
 * @param {string} filename
 * @param {string} content
 * @returns {object}
 */
export function propertiesParser(filename: string, content: string): object;
/**
 * Strip YAML comments from the string
 *
 * The 2.0 yaml parser doesn't allow comment-only or blank lines.  Strip them.
 *
 * @protected
 * @method stripYamlComments
 * @param {string} fileStr The string to strip comments from
 * @return {string} The string with comments stripped.
 */
export function stripYamlComments(fileStr: string): string;
/**
 * Parses the environment variable to the boolean equivalent.
 * Defaults to false
 *
 * @param {string} filename - Filename of the env variable (not used)
 * @param {string} content - Environment variable value
 * @return {boolean} - Boolean value fo the passed variable value
 */
export function booleanParser(filename: string, content: string): boolean;
/**
 * Parses the environment variable to the number equivalent.
 * Defaults to undefined
 *
 * @param {string} filename - Filename of the env variable (not used)
 * @param {string} content - Environment variable value
 * @return {number} - Number value fo the passed variable value
 */
export function numberParser(filename: string, content: string): number;
/**
 * @param {string} name
 * @returns {ParserFn | undefined}
 */
export function getParser(name: string): ParserFn | undefined;
/**
 * @param {string} name
 * @param {ParserFn} parser
 */
export function setParser(name: string, parser: ParserFn): void;
/**
 * @param {string=} name
 * @returns {string[] | number}
 */
export function getFilesOrder(name?: string | undefined): string[] | number;
/**
 * @param {string|string[]} name
 * @param {number=} newIndex
 * @returns {string[]}
 */
export function setFilesOrder(name: string | string[], newIndex?: number | undefined): string[];
/**
 * <T>
 */
export type ParserFn<T = any> = (filename: string, content: string) => T | undefined;
