import type VM from 'vm';
import { ModuleMocker } from 'jest-mock';
import { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers';
import type { JestEnvironment, EnvironmentContext } from '@jest/environment';
import { Window } from 'happy-dom';
import type { Script } from 'vm';
import type { Global, Config } from '@jest/types';
/**
 * Happy DOM Jest Environment.
 */
export default class HappyDOMEnvironment implements JestEnvironment {
    fakeTimers: LegacyFakeTimers<number> | null;
    fakeTimersModern: ModernFakeTimers | null;
    window: Window;
    global: Global.Global;
    moduleMocker: ModuleMocker;
    /**
     * jest-environment-jsdom" has the default set to ['browser']
     * As changing this value would be a breaking change, we will keep it at ['node', 'node-addons'] until we do a major release
     *
     * @see https://stackoverflow.com/questions/72428323/jest-referenceerror-vue-is-not-defined
     */
    customExportConditions: string[];
    private _configuredExportConditions;
    /**
     * Constructor.
     *
     * @param config Jest config.
     * @param config.globalConfig jest global config.
     * @param config.projectConfig jest project config.
     * @param options Options.
     */
    constructor(config: {
        globalConfig: Config.GlobalConfig;
        projectConfig: Config.ProjectConfig;
    } | Config.ProjectConfig, options?: EnvironmentContext);
    /**
     * Respect any export conditions specified as options
     * https://jestjs.io/docs/configuration#testenvironmentoptions-object
     */
    exportConditions(): string[];
    /**
     * Setup.
     *
     * @returns Promise.
     */
    setup(): Promise<void>;
    /**
     * Teardown.
     *
     * @returns Promise.
     */
    teardown(): Promise<void>;
    /**
     * Runs a script.
     *
     * @param script Script.
     * @returns Result.
     */
    runScript(script: Script): null;
    /**
     * Returns the VM context.
     *
     * @returns Context.
     */
    getVmContext(): VM.Context;
}
//# sourceMappingURL=index.d.ts.map