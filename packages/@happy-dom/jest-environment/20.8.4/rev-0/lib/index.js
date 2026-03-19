/* eslint-disable filenames/match-exported */
import * as JestUtil from 'jest-util';
import { ModuleMocker } from 'jest-mock';
import { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers';
import { Window, BrowserErrorCaptureEnum } from 'happy-dom';
/**
 * Happy DOM Jest Environment.
 */
export default class HappyDOMEnvironment {
    fakeTimers = null;
    fakeTimersModern = null;
    window;
    global;
    moduleMocker;
    /**
     * jest-environment-jsdom" has the default set to ['browser']
     * As changing this value would be a breaking change, we will keep it at ['node', 'node-addons'] until we do a major release
     *
     * @see https://stackoverflow.com/questions/72428323/jest-referenceerror-vue-is-not-defined
     */
    customExportConditions = ['node', 'node-addons'];
    _configuredExportConditions;
    /**
     * Constructor.
     *
     * @param config Jest config.
     * @param config.globalConfig jest global config.
     * @param config.projectConfig jest project config.
     * @param options Options.
     */
    constructor(config, options) {
        let projectConfig;
        let globals;
        if (isJestConfigVersion29(config)) {
            // Jest 29
            globals = config.globals;
            projectConfig = config;
        }
        else if (isJestConfigVersion28(config)) {
            // Jest < 29
            globals = config.projectConfig.globals;
            projectConfig = config.projectConfig;
        }
        else {
            throw new Error('Unsupported jest version.');
        }
        this._configuredExportConditions = [];
        if ('customExportConditions' in projectConfig.testEnvironmentOptions) {
            const { customExportConditions } = projectConfig.testEnvironmentOptions;
            if (Array.isArray(customExportConditions) &&
                customExportConditions.every((condition) => typeof condition === 'string')) {
                this._configuredExportConditions = customExportConditions;
            }
            else {
                throw new Error('Custom export conditions specified but they are not an array of strings');
            }
        }
        // Initialize Window and Global
        this.window = new Window({
            url: 'http://localhost/',
            ...projectConfig.testEnvironmentOptions,
            console: options?.console || console,
            settings: {
                ...projectConfig.testEnvironmentOptions?.settings,
                errorCapture: BrowserErrorCaptureEnum.disabled
            }
        });
        this.global = this.window;
        this.moduleMocker = new ModuleMocker(this.window);
        // Node's error-message stack size is limited to 10, but it's pretty useful to see more than that when a test fails.
        this.global.Error.stackTraceLimit = 100;
        // TODO: Remove this ASAP as it currently causes tests to run really slow.
        this.global.Buffer = Buffer;
        // Needed as Jest is using it
        this.window['global'] = this.global;
        JestUtil.installCommonGlobals(this.window, globals);
        // For some reason Jest removes the global setImmediate and clearImmediate, so we need to add them back.
        // This is especially important for Jest 30+ where these are no longer available.
        this.global.setImmediate = global.setImmediate;
        this.global.clearImmediate = global.clearImmediate;
        this.fakeTimers = new LegacyFakeTimers({
            config: projectConfig,
            global: this.window,
            moduleMocker: this.moduleMocker,
            timerConfig: {
                idToRef: (id) => id,
                refToId: (ref) => ref
            }
        });
        this.fakeTimersModern = new ModernFakeTimers({
            config: projectConfig,
            global: this.window
        });
        // Jest is using the setTimeout function from Happy DOM internally for detecting when a test times out, but this causes window.happyDOM?.waitUntilComplete() and window.happyDOM?.abort() to not work as expected.
        // Hopefully Jest can fix this in the future as this fix is not very pretty.
        const happyDOMSetTimeout = this.global.setTimeout;
        this.global.setTimeout = (...args) => {
            if (new Error('stack').stack.includes('/jest-jasmine')) {
                // @ts-ignore
                return global.setTimeout.call(global, ...args);
            }
            // @ts-ignore
            return happyDOMSetTimeout.call(this.global, ...args);
        };
    }
    /**
     * Respect any export conditions specified as options
     * https://jestjs.io/docs/configuration#testenvironmentoptions-object
     */
    exportConditions() {
        return this._configuredExportConditions ?? this.customExportConditions;
    }
    /**
     * Setup.
     *
     * @returns Promise.
     */
    async setup() { }
    /**
     * Teardown.
     *
     * @returns Promise.
     */
    async teardown() {
        this.fakeTimers.dispose();
        this.fakeTimersModern.dispose();
        await this.global.happyDOM.abort();
        this.global.close();
        this.global = null;
        this.moduleMocker = null;
        this.fakeTimers = null;
        this.fakeTimersModern = null;
    }
    /**
     * Runs a script.
     *
     * @param script Script.
     * @returns Result.
     */
    runScript(script) {
        return script.runInContext(this.global);
    }
    /**
     * Returns the VM context.
     *
     * @returns Context.
     */
    getVmContext() {
        return this.global;
    }
}
function isJestConfigVersion29(config) {
    return Object.getOwnPropertyDescriptor(config, 'globals') !== undefined;
}
function isJestConfigVersion28(config) {
    return Object.getOwnPropertyDescriptor(config, 'projectConfig') !== undefined;
}
//# sourceMappingURL=index.js.map