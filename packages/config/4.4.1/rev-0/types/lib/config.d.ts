declare namespace _exports {
    export { Util, Load, LoadOptions, Parser, Config };
}
declare const _exports: Config;
export = _exports;
type Util = import("./util").Util;
type Load = import("./util").Load;
type LoadOptions = import("./util").LoadOptions;
type Parser = typeof import("./../parser");
/**
 * The exported configuration instance type.
 * This is here because the Config class is not a named export and this is how we get
 * the exported configuration instance type.
 */
type Config = ConfigClass;
/**
 * <p>Application Configurations</p>
 * @class
 */
declare class ConfigClass {
    /**
     * <p>Get the configuration object.</p>
     *
     * <p>
     * The configuration object is a shared singleton object within the application,
     * attained by calling require('config').
     * </p>
     *
     * <p>
     * Usually you'll specify a CONFIG variable at the top of your .js file
     * for file/module scope. If you want the root of the object, you can do this:
     * </p>
     * <pre>
     * const CONFIG = require('config');
     * </pre>
     *
     * <p>
     * Sometimes you only care about a specific sub-object within the CONFIG
     * object.  In that case you could do this at the top of your file:
     * </p>
     * <pre>
     * const CONFIG = require('config').customer;
     * or
     * const CUSTOMER_CONFIG = require('config').customer;
     * </pre>
     *
     * <script type="text/javascript">
     *   document.getElementById("showProtected").style.display = "block";
     * </script>
     *
     * @method constructor
     */
    constructor(load: any);
    /**
     * Non-enumerable field for util functions
     *
     * @type {ConfigUtils}
     */
    util: ConfigUtils;
    /**
     * <p>Get a configuration value</p>
     *
     * <p>
     * This will return the specified property value, throwing an exception if the
     * configuration isn't defined.  It is used to assure configurations are defined
     * before being used, and to prevent typos.
     * </p>
     *
     * @template T
     * @param {string} property - The configuration property to get. Can include '.' sub-properties.
     * @returns {T} The property value
     */
    get<T>(property: string): T;
    /**
     * Test that a configuration parameter exists
     *
     * <pre>
     *    const config = require('config');
     *    if (config.has('customer.dbName')) {
     *      console.log('Customer database name: ' + config.customer.dbName);
     *    }
     * </pre>
     *
     * @method has
     * @param {string} property - The configuration property to test. Can include '.' sub-properties.
     * @return {boolean} - True if the property is defined, false if not defined.
     */
    has(property: string): boolean;
    [LOAD_SYMBOL]: any;
}
/**
 * The exported configuration instance type.
 * This is here because the Config class is not a named export and this is how we get
 * the exported configuration instance type.
 * @typedef {ConfigClass} Config
 */
/**
 * Source of config.util utility functions.
 *
 * In general, lib/util.js is what you are looking for.
 *
 * @class ConfigUtils
 */
