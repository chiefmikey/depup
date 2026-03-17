"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enumerableKeysOf_js_1 = __importDefault(require("./enumerableKeysOf.js"));
const Optional_js_1 = __importDefault(require("../Optional.js"));
const Runtype_js_1 = __importDefault(require("../Runtype.js"));
const quoteWithBacktick_js_1 = __importDefault(require("./quoteWithBacktick.js"));
const quoteWithDoubleQuote_js_1 = __importDefault(require("./quoteWithDoubleQuote.js"));
/**
 * Return the display string for the stringified version of a type, e.g.
 *
 * - `Number` -> `` `${number}` ``
 * - `String` -> `string`
 * - `Literal(42)` -> `"42"`
 * - `Union(Literal("foo"), Number)` -> `` "foo" | `${number}` ``
 */
const showStringified = (circular) => (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "literal":
            return (0, quoteWithDoubleQuote_js_1.default)(globalThis.String(runtype.value));
        case "string":
            return "string";
        case "brand":
            return runtype.brand;
        case "constraint":
            return showStringified(circular)(runtype.underlying);
        case "union":
            return runtype.alternatives
                .map(alternative => showStringified(circular)(alternative))
                .join(" | ");
        case "intersect":
            return runtype.intersectees
                .map(alternative => showStringified(circular)(alternative))
                .join(" & ");
        default:
            break;
    }
    return `\`\${${show(false, circular)(runtype)}}\``;
};
/**
 * Return the display string which is to be embedded into the display string of
 * the surrounding template literal type, e.g.
 *
 * - `Number` -> `${number}`
 * - `String` -> `${string}`
 * - `Literal("foo")` -> `foo`
 * - `Union(Literal(42), Number)` -> `${"42" | number}`
 */
const showEmbedded = (circular) => (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "literal":
            return globalThis.String(runtype.value);
        case "brand":
            return `\${${runtype.brand}}`;
        case "constraint":
            return showEmbedded(circular)(runtype.underlying);
        case "union":
            if (runtype.alternatives.length === 1) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const inner = runtype.alternatives[0];
                return showEmbedded(circular)(inner);
            }
            break;
        case "intersect":
            if (runtype.intersectees.length === 1) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const inner = runtype.intersectees[0];
                return showEmbedded(circular)(inner);
            }
            break;
        default:
            break;
    }
    return `\${${show(false, circular)(runtype)}}`;
};
const show = (needsParens, circular) => (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    const parenthesize = (s) => (needsParens ? `(${s})` : s);
    if (circular.has(runtype))
        return parenthesize(`CIRCULAR ${runtype.tag}`);
    else
        circular.add(runtype);
    try {
        switch (runtype.tag) {
            // Primitive types
            case "unknown":
            case "never":
            case "boolean":
            case "number":
            case "bigint":
            case "string":
            case "function":
                return runtype.tag;
            case "symbol":
                return "key" in runtype
                    ? runtype.key === undefined
                        ? "unique symbol"
                        : "symbol" // TODO: <https://github.com/microsoft/TypeScript/issues/35909>
                    : "symbol";
            case "literal":
                return typeof runtype.value === "bigint"
                    ? globalThis.String(runtype.value) + "n"
                    : typeof runtype.value === "string"
                        ? (0, quoteWithDoubleQuote_js_1.default)(runtype.value)
                        : globalThis.String(runtype.value);
            // Complex types
            case "template": {
                if (runtype.strings.length === 0)
                    return '""';
                else if (runtype.strings.length === 1)
                    return (0, quoteWithDoubleQuote_js_1.default)(runtype.strings[0]);
                else if (runtype.strings.length === 2) {
                    if (runtype.strings.every(string => string === ""))
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        return showStringified(circular)(runtype.runtypes[0]);
                }
                let backtick = false;
                const inner = runtype.strings.reduce((inner, string, i) => {
                    const prefix = inner + string;
                    const r = runtype.runtypes[i];
                    if (r) {
                        const suffix = showEmbedded(circular)(r);
                        if (!backtick && suffix.startsWith("$"))
                            backtick = true;
                        return prefix + suffix;
                    }
                    else {
                        return prefix;
                    }
                }, "");
                return backtick ? (0, quoteWithBacktick_js_1.default)(inner) : (0, quoteWithDoubleQuote_js_1.default)(inner);
            }
            case "array":
                return `${show(true, circular)(runtype.element)}[]`;
            case "record":
                return `{ [_: ${show(false, circular)(runtype.key)}]: ${show(false, circular)(runtype.value)} }`;
            case "object": {
                const keys = (0, enumerableKeysOf_js_1.default)(runtype.fields);
                return ((runtype.isExact ? "exact " : "") +
                    (keys.length
                        ? `{ ${keys
                            .map(key => 
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        Optional_js_1.default.isOptional(runtype.fields[key])
                            ? `${key.toString()}?: ${show(false, circular)(runtype.fields[key].underlying)};`
                            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                `${key.toString()}: ${show(false, circular)(runtype.fields[key])};`)
                            .join(" ")} }`
                        : "{}"));
            }
            case "tuple": {
                if (!Array.isArray(runtype.components)) {
                    const components = runtype.components;
                    if (components.leading.length === 0 && components.trailing.length === 0) {
                        return show(needsParens, circular)(components.rest);
                    }
                    return `[${[
                        ...components.leading.map(component => show(false, circular)(component)),
                        `...${show(true, circular)(components.rest)}`,
                        ...components.trailing.map(component => show(false, circular)(component)),
                    ].join(", ")}]`;
                }
                else {
                    const components = runtype.components;
                    return `[${components.map(component => show(false, circular)(component)).join(", ")}]`;
                }
            }
            case "union":
                return parenthesize(`${runtype.alternatives.map(alternative => show(true, circular)(alternative)).join(" | ")}`);
            case "intersect":
                return parenthesize(`${runtype.intersectees.map(intersectee => show(true, circular)(intersectee)).join(" & ")}`);
            case "constraint":
                return show(needsParens, circular)(runtype.underlying);
            case "instanceof":
                return runtype.ctor.name || "(Anonymous class)";
            case "brand":
                return runtype.brand;
            case "parser":
                return show(needsParens, circular)(runtype.underlying);
        }
    }
    finally {
        circular.delete(runtype);
    }
};
exports.default = show(false, new Set());
