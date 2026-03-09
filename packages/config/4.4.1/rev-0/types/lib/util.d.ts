export type Parser = typeof import("./../parser");
export type BootstrapCallbackContext = {
    util: Util;
    defer: typeof deferConfig;
    raw: typeof RawConfig.raw;
};
/**
 * A function for deferred configuration
 *
 * Executable config files can now be initialized by a callback which receives useful
 * context in order to avoid the need for require() or import() calls to config while
 * it is still initializing.
 */
export type bootstrapCallback = (context: BootstrapCallbackContext) => any;
/**
 * A source in the configSources list
 */
export type ConfigSource = {
    name: string;
    /**
     * - parsed representation
     */
    parsed: any;
    /**
     * - unparsed representation of the data
     */
    original?: string | undefined;
};
/**
 * The data used for a Load operation, mostly derived from environment variables
 */
export type LoadOptions = {
    /**
     * - config directory location, absolute or relative to cwd()
     */
    configDir?: string | undefined;
    /**
     * - NODE_ENV value or commo-separated list
     */
    nodeEnv?: string[] | undefined;
    /**
     * - hostName for host-specific loads
     */
    hostName?: string | undefined;
    /**
     * - per-process config ID
     */
    appInstance?: string | undefined;
    /**
     * - don't track sources
     */
    skipConfigSources?: boolean | undefined;
    /**
     * - allow gitcrypt files
     */
    gitCrypt?: boolean | undefined;
    /**
     * - alternative parser implementation
     */
    parser?: Parser | undefined;
};
/**
 * Callback for converting loaded data.
 */
export type DataConvert = (input: any) => any;
/**
 * Util functions that do not require the singleton in order to run.
 */