declare class ConfigUtils {
    /**
     * @param {Config} config
     */
    constructor(config: Config);
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
     *   const CONFIG = require("config");
     *   CONFIG.util.setModuleDefaults("MyModule", {
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
     * @param {string} moduleName - Name of your module.
     * @param {any} defaultProperties - The default module configuration.
     * @return {any} moduleConfig - The module level configuration object.
     * @see Load.scan() for loading more robust defaults
     */
    setModuleDefaults(moduleName: string, defaultProperties: any): any;
    /**
     * Set default configurations for a node.js module.
     *
     * This variant is provided to support handling loading of multiple versions
     * of a library. This is meant for module developers to create a config snapshot
     * for an old version of the code, particularly during a staged upgrade.
     * Instead of adding the values to the configuration, it creates a new Config
     * instance that contains the provided defaults.
     *
     * Note: This feature is primarily useful for adding, removing, or renaming
     * properties. It will struggle to deal with changing the semantics of
     * existing fields if you need to override those fields in your top level
     * config/ directory. It is always best when versioning an API to change the
     * names of fields when you change the meaning of the field.
     *
     * <p>Using the function within your module:</p>
     * <pre>
     *   const configModule = require("config");
     *   const config = configModule.withModuleDefaults("MyModule", {
     *   &nbsp;&nbsp;templateName: "t-50",
     *   &nbsp;&nbsp;colorScheme: "green"
     *   });
     * <br>
     *   // Template name may be overridden by application config files
     *   console.log("Template: " + config.MyModule.templateName);
     * </pre>
     *
     * <p>
     * The above example results in a "MyModule" element of the configuration
     * object, containing an object with the specified default values.
     * </p>
     *
     * @method withModuleDefaults
     * @param moduleName {string} - Name of your module.
     * @param defaultProperties {Object} - The default module configuration.
     * @returns {Config}
     * @see Load.scan() for loading more robust defaults
     */
    withModuleDefaults(moduleName: string, defaultProperties: any): Config;
    /**
     * <p>Make a javascript object property immutable (assuring it cannot be changed
     * from the current value).</p>
     * <p>
     * If the specified property is an object, all attributes of that object are
     * made immutable, including properties of contained objects, recursively.
     * If a property name isn't supplied, the object and all of its properties
     * are made immutable.
     * </p>
     * <p>
     * This operation cannot be undone.
     * </p>
     *
     * <p>Example:</p>
     * <pre>
     *   const config = require('config');
     *   const myObject = {hello:'world'};
     *   config.util.makeImmutable(myObject);
     * </pre>
     *
     * @method makeImmutable
     * @deprecated see Util.makeImmutable()
     * @param {any} object - The object to specify immutable properties for
     * @param {string | string[]=} property - The name of the property (or array of names) to make immutable.
     *        If not provided, the entire object is marked immutable.
     * @param {any=} value - Property value (or array of values) to set
     *        the property to before making immutable. Only used when setting a single
     *        property. Retained for backward compatibility.
     * @return {any} - The original object is returned - for chaining.
     */
    makeImmutable(object: any, property?: (string | string[]) | undefined, value?: any | undefined): any;
    /**
     * <p>Make a javascript object property immutable (assuring it cannot be changed
     * from the current value).</p>
     * <p>
     * If the specified property is an object, all attributes of that object are
     * made immutable, including properties of contained objects, recursively.
     * If a property name isn't supplied, the object and all of its properties
     * are made immutable.
     * </p>
     * <p>
     * This operation cannot be undone.
     * </p>
     *
     * <p>Example:</p>
     * <pre>
     *   const config = require('config');
     *   const myObject = {hello:'world'};
     *   config.util.makeImmutable(myObject);
     * </pre>
     *
     * @method makeImmutable
     * @protected
     * @deprecated - partial immutability will no longer be supported by this project
     * @param object {Object} - The object to specify immutable properties for
     * @param property {string | [string]} - The name of the property (or array of names) to make immutable.
     *        If not provided, the entire object is marked immutable.
     * @param [value] {* | [*]} - Property value (or array of values) to set
     *        the property to before making immutable. Only used when setting a single
     *        property. Retained for backward compatibility.
     * @return object {Object} - The original object is returned - for chaining.
     */
    protected makeImmutablePartial(object: any, property: string | [string], value?: any | [any]): any;
    /**
     * Return the sources for the configurations
     *
     * <p>
     * All sources for configurations are stored in an array of objects containing
     * the source name (usually the filename), the original source (as a string),
     * and the parsed source as an object.
     * </p>
     *
     * @method getConfigSources
     * @return {import('./util').ConfigSource[]} configSources - An array of objects containing
     *    name, original, and parsed elements
     */
    getConfigSources(): import("./util").ConfigSource[];
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
     * @see Util.loadFileConfigs for discrete execution of most of this functionality
     * @method loadFileConfigs
     * @param {string=} configDir the path to the directory containing the configurations to load
     * @param {LoadOptions=} options parsing options
     * @return {Record<string, any>} The configuration object
     */
    loadFileConfigs(configDir?: string | undefined, options?: LoadOptions | undefined): Record<string, any>;
    /**
     * Attach the Config class prototype to all config objects recursively.
     *
     * <p>
     * This allows you to do anything with CONFIG sub-objects as you can do with
     * the top-level CONFIG object.  It's so you can do this:
     * </p>
     *
     * <pre>
     *   const CUST_CONFIG = require('config').Customer;
     *   CUST_CONFIG.get(...)
     * </pre>
     *
     * @method attachProtoDeep
     * @param {object} toObject
     * @param {number} [depth=20]
     * @return {object}
     */
    attachProtoDeep(toObject: object, depth?: number): object;
    /**
     * <p>Get a Config Environment Variable Value</p>
     *
     * <p>
     * This method returns the value of the specified config environment variable,
     * including any defaults or overrides.
     * </p>
     *
     * @method getEnv
     * @param varName {String} The environment variable name
     * @return {String} The value of the environment variable
     */
    getEnv(varName: string): string;
    /**
     * Returns a new deep copy of the current config object, or any part of the config if provided.
     *
     * @param {object} [config] The part of the config to copy and serialize. Omit this argument to return the entire config.
     * @returns {object} The cloned config or part of the config
     */
    toObject(config?: object): object;
    /**
     * Run strictness checks on NODE_ENV and NODE_APP_INSTANCE and throw an error if there's a problem.
     * @param {Config} [config]
     */
    runStrictnessChecks(config?: Config): void;
    /**
     * @deprecated please use Parser.stripYamlComments
     * @param {string} fileStr The string to strip comments from
     */
    stripYamlComments(fileStr: string): any;
    #private;
}
declare const LOAD_SYMBOL: unique symbol;
