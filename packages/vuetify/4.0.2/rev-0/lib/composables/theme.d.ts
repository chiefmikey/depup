import type { App, DeepReadonly, InjectionKey, Ref } from 'vue';
import type { Color } from '../util/index.js';
type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export type ThemeOptions = false | {
    cspNonce?: string;
    defaultTheme?: 'light' | 'dark' | 'system' | (string & {});
    variations?: false | VariationsOptions;
    themes?: Record<string, ThemeDefinition>;
    stylesheetId?: string;
    scope?: string;
    utilities?: boolean;
};
export type ThemeDefinition = DeepPartial<InternalThemeDefinition>;
interface VariationsOptions {
    colors: string[];
    lighten: number;
    darken: number;
}
interface InternalThemeDefinition {
    dark: boolean;
    colors: Colors;
    variables: Record<string, string | number>;
}
export interface Colors extends BaseColors, OnColors {
    [key: string]: Color;
}
interface BaseColors {
    background: Color;
    surface: Color;
    primary: Color;
    secondary: Color;
    success: Color;
    warning: Color;
    error: Color;
    info: Color;
}
interface OnColors {
    'on-background': Color;
    'on-surface': Color;
    'on-primary': Color;
    'on-secondary': Color;
    'on-success': Color;
    'on-warning': Color;
    'on-error': Color;
    'on-info': Color;
}
export interface ThemeInstance {
    change: (themeName: string) => void;
    cycle: (themeArray?: string[]) => void;
    toggle: (themeArray?: [string, string]) => void;
    readonly isDisabled: boolean;
    readonly isSystem: Readonly<Ref<boolean>>;
    readonly themes: Ref<Record<string, InternalThemeDefinition>>;
    readonly name: Readonly<Ref<string>>;
    readonly current: DeepReadonly<Ref<InternalThemeDefinition>>;
    readonly computedThemes: DeepReadonly<Ref<Record<string, InternalThemeDefinition>>>;
    readonly prefix: string;
    readonly themeClasses: Readonly<Ref<string | undefined>>;
    readonly styles: Readonly<Ref<string>>;
    readonly global: {
        readonly name: Ref<string>;
        readonly current: DeepReadonly<Ref<InternalThemeDefinition>>;
    };
}
export declare const ThemeSymbol: InjectionKey<ThemeInstance>;
export declare const makeThemeProps: <Defaults extends {
    theme?: unknown;
} = {}>(defaults?: Defaults | undefined) => {
    theme: unknown extends Defaults["theme"] ? StringConstructor : {
        type: import("vue").PropType<unknown extends Defaults["theme"] ? string : string | Defaults["theme"]>;
        default: unknown extends Defaults["theme"] ? string : string | Defaults["theme"];
    };
};
// Composables
export declare function createTheme(options?: ThemeOptions): ThemeInstance & {
    install: (app: App) => void;
};
export declare function provideTheme(props: {
    theme?: string;
}): ThemeInstance;
export declare function useTheme(): ThemeInstance;

