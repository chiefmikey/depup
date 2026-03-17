"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const escapeRegExp_js_1 = __importDefault(require("./utils-internal/escapeRegExp.js"));
const typeOf_js_1 = __importDefault(require("./utils-internal/typeOf.js"));
const parseArgs = (args) => {
    // If the first element is an `Array`, maybe it's called by the tagged style
    if (0 < args.length && Array.isArray(args[0])) {
        const [strings, ...runtypes] = args;
        // For further manipulation, recreate an `Array` because `TemplateStringsArray` is readonly
        return [Array.from(strings), runtypes];
    }
    else {
        const convenient = args;
        const strings = convenient.reduce((strings, arg) => {
            // Concatenate every consecutive literals as strings
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (!Runtype_js_1.default.isRuntype(arg))
                strings.push(strings.pop() + String(arg));
            // Skip runtypes
            else
                strings.push("");
            return strings;
        }, [""]);
        const runtypes = convenient.filter(Runtype_js_1.default.isRuntype);
        return [strings, runtypes];
    }
};
/**
 * Flatten inner runtypes of a `Template` if possible, with in-place strategy
 */
const flattenInnerRuntypes = (strings, runtypes) => {
    for (let i = 0; i < runtypes.length;) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const runtype = runtypes[i];
        switch (runtype.tag) {
            case "literal": {
                const literal = runtype;
                runtypes.splice(i, 1);
                const string = String(literal.value);
                strings.splice(i, 2, strings[i] + string + strings[i + 1]);
                break;
            }
            case "template": {
                const template = runtype;
                runtypes.splice(i, 1, ...template.runtypes);
                const innerStrings = template.strings;
                if (innerStrings.length === 1) {
                    strings.splice(i, 2, strings[i] + innerStrings[0] + strings[i + 1]);
                }
                else {
                    const first = innerStrings[0];
                    const rest = innerStrings.slice(1, -1);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const last = innerStrings[innerStrings.length - 1];
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    strings.splice(i, 2, strings[i] + first, ...rest, last + strings[i + 1]);
                }
                break;
            }
            case "union": {
                const union = runtype;
                if (union.alternatives.length === 1) {
                    try {
                        const literal = getInnerLiteral(union);
                        runtypes.splice(i, 1);
                        const string = String(literal.value);
                        strings.splice(i, 2, strings[i] + string + strings[i + 1]);
                        break;
                    }
                    catch (_) {
                        i++;
                        break;
                    }
                }
                else {
                    i++;
                    break;
                }
            }
            case "intersect": {
                const intersect = runtype;
                if (intersect.intersectees.length === 1) {
                    try {
                        const literal = getInnerLiteral(intersect);
                        runtypes.splice(i, 1);
                        const string = String(literal.value);
                        strings.splice(i, 2, strings[i] + string + strings[i + 1]);
                        break;
                    }
                    catch (_) {
                        i++;
                        break;
                    }
                }
                else {
                    i++;
                    break;
                }
            }
            default:
                i++;
                break;
        }
    }
};
const normalizeArgs = (args) => {
    const [strings, runtypes] = parseArgs(args);
    flattenInnerRuntypes(strings, runtypes);
    return [strings, runtypes];
};
const getInnerLiteral = (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "literal":
            return runtype;
        case "brand":
            return getInnerLiteral(runtype.entity);
        case "union":
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (runtype.alternatives.length === 1)
                return getInnerLiteral(runtype.alternatives[0]);
            break;
        case "intersect":
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (runtype.intersectees.length === 1)
                return getInnerLiteral(runtype.intersectees[0]);
            break;
        default:
            break;
    }
    throw undefined;
};
const identity = s => s;
const revivers = {
    string: [s => String(s), ".*"],
    number: [
        s => Number(s),
        "[+-]?(?:\\d*\\.\\d+|\\d+\\.\\d*|\\d+)(?:[Ee][+-]?\\d+)?",
        "0[Bb][01]+",
        "0[Oo][0-7]+",
        "0[Xx][0-9A-Fa-f]+",
        // Note: `"NaN"` isn't here, as TS doesn't allow `"NaN"` to be a `` `${number}` ``
    ],
    bigint: [s => BigInt(s), "-?[1-9]d*"],
    boolean: [s => (s === "false" ? false : true), "true", "false"],
    null: [() => null, "null"],
    undefined: [() => undefined, "undefined"],
};
const getReviversFor = (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "literal": {
            const [reviver] = revivers[(0, typeOf_js_1.default)(runtype.value)] || [identity];
            return reviver;
        }
        case "brand":
            return getReviversFor(runtype.entity);
        case "constraint":
            return getReviversFor(runtype.underlying);
        case "union":
            return runtype.alternatives.map(alternative => getReviversFor(alternative));
        case "intersect":
            return runtype.intersectees.map(alternative => getReviversFor(alternative));
        default: {
            const [reviver] = revivers[runtype.tag] || [identity];
            return reviver;
        }
    }
};
/** Recursively map corresponding reviver and  */
const reviveValidate = (expected, innerValidate, parsing) => (received) => {
    Runtype_js_1.default.assertIsRuntype(expected);
    const revivers = getReviversFor(expected);
    if (Array.isArray(revivers)) {
        switch (expected.tag) {
            case "union":
                for (const alternative of expected.alternatives) {
                    const validated = reviveValidate(alternative, innerValidate, parsing)(received);
                    if (validated.success)
                        return validated;
                }
                return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received });
            case "intersect": {
                let parsed = undefined;
                for (const intersectee of expected.intersectees) {
                    const validated = reviveValidate(intersectee, innerValidate, parsing)(received);
                    if (!validated.success)
                        return validated;
                    parsed = validated.value;
                }
                return (0, SUCCESS_js_1.default)(parsing ? parsed : received);
            }
            default:
                /* istanbul ignore next */
                throw Error("impossible");
        }
    }
    else {
        const reviver = revivers;
        const validated = innerValidate({ expected, received: reviver(received), parsing });
        if (!validated.success && validated.code === "VALUE_INCORRECT" && expected.tag === "literal")
            // TODO: Temporary fix to show unrevived value in message; needs refactor
            return FAILURE_js_1.default.VALUE_INCORRECT({ expected, received });
        return validated;
    }
};
const getRegExpPatternFor = (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "literal":
            return (0, escapeRegExp_js_1.default)(String(runtype.value));
        case "brand":
            return getRegExpPatternFor(runtype.entity);
        case "constraint":
            return getRegExpPatternFor(runtype.underlying);
        case "union":
            return runtype.alternatives
                .map(alternative => getRegExpPatternFor(alternative))
                .join("|");
        case "template": {
            return runtype.strings.map(escapeRegExp_js_1.default).reduce((pattern, string, i) => {
                const prefix = pattern + string;
                const r = runtype.runtypes[i];
                if (r)
                    return prefix + `(?:${getRegExpPatternFor(r)})`;
                else
                    return prefix;
            }, "");
        }
        default: {
            const [, ...patterns] = revivers[runtype.tag] || [undefined, ".*"];
            return patterns.join("|");
        }
    }
};
const createRegExpForTemplate = (template) => {
    const pattern = template.strings.map(escapeRegExp_js_1.default).reduce((pattern, string, i) => {
        const prefix = pattern + string;
        const r = template.runtypes[i];
        if (r)
            return prefix + `(${getRegExpPatternFor(r)})`;
        else
            return prefix;
    }, "");
    return new RegExp(`^${pattern}$`, "su");
};
const Template = (...args) => {
    const [strings, runtypes] = normalizeArgs(args);
    return Runtype_js_1.default.create(({ received, innerValidate, expected, parsing }) => {
        const regexp = createRegExpForTemplate(expected);
        const test = (received, innerValidate, parsing) => {
            const matches = received.match(regexp);
            if (matches) {
                const values = matches.slice(1);
                let parsed = "";
                for (let i = 0; i < strings.length; i++) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const string = strings[i];
                    const runtype = runtypes[i];
                    if (runtype) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const value = values[i];
                        const validated = reviveValidate(runtype, innerValidate, parsing)(value);
                        if (!validated.success)
                            return validated;
                        parsed += string + validated.value;
                    }
                    else {
                        parsed += string;
                    }
                }
                return (0, SUCCESS_js_1.default)(parsing ? parsed : received);
            }
            else {
                return FAILURE_js_1.default.VALUE_INCORRECT({ expected, received });
            }
        };
        if (typeof received !== "string")
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received });
        else {
            const validated = test(received, innerValidate, parsing);
            if (validated.success)
                return validated;
            return FAILURE_js_1.default.VALUE_INCORRECT({ expected, received });
        }
    }, { tag: "template", strings, runtypes });
};
exports.default = Template;