export class Util {
    /**
     * <p>Make a configuration property hidden so it doesn't appear when enumerating
     * elements of the object.</p>
     *
     * <p>
     * The property still exists and can be read from and written to, but it won't
     * show up in for ... in loops, Object.keys(), or JSON.stringify() type methods.
     * </p>
     *
     * <p>
     * If the property already exists, it will be made hidden.  Otherwise it will
     * be created as a hidden property with the specified value.
     * </p>
     *
     * <p><i>
     * This method was built for hiding configuration values, but it can be applied
     * to <u>any</u> javascript object.
     * </i></p>
     *
     * <p>Example:</p>
     * <pre>
     *   const Util = require('config/lib/util.js');
     *   ...
     *
     *   // Hide the Amazon S3 credentials
     *   Util.makeHidden(CONFIG.amazonS3, 'access_id');
     *   Util.makeHidden(CONFIG.amazonS3, 'secret_key');
     * </pre>
     *
     * @method makeHidden
     * @param {object} object - The object to make a hidden property into.
     * @param {string} property - The name of the property to make hidden.
     * @param {*=} value - (optional) Set the property value to this (otherwise leave alone)
     * @return {object} - The original object is returned - for chaining.
     */
    static makeHidden(object: object, property: string, value?: any | undefined): object;
    /**
     * Make a javascript object immutable (assuring it cannot be changed from the current value)
     *
     * All attributes of that object are made immutable, including properties of contained
     * objects, recursively.
     *
     * This operation cannot be undone.
     *
     * <p>Example:</p>
     * <pre>
     *   const config = require('config');
     *   const myObject = {hello:'world'};
     *   Util.makeImmutable(myObject);
     * </pre>
     *
     * @method makeImmutable
     * @param object {Object} - The object to freeze
     * @return object {Object} - The original object is returned - for chaining.
     */
    static makeImmutable(object: any): any;
    /**
     * Looks into an options object for a specific attribute
     *
     * <p>
     * This method looks into the options object, and if an attribute is defined, returns it,
     * and if not, returns the default value
     * </p>
     *
     * @template T
     * @method getOption
     * @param {Object | undefined} options the options object
     * @param {string} optionName the attribute name to look for
     * @param {T} defaultValue the default in case the options object is empty, or the attribute does not exist.
     * @return {T} options[optionName] if defined, defaultValue if not.
     */
    static getOption<T>(options: any | undefined, optionName: string, defaultValue: T): T;
    /**
     * Load the individual file configurations.
     *
     * <p>
     * This method builds a map of filename to the configuration object defined
     * by the file.  The search order is:
     * </p>
     *
     * <pre>
     *   default.EXT
     *   (deployment).EXT
     *   (hostname).EXT
     *   (hostname)-(deployment).EXT
     *   local.EXT
     *   local-(deployment).EXT
     * </pre>
     *
     * <p>
     * EXT can be yml, yaml, coffee, iced, json, jsonc, cson or js signifying the file type.
     * yaml (and yml) is in YAML format, coffee is a coffee-script, iced is iced-coffee-script,
     * json is in JSON format, jsonc is in JSONC format, cson is in CSON format, properties is
     * in .properties format (http://en.wikipedia.org/wiki/.properties), and js is a javascript
     * executable file that is require()'d with module.exports being the config object.
     * </p>
     *
     * <p>
     * hostname is the $HOST environment variable (or --HOST command line parameter)
     * if set, otherwise the $HOSTNAME environment variable (or --HOSTNAME command
     * line parameter) if set, otherwise the hostname found from
     * require('os').hostname().
     * </p>
     *
     * <p>
     * Once a hostname is found, everything from the first period ('.') onwards
     * is removed. For example, abc.example.com becomes abc
     * </p>
     *
     * <p>
     * (deployment) is the deployment type, found in the $NODE_ENV environment
     * variable (which can be overridden by using $NODE_CONFIG_ENV
     * environment variable). Defaults to 'development'.
     * </p>
     *
     * <p>
     * If the $NODE_APP_INSTANCE environment variable (or --NODE_APP_INSTANCE
     * command line parameter) is set, then files with this appendage will be loaded.
     * See the Multiple Application Instances section of the main documentation page
     * for more information.
     * </p>
     *
     * @method loadFileConfigs
     * @param {LoadOptions | Load} opts parsing options or Load to update
     * @return {Load} loadConfig
     */
    static loadFileConfigs(opts: LoadOptions | Load): Load;
    /**
     * Return a list of fullFilenames who exists in allowedFiles
     * Ordered according to allowedFiles argument specifications
     *
     * @method locateMatchingFiles
     * @param {string} configDirs   the config dir, or multiple dirs separated by a column (:)
     * @param {Object} allowedFiles an object. keys and supported filenames
     *                              and values are the position in the resolution order
     * @returns {string[]}          fullFilenames - path + filename
     */
    static locateMatchingFiles(configDirs: string, allowedFiles: any): string[];
    /**
     *
     * @param {object} config
     */
    static resolveDeferredConfigs(config: object): void;
    /**
     * Used to resolve configs that have async functions.
     *
     * NOTE: Do not use `config.get` before executing this method, it will freeze the config object
     *
     * This replaces ./async.js, which is deprecated.
     *
     * @param config
     * @returns {Promise<void>}
     */
    static resolveAsyncConfigs(config: any): Promise<void>;
    /**
     * Return a deep copy of the specified object using cloneDeep(parent, depth, circular, prototype).
     *
     * This returns a new object with all elements copied from the specified
     * object.  Deep copies are made of objects and arrays so you can do anything
     * with the returned object without affecting the input object.
     *
     * @method cloneDeep
     * @param {object} parent The original object to copy from
     * @param {number} [depth=20] Maximum depth
     * @param {boolean} [circular=true] Handle circular references
     * @param {object=} prototype Optional prototype for the new object
     * @return {object} A new object with the elements copied from the parent object
     *
     * This method is copied from https://github.com/pvorb/node-clone/blob/17eea36140d61d97a9954c53417d0e04a00525d9/clone.js
     *
     * Copyright © 2011-2014 Paul Vorbach and contributors.
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the “Software”), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
     * of the Software, and to permit persons to whom the Software is furnished to do so,
     * subject to the following conditions: The above copyright notice and this permission
     * notice shall be included in all copies or substantial portions of the Software.
     */
    static cloneDeep(parent: object, depth?: number, circular?: boolean, prototype?: object | undefined): object;
    /**
     * Underlying get mechanism
     *
     * @method getPath
     * @param {object} object - Object to get the property for
     * @param {string|string[]} property - The property name to get (as an array or '.' delimited string)
     * @return {*} value - Property value, including undefined if not defined.
     */
    static getPath(object: object, property: string | string[]): any;
    /**
     * Set objects given a path as a string list
     *
     * @method setPath
     * @param {object} object - Object to set the property on
     * @param {string|string[]} property - The property name to get (as an array or '.' delimited string)
     * @param {*} value - value to set, ignoring null
     * @return {*} - the given value
     */
    static setPath(object: object, property: string | string[], value: any): any;
    /**
     * Return true if two objects have equal contents.
     *
     * @method equalsDeep
     * @param object1 {Object} The object to compare from
     * @param object2 {Object} The object to compare with
     * @param depth {number} An optional depth to prevent recursion.  Default: 20.
     * @return {boolean} True if both objects have equivalent contents
     */
    static equalsDeep(object1: any, object2: any, depth: number): boolean;
    /**
     * Extend an object, and any object it contains.
     *
     * This does not replace deep objects, but dives into them
     * replacing individual elements instead.
     *
     * @method extendDeep
     * @param mergeInto {Object} The object to merge into
     * @param mergeFrom... {Object} - Any number of objects to merge from
     * @param {number} [depth=20] - An optional depth to prevent recursion.  Default: 20.
     * @return {Object} The altered mergeInto object is returned
     */
    static extendDeep(mergeInto: any, ...vargs: any[]): any;
    /**
     * Is the specified argument a regular javascript object?
     *
     * The argument is an object if it's a JS object, but not an array.
     *
     * @method isObject
     * @param {unknown} obj An argument of any type.
     * @return {obj is object} TRUE if the arg is an object, FALSE if not
     */
    static isObject(obj: unknown): obj is object;
    /**
     * Is the specified argument a javascript promise?
     *
     * @method isPromise
     * @param {unknown} obj An argument of any type.
     * @returns {obj is Promise} TRUE if the arg is a Promise, FALSE if not
     */
    static isPromise(obj: unknown): obj is Promise<any>;
    /**
     * Returns a string of flags for regular expression `re`.
     *
     * @param {RegExp} re Regular expression
     * @returns {string} Flags
     */
    static getRegExpFlags: (re: RegExp) => string;
    /**
     * Returns a new deep copy of the current config object, or any part of the config if provided.
     *
     * @param {Object} config The part of the config to copy and serialize.
     * @returns {Object} The cloned config or part of the config
     */
    static toObject(config: any): any;
    /**
     * Send a message to console.error once
     * @param {string} key the subject of the error, used to prevent duplicates
     * @param {string} message helpful message for library users
     * @param {...object} args additional arguments to console.error
     */
    static errorOnce(key: string, message: string, ...args: object[]): void;
}
/**
 * The work horse of loading Config data - without the singleton.
 *
 * This class can be used to execute important workflows, such as build-time validations
 * and Module Defaults.
 *
 * @example
 * //load module defaults
 * const config = require("config");
 * const Load = require("config/util.js").Load;
 *
 * let load = Load.fromEnvironment();
 *
 * load.scan();
 *
 * config.setModuleDefaults("my-module", load.config);
 *
 * @example
 * // verify configs
 * const Load = require("config/util.js").Load;
 *
 * for (let environment of ["sandbox", "qa", "qa-hyderabad", "perf", "staging", "prod-east-1", "prod-west-2"] {
 *   let load = Load.fromEnvironment(environment);
 *
 *   load.scan();
 * }
 *
 *
 * @class Load
 */
