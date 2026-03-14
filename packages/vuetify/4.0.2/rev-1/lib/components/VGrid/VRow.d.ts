// Styles

// Types
import type { PropType } from 'vue';
export declare const makeVRowProps: <Defaults extends {
    class?: unknown;
    style?: unknown;
    density?: unknown;
    tag?: unknown;
    dense?: unknown;
    align?: unknown;
    alignSm?: unknown;
    alignMd?: unknown;
    alignLg?: unknown;
    alignXl?: unknown;
    alignXxl?: unknown;
    justify?: unknown;
    justifySm?: unknown;
    justifyMd?: unknown;
    justifyLg?: unknown;
    justifyXl?: unknown;
    justifyXxl?: unknown;
    alignContent?: unknown;
    alignContentSm?: unknown;
    alignContentMd?: unknown;
    alignContentLg?: unknown;
    alignContentXl?: unknown;
    alignContentXxl?: unknown;
    noGutters?: unknown;
    gap?: unknown;
    size?: unknown;
} = {}>(defaults?: Defaults | undefined) => {
    class: unknown extends Defaults["class"] ? PropType<any> : {
        type: PropType<unknown extends Defaults["class"] ? any : any>;
        default: unknown extends Defaults["class"] ? any : any;
    };
    style: unknown extends Defaults["style"] ? {
        type: PropType<import("vue").StyleValue>;
        default: null;
    } : Omit<{
        type: PropType<import("vue").StyleValue>;
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["style"] ? import("vue").StyleValue : Defaults["style"] | import("vue").StyleValue>;
        default: unknown extends Defaults["style"] ? import("vue").StyleValue : Defaults["style"] | NonNullable<import("vue").StyleValue>;
    };
    density: unknown extends Defaults["density"] ? {
        type: PropType<import("../../composables/density.js").Density>;
        default: string;
        validator: (v: any) => boolean;
    } : Omit<{
        type: PropType<import("../../composables/density.js").Density>;
        default: string;
        validator: (v: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["density"] ? import("../../composables/density.js").Density : Defaults["density"] | import("../../composables/density.js").Density>;
        default: unknown extends Defaults["density"] ? import("../../composables/density.js").Density : Defaults["density"] | NonNullable<import("../../composables/density.js").Density>;
    };
    tag: unknown extends Defaults["tag"] ? {
        type: PropType<string | import("../../util/index.js").JSXComponent>;
        default: string;
    } : Omit<{
        type: PropType<string | import("../../util/index.js").JSXComponent>;
        default: string;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["tag"] ? string | import("../../util/index.js").JSXComponent : string | Defaults["tag"] | import("../../util/index.js").JSXComponent>;
        default: unknown extends Defaults["tag"] ? string | import("../../util/index.js").JSXComponent : Defaults["tag"] | NonNullable<string | import("../../util/index.js").JSXComponent>;
    };
    dense: unknown extends Defaults["dense"] ? BooleanConstructor : {
        type: PropType<unknown extends Defaults["dense"] ? boolean : boolean | Defaults["dense"]>;
        default: unknown extends Defaults["dense"] ? boolean : boolean | Defaults["dense"];
    };
    align: unknown extends Defaults["align"] ? {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["align"] ? "baseline" | "center" | "end" | "start" | "stretch" : "baseline" | "center" | "end" | "start" | "stretch" | Defaults["align"]>;
        default: unknown extends Defaults["align"] ? "baseline" | "center" | "end" | "start" | "stretch" : Defaults["align"] | NonNullable<"baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSm: unknown extends Defaults["alignSm"] ? {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSm"] ? "baseline" | "center" | "end" | "start" | "stretch" : "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSm"]>;
        default: unknown extends Defaults["alignSm"] ? "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSm"] | NonNullable<"baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignMd: unknown extends Defaults["alignMd"] ? {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignMd"] ? "baseline" | "center" | "end" | "start" | "stretch" : "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignMd"]>;
        default: unknown extends Defaults["alignMd"] ? "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignMd"] | NonNullable<"baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignLg: unknown extends Defaults["alignLg"] ? {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignLg"] ? "baseline" | "center" | "end" | "start" | "stretch" : "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignLg"]>;
        default: unknown extends Defaults["alignLg"] ? "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignLg"] | NonNullable<"baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignXl: unknown extends Defaults["alignXl"] ? {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignXl"] ? "baseline" | "center" | "end" | "start" | "stretch" : "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignXl"]>;
        default: unknown extends Defaults["alignXl"] ? "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignXl"] | NonNullable<"baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignXxl: unknown extends Defaults["alignXxl"] ? {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignXxl"] ? "baseline" | "center" | "end" | "start" | "stretch" : "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignXxl"]>;
        default: unknown extends Defaults["alignXxl"] ? "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignXxl"] | NonNullable<"baseline" | "center" | "end" | "start" | "stretch">;
    };
    justify: unknown extends Defaults["justify"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["justify"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | Defaults["justify"]>;
        default: unknown extends Defaults["justify"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : Defaults["justify"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
    };
    justifySm: unknown extends Defaults["justifySm"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["justifySm"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | Defaults["justifySm"]>;
        default: unknown extends Defaults["justifySm"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : Defaults["justifySm"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
    };
    justifyMd: unknown extends Defaults["justifyMd"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["justifyMd"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | Defaults["justifyMd"]>;
        default: unknown extends Defaults["justifyMd"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : Defaults["justifyMd"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
    };
    justifyLg: unknown extends Defaults["justifyLg"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["justifyLg"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | Defaults["justifyLg"]>;
        default: unknown extends Defaults["justifyLg"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : Defaults["justifyLg"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
    };
    justifyXl: unknown extends Defaults["justifyXl"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["justifyXl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | Defaults["justifyXl"]>;
        default: unknown extends Defaults["justifyXl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : Defaults["justifyXl"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
    };
    justifyXxl: unknown extends Defaults["justifyXxl"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["justifyXxl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | Defaults["justifyXxl"]>;
        default: unknown extends Defaults["justifyXxl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" : Defaults["justifyXxl"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
    };
    alignContent: unknown extends Defaults["alignContent"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignContent"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" | Defaults["alignContent"]>;
        default: unknown extends Defaults["alignContent"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : Defaults["alignContent"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
    };
    alignContentSm: unknown extends Defaults["alignContentSm"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignContentSm"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" | Defaults["alignContentSm"]>;
        default: unknown extends Defaults["alignContentSm"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : Defaults["alignContentSm"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
    };
    alignContentMd: unknown extends Defaults["alignContentMd"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignContentMd"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" | Defaults["alignContentMd"]>;
        default: unknown extends Defaults["alignContentMd"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : Defaults["alignContentMd"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
    };
    alignContentLg: unknown extends Defaults["alignContentLg"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignContentLg"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" | Defaults["alignContentLg"]>;
        default: unknown extends Defaults["alignContentLg"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : Defaults["alignContentLg"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
    };
    alignContentXl: unknown extends Defaults["alignContentXl"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignContentXl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" | Defaults["alignContentXl"]>;
        default: unknown extends Defaults["alignContentXl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : Defaults["alignContentXl"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
    };
    alignContentXxl: unknown extends Defaults["alignContentXxl"] ? {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignContentXxl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" | Defaults["alignContentXxl"]>;
        default: unknown extends Defaults["alignContentXxl"] ? "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch" : Defaults["alignContentXxl"] | NonNullable<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
    };
    noGutters: unknown extends Defaults["noGutters"] ? BooleanConstructor : {
        type: PropType<unknown extends Defaults["noGutters"] ? boolean : boolean | Defaults["noGutters"]>;
        default: unknown extends Defaults["noGutters"] ? boolean : boolean | Defaults["noGutters"];
    };
    gap: unknown extends Defaults["gap"] ? PropType<string | number | (string | number)[]> : {
        type: PropType<unknown extends Defaults["gap"] ? string | number | (string | number)[] : string | number | (string | number)[] | Defaults["gap"]>;
        default: unknown extends Defaults["gap"] ? string | number | (string | number)[] : Defaults["gap"] | NonNullable<string | number | (string | number)[]>;
    };
    size: unknown extends Defaults["size"] ? (NumberConstructor | StringConstructor)[] : {
        type: PropType<unknown extends Defaults["size"] ? string | number : string | number | Defaults["size"]>;
        default: unknown extends Defaults["size"] ? string | number : Defaults["size"] | NonNullable<string | number>;
    };
};
export declare const VRow: {
    new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<{
        style: string | false | import("vue").StyleValue[] | import("vue").CSSProperties | null;
        density: import("../../composables/density.js").Density;
        tag: string | import("../../util/index.js").JSXComponent;
        dense: boolean;
        align: "baseline" | "center" | "end" | "start" | "stretch";
        alignSm: "baseline" | "center" | "end" | "start" | "stretch";
        alignMd: "baseline" | "center" | "end" | "start" | "stretch";
        alignLg: "baseline" | "center" | "end" | "start" | "stretch";
        alignXl: "baseline" | "center" | "end" | "start" | "stretch";
        alignXxl: "baseline" | "center" | "end" | "start" | "stretch";
        justify: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifySm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        alignContent: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentSm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        noGutters: boolean;
    } & {
        class?: any;
        gap?: string | number | (string | number)[] | undefined;
        size?: string | number | undefined;
    } & {
        $children?: {
            default?: (() => import("vue").VNodeChild) | undefined;
        } | {
            $stable?: boolean | undefined;
        } | (() => import("vue").VNodeChild) | import("vue").VNodeChild;
        "v-slots"?: {
            default?: false | (() => import("vue").VNodeChild) | undefined;
        } | undefined;
    } & {
        "v-slot:default"?: false | (() => import("vue").VNodeChild) | undefined;
    }, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, Record<string, any>, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, {
        style: import("vue").StyleValue;
        density: import("../../composables/density.js").Density;
        tag: string | import("../../util/index.js").JSXComponent;
        dense: boolean;
        align: "baseline" | "center" | "end" | "start" | "stretch";
        alignSm: "baseline" | "center" | "end" | "start" | "stretch";
        alignMd: "baseline" | "center" | "end" | "start" | "stretch";
        alignLg: "baseline" | "center" | "end" | "start" | "stretch";
        alignXl: "baseline" | "center" | "end" | "start" | "stretch";
        alignXxl: "baseline" | "center" | "end" | "start" | "stretch";
        justify: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifySm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        alignContent: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentSm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        noGutters: boolean;
    }, true, {}, import("vue").SlotsType<Partial<{
        default: () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>[];
    }>>, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, {}, any, import("vue").ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, {
        style: string | false | import("vue").StyleValue[] | import("vue").CSSProperties | null;
        density: import("../../composables/density.js").Density;
        tag: string | import("../../util/index.js").JSXComponent;
        dense: boolean;
        align: "baseline" | "center" | "end" | "start" | "stretch";
        alignSm: "baseline" | "center" | "end" | "start" | "stretch";
        alignMd: "baseline" | "center" | "end" | "start" | "stretch";
        alignLg: "baseline" | "center" | "end" | "start" | "stretch";
        alignXl: "baseline" | "center" | "end" | "start" | "stretch";
        alignXxl: "baseline" | "center" | "end" | "start" | "stretch";
        justify: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifySm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        alignContent: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentSm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        noGutters: boolean;
    } & {
        class?: any;
        gap?: string | number | (string | number)[] | undefined;
        size?: string | number | undefined;
    } & {
        $children?: {
            default?: (() => import("vue").VNodeChild) | undefined;
        } | {
            $stable?: boolean | undefined;
        } | (() => import("vue").VNodeChild) | import("vue").VNodeChild;
        "v-slots"?: {
            default?: false | (() => import("vue").VNodeChild) | undefined;
        } | undefined;
    } & {
        "v-slot:default"?: false | (() => import("vue").VNodeChild) | undefined;
    }, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>, {}, {}, {}, {
        style: import("vue").StyleValue;
        density: import("../../composables/density.js").Density;
        tag: string | import("../../util/index.js").JSXComponent;
        dense: boolean;
        align: "baseline" | "center" | "end" | "start" | "stretch";
        alignSm: "baseline" | "center" | "end" | "start" | "stretch";
        alignMd: "baseline" | "center" | "end" | "start" | "stretch";
        alignLg: "baseline" | "center" | "end" | "start" | "stretch";
        alignXl: "baseline" | "center" | "end" | "start" | "stretch";
        alignXxl: "baseline" | "center" | "end" | "start" | "stretch";
        justify: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifySm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        justifyXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
        alignContent: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentSm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        alignContentXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
        noGutters: boolean;
    }>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import("vue").ComponentOptionsBase<{
    style: string | false | import("vue").StyleValue[] | import("vue").CSSProperties | null;
    density: import("../../composables/density.js").Density;
    tag: string | import("../../util/index.js").JSXComponent;
    dense: boolean;
    align: "baseline" | "center" | "end" | "start" | "stretch";
    alignSm: "baseline" | "center" | "end" | "start" | "stretch";
    alignMd: "baseline" | "center" | "end" | "start" | "stretch";
    alignLg: "baseline" | "center" | "end" | "start" | "stretch";
    alignXl: "baseline" | "center" | "end" | "start" | "stretch";
    alignXxl: "baseline" | "center" | "end" | "start" | "stretch";
    justify: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifySm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    alignContent: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentSm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    noGutters: boolean;
} & {
    class?: any;
    gap?: string | number | (string | number)[] | undefined;
    size?: string | number | undefined;
} & {
    $children?: {
        default?: (() => import("vue").VNodeChild) | undefined;
    } | {
        $stable?: boolean | undefined;
    } | (() => import("vue").VNodeChild) | import("vue").VNodeChild;
    "v-slots"?: {
        default?: false | (() => import("vue").VNodeChild) | undefined;
    } | undefined;
} & {
    "v-slot:default"?: false | (() => import("vue").VNodeChild) | undefined;
}, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}>, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, Record<string, any>, string, {
    style: import("vue").StyleValue;
    density: import("../../composables/density.js").Density;
    tag: string | import("../../util/index.js").JSXComponent;
    dense: boolean;
    align: "baseline" | "center" | "end" | "start" | "stretch";
    alignSm: "baseline" | "center" | "end" | "start" | "stretch";
    alignMd: "baseline" | "center" | "end" | "start" | "stretch";
    alignLg: "baseline" | "center" | "end" | "start" | "stretch";
    alignXl: "baseline" | "center" | "end" | "start" | "stretch";
    alignXxl: "baseline" | "center" | "end" | "start" | "stretch";
    justify: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifySm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    justifyXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start";
    alignContent: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentSm: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentMd: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentLg: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentXl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    alignContentXxl: "center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch";
    noGutters: boolean;
}, {}, string, import("vue").SlotsType<Partial<{
    default: () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>[];
}>>, import("vue").GlobalComponents, import("vue").GlobalDirectives, string, import("vue").ComponentProvideOptions> & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps & import("../../util/index.js").FilterPropsOptions<{
    class: PropType<any>;
    style: {
        type: PropType<import("vue").StyleValue>;
        default: null;
    };
    density: {
        type: PropType<import("../../composables/density.js").Density>;
        default: string;
        validator: (v: any) => boolean;
    };
    tag: {
        type: PropType<string | import("../../util/index.js").JSXComponent>;
        default: string;
    };
    dense: BooleanConstructor;
    align: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSm: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignMd: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignLg: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignXl: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignXxl: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    justify: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifySm: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyMd: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyLg: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyXl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyXxl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContent: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentSm: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentMd: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentLg: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentXl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentXxl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    noGutters: BooleanConstructor;
    gap: PropType<string | number | (string | number)[]>;
    size: (NumberConstructor | StringConstructor)[];
}, import("vue").ExtractPropTypes<{
    class: PropType<any>;
    style: {
        type: PropType<import("vue").StyleValue>;
        default: null;
    };
    density: {
        type: PropType<import("../../composables/density.js").Density>;
        default: string;
        validator: (v: any) => boolean;
    };
    tag: {
        type: PropType<string | import("../../util/index.js").JSXComponent>;
        default: string;
    };
    dense: BooleanConstructor;
    align: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSm: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignMd: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignLg: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignXl: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignXxl: {
        type: PropType<"baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    justify: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifySm: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyMd: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyLg: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyXl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    justifyXxl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContent: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentSm: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentMd: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentLg: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentXl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignContentXxl: {
        type: PropType<"center" | "end" | "space-around" | "space-between" | "space-evenly" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    noGutters: BooleanConstructor;
    gap: PropType<string | number | (string | number)[]>;
    size: (NumberConstructor | StringConstructor)[];
}>>;
export type VRow = InstanceType<typeof VRow>;
