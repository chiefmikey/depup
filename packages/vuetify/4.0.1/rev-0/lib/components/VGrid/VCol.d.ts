// Styles

// Types
import type { PropType } from 'vue';
export declare const makeVColProps: <Defaults extends {
    class?: unknown;
    style?: unknown;
    tag?: unknown;
    cols?: unknown;
    offset?: unknown;
    order?: unknown;
    orderSm?: unknown;
    orderMd?: unknown;
    orderLg?: unknown;
    orderXl?: unknown;
    orderXxl?: unknown;
    alignSelf?: unknown;
    alignSelfSm?: unknown;
    alignSelfMd?: unknown;
    alignSelfLg?: unknown;
    alignSelfXl?: unknown;
    alignSelfXxl?: unknown;
    lg?: unknown;
    md?: unknown;
    offsetLg?: unknown;
    offsetMd?: unknown;
    offsetSm?: unknown;
    offsetXl?: unknown;
    offsetXxl?: unknown;
    sm?: unknown;
    xl?: unknown;
    xxl?: unknown;
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
    cols: unknown extends Defaults["cols"] ? {
        type: (BooleanConstructor | NumberConstructor | StringConstructor)[];
        default: boolean;
    } : Omit<{
        type: (BooleanConstructor | NumberConstructor | StringConstructor)[];
        default: boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["cols"] ? string | number | boolean : string | number | boolean | Defaults["cols"]>;
        default: unknown extends Defaults["cols"] ? string | number | boolean : Defaults["cols"] | NonNullable<string | number | boolean>;
    };
    offset: unknown extends Defaults["offset"] ? {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    } : Omit<{
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["offset"] ? string | number : string | number | Defaults["offset"]>;
        default: unknown extends Defaults["offset"] ? string | number : Defaults["offset"] | NonNullable<string | number>;
    };
    order: unknown extends Defaults["order"] ? {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    } : Omit<{
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["order"] ? string | number : string | number | Defaults["order"]>;
        default: unknown extends Defaults["order"] ? string | number : Defaults["order"] | NonNullable<string | number>;
    };
    orderSm: unknown extends Defaults["orderSm"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["orderSm"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["orderSm"]>;
        default: unknown extends Defaults["orderSm"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["orderSm"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    orderMd: unknown extends Defaults["orderMd"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["orderMd"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["orderMd"]>;
        default: unknown extends Defaults["orderMd"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["orderMd"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    orderLg: unknown extends Defaults["orderLg"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["orderLg"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["orderLg"]>;
        default: unknown extends Defaults["orderLg"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["orderLg"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    orderXl: unknown extends Defaults["orderXl"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["orderXl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["orderXl"]>;
        default: unknown extends Defaults["orderXl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["orderXl"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    orderXxl: unknown extends Defaults["orderXxl"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["orderXxl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["orderXxl"]>;
        default: unknown extends Defaults["orderXxl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["orderXxl"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSelf: unknown extends Defaults["alignSelf"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSelf"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSelf"]>;
        default: unknown extends Defaults["alignSelf"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSelf"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSelfSm: unknown extends Defaults["alignSelfSm"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSelfSm"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSelfSm"]>;
        default: unknown extends Defaults["alignSelfSm"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSelfSm"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSelfMd: unknown extends Defaults["alignSelfMd"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSelfMd"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSelfMd"]>;
        default: unknown extends Defaults["alignSelfMd"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSelfMd"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSelfLg: unknown extends Defaults["alignSelfLg"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSelfLg"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSelfLg"]>;
        default: unknown extends Defaults["alignSelfLg"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSelfLg"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSelfXl: unknown extends Defaults["alignSelfXl"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSelfXl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSelfXl"]>;
        default: unknown extends Defaults["alignSelfXl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSelfXl"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    alignSelfXxl: unknown extends Defaults["alignSelfXxl"] ? {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    } : Omit<{
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["alignSelfXxl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : "auto" | "baseline" | "center" | "end" | "start" | "stretch" | Defaults["alignSelfXxl"]>;
        default: unknown extends Defaults["alignSelfXxl"] ? "auto" | "baseline" | "center" | "end" | "start" | "stretch" : Defaults["alignSelfXxl"] | NonNullable<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
    };
    lg: unknown extends Defaults["lg"] ? {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    } : Omit<{
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["lg"] ? string | number | boolean : string | number | boolean | Defaults["lg"]>;
        default: unknown extends Defaults["lg"] ? string | number | boolean : Defaults["lg"] | NonNullable<string | number | boolean>;
    };
    md: unknown extends Defaults["md"] ? {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    } : Omit<{
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["md"] ? string | number | boolean : string | number | boolean | Defaults["md"]>;
        default: unknown extends Defaults["md"] ? string | number | boolean : Defaults["md"] | NonNullable<string | number | boolean>;
    };
    offsetLg: unknown extends Defaults["offsetLg"] ? {
        type: [StringConstructor, NumberConstructor];
        default: null;
    } : Omit<{
        type: [StringConstructor, NumberConstructor];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["offsetLg"] ? string | number : string | number | Defaults["offsetLg"]>;
        default: unknown extends Defaults["offsetLg"] ? string | number : Defaults["offsetLg"] | NonNullable<string | number>;
    };
    offsetMd: unknown extends Defaults["offsetMd"] ? {
        type: [StringConstructor, NumberConstructor];
        default: null;
    } : Omit<{
        type: [StringConstructor, NumberConstructor];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["offsetMd"] ? string | number : string | number | Defaults["offsetMd"]>;
        default: unknown extends Defaults["offsetMd"] ? string | number : Defaults["offsetMd"] | NonNullable<string | number>;
    };
    offsetSm: unknown extends Defaults["offsetSm"] ? {
        type: [StringConstructor, NumberConstructor];
        default: null;
    } : Omit<{
        type: [StringConstructor, NumberConstructor];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["offsetSm"] ? string | number : string | number | Defaults["offsetSm"]>;
        default: unknown extends Defaults["offsetSm"] ? string | number : Defaults["offsetSm"] | NonNullable<string | number>;
    };
    offsetXl: unknown extends Defaults["offsetXl"] ? {
        type: [StringConstructor, NumberConstructor];
        default: null;
    } : Omit<{
        type: [StringConstructor, NumberConstructor];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["offsetXl"] ? string | number : string | number | Defaults["offsetXl"]>;
        default: unknown extends Defaults["offsetXl"] ? string | number : Defaults["offsetXl"] | NonNullable<string | number>;
    };
    offsetXxl: unknown extends Defaults["offsetXxl"] ? {
        type: [StringConstructor, NumberConstructor];
        default: null;
    } : Omit<{
        type: [StringConstructor, NumberConstructor];
        default: null;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["offsetXxl"] ? string | number : string | number | Defaults["offsetXxl"]>;
        default: unknown extends Defaults["offsetXxl"] ? string | number : Defaults["offsetXxl"] | NonNullable<string | number>;
    };
    sm: unknown extends Defaults["sm"] ? {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    } : Omit<{
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["sm"] ? string | number | boolean : string | number | boolean | Defaults["sm"]>;
        default: unknown extends Defaults["sm"] ? string | number | boolean : Defaults["sm"] | NonNullable<string | number | boolean>;
    };
    xl: unknown extends Defaults["xl"] ? {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    } : Omit<{
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["xl"] ? string | number | boolean : string | number | boolean | Defaults["xl"]>;
        default: unknown extends Defaults["xl"] ? string | number | boolean : Defaults["xl"] | NonNullable<string | number | boolean>;
    };
    xxl: unknown extends Defaults["xxl"] ? {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    } : Omit<{
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    }, "default" | "type"> & {
        type: PropType<unknown extends Defaults["xxl"] ? string | number | boolean : string | number | boolean | Defaults["xxl"]>;
        default: unknown extends Defaults["xxl"] ? string | number | boolean : Defaults["xxl"] | NonNullable<string | number | boolean>;
    };
};
export declare const VCol: {
    new (...args: any[]): import("vue").CreateComponentPublicInstanceWithMixins<{
        style: string | false | import("vue").StyleValue[] | import("vue").CSSProperties | null;
        tag: string | import("../../util/index.js").JSXComponent;
        cols: string | number | boolean;
        offset: string | number;
        order: string | number;
        orderSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelf: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        lg: string | number | boolean;
        md: string | number | boolean;
        offsetLg: string | number;
        offsetMd: string | number;
        offsetSm: string | number;
        offsetXl: string | number;
        offsetXxl: string | number;
        sm: string | number | boolean;
        xl: string | number | boolean;
        xxl: string | number | boolean;
    } & {
        class?: any;
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
        tag: string | import("../../util/index.js").JSXComponent;
        cols: string | number | boolean;
        offset: string | number;
        order: string | number;
        orderSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelf: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        lg: string | number | boolean;
        md: string | number | boolean;
        offsetLg: string | number;
        offsetMd: string | number;
        offsetSm: string | number;
        offsetXl: string | number;
        offsetXxl: string | number;
        sm: string | number | boolean;
        xl: string | number | boolean;
        xxl: string | number | boolean;
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
        tag: string | import("../../util/index.js").JSXComponent;
        cols: string | number | boolean;
        offset: string | number;
        order: string | number;
        orderSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelf: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        lg: string | number | boolean;
        md: string | number | boolean;
        offsetLg: string | number;
        offsetMd: string | number;
        offsetSm: string | number;
        offsetXl: string | number;
        offsetXxl: string | number;
        sm: string | number | boolean;
        xl: string | number | boolean;
        xxl: string | number | boolean;
    } & {
        class?: any;
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
        tag: string | import("../../util/index.js").JSXComponent;
        cols: string | number | boolean;
        offset: string | number;
        order: string | number;
        orderSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        orderXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelf: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        alignSelfXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
        lg: string | number | boolean;
        md: string | number | boolean;
        offsetLg: string | number;
        offsetMd: string | number;
        offsetSm: string | number;
        offsetXl: string | number;
        offsetXxl: string | number;
        sm: string | number | boolean;
        xl: string | number | boolean;
        xxl: string | number | boolean;
    }>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import("vue").ComponentOptionsBase<{
    style: string | false | import("vue").StyleValue[] | import("vue").CSSProperties | null;
    tag: string | import("../../util/index.js").JSXComponent;
    cols: string | number | boolean;
    offset: string | number;
    order: string | number;
    orderSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelf: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    lg: string | number | boolean;
    md: string | number | boolean;
    offsetLg: string | number;
    offsetMd: string | number;
    offsetSm: string | number;
    offsetXl: string | number;
    offsetXxl: string | number;
    sm: string | number | boolean;
    xl: string | number | boolean;
    xxl: string | number | boolean;
} & {
    class?: any;
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
    tag: string | import("../../util/index.js").JSXComponent;
    cols: string | number | boolean;
    offset: string | number;
    order: string | number;
    orderSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    orderXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelf: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfSm: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfMd: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfLg: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfXl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    alignSelfXxl: "auto" | "baseline" | "center" | "end" | "start" | "stretch";
    lg: string | number | boolean;
    md: string | number | boolean;
    offsetLg: string | number;
    offsetMd: string | number;
    offsetSm: string | number;
    offsetXl: string | number;
    offsetXxl: string | number;
    sm: string | number | boolean;
    xl: string | number | boolean;
    xxl: string | number | boolean;
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
    tag: {
        type: PropType<string | import("../../util/index.js").JSXComponent>;
        default: string;
    };
    cols: {
        type: (BooleanConstructor | NumberConstructor | StringConstructor)[];
        default: boolean;
    };
    offset: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    order: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    orderSm: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderMd: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderLg: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderXl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderXxl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    alignSelf: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfSm: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfMd: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfLg: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfXl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfXxl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    lg: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    md: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    offsetLg: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetMd: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetSm: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetXl: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetXxl: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    sm: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    xl: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    xxl: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
}, import("vue").ExtractPropTypes<{
    class: PropType<any>;
    style: {
        type: PropType<import("vue").StyleValue>;
        default: null;
    };
    tag: {
        type: PropType<string | import("../../util/index.js").JSXComponent>;
        default: string;
    };
    cols: {
        type: (BooleanConstructor | NumberConstructor | StringConstructor)[];
        default: boolean;
    };
    offset: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    order: {
        type: (NumberConstructor | StringConstructor)[];
        default: null;
    };
    orderSm: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderMd: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderLg: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderXl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    orderXxl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
    };
    alignSelf: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfSm: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfMd: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfLg: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfXl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    alignSelfXxl: {
        type: PropType<"auto" | "baseline" | "center" | "end" | "start" | "stretch">;
        default: null;
        validator: (str: any) => boolean;
    };
    lg: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    md: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    offsetLg: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetMd: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetSm: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetXl: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    offsetXxl: {
        type: [StringConstructor, NumberConstructor];
        default: null;
    };
    sm: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    xl: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
    xxl: {
        type: [BooleanConstructor, StringConstructor, NumberConstructor];
        default: false;
    };
}>>;
export type VCol = InstanceType<typeof VCol>;
