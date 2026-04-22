"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Literal_js_1 = __importDefault(require("./Literal.js"));
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const Symbol_js_1 = __importDefault(require("./Symbol.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const defineProperty_js_1 = __importDefault(require("./utils-internal/defineProperty.js"));
const enumerableKeysOf_js_1 = __importDefault(require("./utils-internal/enumerableKeysOf.js"));
const hasEnumerableOwn_js_1 = __importDefault(require("./utils-internal/hasEnumerableOwn.js"));
const isNumberLikeKey_js_1 = __importDefault(require("./utils-internal/isNumberLikeKey.js"));
const show_js_1 = __importDefault(require("./utils-internal/show.js"));
const unwrapTrivial_js_1 = __importDefault(require("./utils-internal/unwrapTrivial.js"));
const extractLiteralKeys = (runtype) => {
    const literalKeys = [];
    const inner = (0, unwrapTrivial_js_1.default)(runtype);
    switch (inner.tag) {
        case "union": {
            for (const alternative of inner.alternatives) {
                const inner = (0, unwrapTrivial_js_1.default)(alternative);
                switch (inner.tag) {
                    case "literal": {
                        switch (typeof inner.value) {
                            case "string":
                            case "number":
                            case "symbol":
                                literalKeys.push(inner.value);
                        }
                        break;
                    }
                    case "string":
                    case "number":
                    case "symbol":
                        break;
                    default:
                        throw new Error(`Unsupported runtype for \`Record\` keys: ${(0, show_js_1.default)(inner)}`);
                }
            }
        }
    }
    return literalKeys;
};
const Record = (key, value) => {
    const keyRuntype = key;
    const valueRuntype = value;
    return Runtype_js_1.default.create(({ received: x, innerValidate, expected, parsing }) => {
        if (x === null || x === undefined || typeof x !== "object")
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received: x });
        if (globalThis.Object.getPrototypeOf(x) !== globalThis.Object.prototype)
            if (!Array.isArray(x) || keyRuntype.tag === "string")
                return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received: x });
        const keys = [...new Set([...extractLiteralKeys(key), ...(0, enumerableKeysOf_js_1.default)(x)])];
        const results = {};
        for (const key of keys) {
            const xHasKey = (0, hasEnumerableOwn_js_1.default)(key, x);
            if (xHasKey) {
                const testKey = (key) => {
                    // We should provide interoperability with `number` and `string` here, as a user would expect JavaScript engines to convert numeric keys to string keys automatically. So, if the key can be interpreted as a decimal number, then test it against a `Number` OR `String` runtype.
                    if (typeof key === "number" || (0, isNumberLikeKey_js_1.default)(key)) {
                        const keyInterop = globalThis.Number(key);
                        const result = innerValidate({ expected: keyRuntype, received: keyInterop, parsing });
                        if (!result.success) {
                            const result = innerValidate({ expected: keyRuntype, received: key, parsing });
                            if (!result.success)
                                return result;
                        }
                    }
                    else {
                        const result = innerValidate({ expected: keyRuntype, received: key, parsing });
                        if (!result.success)
                            return result;
                    }
                    return undefined;
                };
                const failure = testKey(key);
                if (failure) {
                    (0, defineProperty_js_1.default)(results, key, FAILURE_js_1.default.KEY_INCORRECT({
                        expected: keyRuntype,
                        received: key,
                        detail: failure,
                    }));
                }
                else {
                    (0, defineProperty_js_1.default)(results, key, innerValidate({ expected: valueRuntype, received: x[key], parsing }));
                }
            }
            else {
                (0, defineProperty_js_1.default)(results, key, FAILURE_js_1.default.PROPERTY_MISSING({
                    expected: typeof key === "symbol" ? (0, Symbol_js_1.default)(globalThis.Symbol.keyFor(key)) : (0, Literal_js_1.default)(key),
                }));
            }
        }
        const details = {};
        for (const key of keys) {
            const result = results[key];
            if (!result.success)
                (0, defineProperty_js_1.default)(details, key, result);
        }
        if ((0, enumerableKeysOf_js_1.default)(details).length !== 0)
            return FAILURE_js_1.default.CONTENT_INCORRECT({ expected, received: x, details });
        else
            return (0, SUCCESS_js_1.default)(x);
    }, { tag: "record", key, value });
};
exports.default = Record;