export class Load {
    /**
     * Populate a LoadConfig entirely from environment variables.
     *
     * This is the way a base config is normally accomplished, but not for independent loads.
     *
     * This function exists in part to reduce the circular dependency of variable initializations
     * in the config.js file
     * @param {string} environments the NODE_CONFIG_ENVs you want to load
     * @returns {Load}
     */
    static fromEnvironment(environments: string): Load;
    /**
     * @constructor
     * @param {LoadOptions=} options - defaults to reading from environment variables
     * @param {Env=} env - optional Env data, usually from fromEnvironment()
     */
    constructor(options?: LoadOptions | undefined, env?: Env | undefined);
    /** @type {Env} */
    env: Env;
    /** @type {LoadOptions} */
    options: LoadOptions;
    /** @type {ConfigSource[] | undefined} */
    sources: ConfigSource[] | undefined;
    /** @type {Parser | undefined} */
    parser: Parser | undefined;
    /** @type {Record<string, any>} */
    config: Record<string, any>;
    /** @type {Record<string, any> | undefined} */
    defaults: Record<string, any> | undefined;
    /** @type {Record<string, any> | undefined} */
    unmerged: Record<string, any> | undefined;
    /** @type {boolean} */
    updated: boolean;
    /**
     * Create a snapshot of a Load instance
     * @returns {Load}
     */
    clone(): Load;
    /**
     * <p>Initialize a parameter from the command line or process environment</p>
     *
     * <p>
     * This method looks for the parameter from the command line in the format
     * --PARAMETER=VALUE, then from the process environment, then from the
     * default specified as an argument.
     * </p>
     *
     * @template T
     * @method initParam
     * @param {string} paramName Name of the parameter
     * @param {T} [defaultValue]  Default value of the parameter
     * @return {T} The found value, or default value
     */
    initParam<T>(paramName: string, defaultValue?: T): T;
    /**
     * <p>Get Command Line Arguments</p>
     *
     * <p>
     * This method allows you to retrieve the value of the specified command line argument.
     * </p>
     *
     * <p>
     * The argument is case sensitive, and must be of the form '--ARG_NAME=value'
     * </p>
     *
     * @method getCmdLineArg
     * @param {string} searchFor The argument name to search for
     * @return {false|string} false if the argument was not found, the argument value if found
     */
    getCmdLineArg(searchFor: string): false | string;
    /**
     * <p>Get a Config Environment Variable Value</p>
     *
     * <p>
     * This method returns the value of the specified config environment variable,
     * including any defaults or overrides.
     * </p>
     *
     * @method getEnv
     * @param {string} varName The environment variable name
     * @return {string} The value of the environment variable
     */
    getEnv(varName: string): string;
    /**
     * Set a tracing variable of what was accessed from process.env
     *
     * @see fromEnvironment
     * @param {string} key
     * @param {*} value
     */
    setEnv(key: string, value: any): void;
    /**
     * Add a set of configurations and record the source
     *
     * @param {string=} name an entry will be added to sources under this name (if given)
     * @param {object=} values values to merge in
     * @param {string=} original Optional unparsed version of the data
     * @return {Load} this
     */
    addConfig(name?: string | undefined, values?: object | undefined, original?: string | undefined): Load;
    /**
     * scan and load config files in the same manner that config.js does
     *
     * @param {{name: string, config: any}[]=} additional additional values to populate (usually from NODE_CONFIG)
     */
    scan(additional?: {
        name: string;
        config: any;
    }[] | undefined): void;
    /**
     * Load a file and add it to the configuration
     *
     * @param {string} fullFilename an absolute file path
     * @param {DataConvert=} convert
     * @returns {null}
     */
    loadFile(fullFilename: string, convert?: DataConvert | undefined): null;
    /**
     * load custom-environment-variables
     *
     * @param extNames {string[]=} extensions
     * @returns {{}}
     */
    loadCustomEnvVars(extNames?: string[] | undefined): {};
    /**
     * Return the report of where the sources for this load operation came from
     * @returns {ConfigSource[]}
     */
    getSources(): ConfigSource[];
    /**
     * <p>
     * Set default configurations for a node.js module.
     * </p>
     *
     * <p>
     * This allows module developers to attach their configurations onto the
     * default configuration object so they can be configured by the consumers
     * of the module.
     * </p>
     *
     * <p>Using the function within your module:</p>
     * <pre>
     *   load.setModuleDefaults("MyModule", {
     *   &nbsp;&nbsp;templateName: "t-50",
     *   &nbsp;&nbsp;colorScheme: "green"
     *   });
     * <br>
     *   // Template name may be overridden by application config files
     *   console.log("Template: " + CONFIG.MyModule.templateName);
     * </pre>
     *
     * <p>
     * The above example results in a "MyModule" element of the configuration
     * object, containing an object with the specified default values.
     * </p>
     *
     * @method setModuleDefaults
     * @param moduleName {string} - Name of your module.
     * @param defaultProperties {Object} - The default module configuration.
     * @return {Object} - The module level configuration object.
     */
    setModuleDefaults(moduleName: string, defaultProperties: any): any;
    /**
     * Parse and return the specified string with the specified format.
     *
     * The format determines the parser to use.
     *
     * json = File is parsed using JSON.parse()
     * yaml (or yml) = Parsed with a YAML parser
     * toml = Parsed with a TOML parser
     * cson = Parsed with a CSON parser
     * hjson = Parsed with a HJSON parser
     * json5 = Parsed with a JSON5 parser
     * properties = Parsed with the 'properties' node package
     * xml = Parsed with a XML parser
     *
     * If the file doesn't exist, a null will be returned.  If the file can't be
     * parsed, an exception will be thrown.
     *
     * This method performs synchronous file operations, and should not be called
     * after synchronous module loading.
     *
     * @protected
     * @method parseString
     * @param {string} content The full content
     * @param {string} format  The format to be parsed
     * @return {object} configObject  The configuration object parsed from the string
     */
    protected parseString(content: string, format: string): object;
    /**
     * Create a new object patterned after substitutionMap, where:
     * 1. Terminal string values in substitutionMap are used as keys
     * 2. To look up values in a key-value store, variables
     * 3. And parent keys are created as necessary to retain the structure of substitutionMap.
     *
     * @protected
     * @method substituteDeep
     * @param {object} substitutionMap {Object} - an object whose terminal (non-subobject) values are strings
     * @param {Record<string, any>} variables - usually process.env, a flat object used to transform
     *      terminal values in a copy of substitutionMap.
     * @returns {Object} - deep copy of substitutionMap with only those paths whose terminal values
     *      corresponded to a key in `variables`
     */
    protected substituteDeep(substitutionMap: object, variables: Record<string, any>): any;
}
/**
 * This is meant to wrap configuration objects that should be left as is,
 * meaning that the object or its prototype will not be modified in any way
 */
