import Literal from "./Literal.js";
import Runtype from "./Runtype.js";
import Symbol from "./Symbol.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
import defineProperty from "./utils-internal/defineProperty.js";
import enumerableKeysOf from "./utils-internal/enumerableKeysOf.js";
import hasEnumerableOwn from "./utils-internal/hasEnumerableOwn.js";
import isNumberLikeKey from "./utils-internal/isNumberLikeKey.js";
import show from "./utils-internal/show.js";
import unwrapTrivial from "./utils-internal/unwrapTrivial.js";
const extractLiteralKeys = (runtype) => {
    const literalKeys = [];
    const inner = unwrapTrivial(runtype);
    switch (inner.tag) {
        case "union": {
            for (const alternative of inner.alternatives) {
                const inner = unwrapTrivial(alternative);
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
                        throw new Error(`Unsupported runtype for \`Record\` keys: ${show(inner)}`);
                }
            }
        }
    }
    return literalKeys;
};
const Record = (key, value) => {
    const keyRuntype = key;
    const valueRuntype = value;
    return Runtype.create(({ received: x, innerValidate, expected, parsing }) => {
        if (x === null || x === undefined || typeof x !== "object")
            return FAILURE.TYPE_INCORRECT({ expected, received: x });
        if (globalThis.Object.getPrototypeOf(x) !== globalThis.Object.prototype)
            if (!Array.isArray(x) || keyRuntype.tag === "string")
                return FAILURE.TYPE_INCORRECT({ expected, received: x });
        const keys = [...new Set([...extractLiteralKeys(key), ...enumerableKeysOf(x)])];
        const results = {};
        for (const key of keys) {
            const xHasKey = hasEnumerableOwn(key, x);
            if (xHasKey) {
                const testKey = (key) => {
                    // We should provide interoperability with `number` and `string` here, as a user would expect JavaScript engines to convert numeric keys to string keys automatically. So, if the key can be interpreted as a decimal number, then test it against a `Number` OR `String` runtype.
                    if (typeof key === "number" || isNumberLikeKey(key)) {
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
                    defineProperty(results, key, FAILURE.KEY_INCORRECT({
                        expected: keyRuntype,
                        received: key,
                        detail: failure,
                    }));
                }
                else {
                    defineProperty(results, key, innerValidate({ expected: valueRuntype, received: x[key], parsing }));
                }
            }
            else {
                defineProperty(results, key, FAILURE.PROPERTY_MISSING({
                    expected: typeof key === "symbol" ? Symbol(globalThis.Symbol.keyFor(key)) : Literal(key),
                }));
            }
        }
        const details = {};
        for (const key of keys) {
            const result = results[key];
            if (!result.success)
                defineProperty(details, key, result);
        }
        if (enumerableKeysOf(details).length !== 0)
            return FAILURE.CONTENT_INCORRECT({ expected, received: x, details });
        else
            return SUCCESS(x);
    }, { tag: "record", key, value });
};
export default Record;