export class RawConfig {
    /**
     * create a RawConfig
     * @param rawObject {Object} properties we don't want to have manipulated by node-config
     * @returns {RawConfig}
     */
    static raw(rawObject: any): RawConfig;
    constructor(data: any);
    resolve(): any;
    #private;
}
import { deferConfig } from "./defer.js";
/**
 * Record a set of lookups
 */
declare class Env {
    lookups: {};
    /**
     * Create a snapshot of an Env.
     * @returns {Env}
     */
    clone(): Env;
    /**
     * <p>Initialize a parameter from the command line or process environment</p>
     *
     * <p>
     * This method looks for the parameter from the command line in the format
     * --PARAMETER=VALUE, then from the process environment, then from the
     * default specified as an argument.
     * </p>
     *
     * @template T
     * @method initParam
     * @param {string} paramName Name of the parameter
     * @param {T} [defaultValue] Default value of the parameter
     * @return {T} The found value, or default value
     */
    initParam<T>(paramName: string, defaultValue?: T): T;
    /**
     * <p>Get Command Line Arguments</p>
     *
     * <p>
     * This method allows you to retrieve the value of the specified command line argument.
     * </p>
     *
     * <p>
     * The argument is case sensitive, and must be of the form '--ARG_NAME=value'
     * </p>
     *
     * @method getCmdLineArg
     * @param {string} searchFor The argument name to search for
     * @return {false|string} false if the argument was not found, the argument value if found
     */
    getCmdLineArg(searchFor: string): false | string;
    /**
     * <p>Get a Config Environment Variable Value</p>
     *
     * <p>
     * This method returns the value of the specified config environment variable,
     * including any defaults or overrides.
     * </p>
     *
     * @method getEnv
     * @param {string} varName The environment variable name
     * @return {string} The value of the environment variable
     */
    getEnv(varName: string): string;
    /**
     * Set a tracing variable of what was accessed from process.env
     *
     * @see fromEnvironment
     * @param {string} key
     * @param {*} value
     */
    setEnv(key: string, value: any): void;
}
export {};
