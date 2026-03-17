import Never from "./Never.js";
import Optional from "./Optional.js";
import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
import copyProperties from "./utils-internal/copyProperties.js";
import defineIntrinsics from "./utils-internal/defineIntrinsics.js";
import defineProperty from "./utils-internal/defineProperty.js";
import enumerableKeysOf from "./utils-internal/enumerableKeysOf.js";
import hasEnumerableOwn from "./utils-internal/hasEnumerableOwn.js";
import isObject from "./utils-internal/isObject.js";
const Object = (fields) => {
    return Runtype.create(({ received: x, innerValidate, expected, parsing, memoParsed: memoParsedInherited }) => {
        if (x === null || x === undefined)
            return FAILURE.TYPE_INCORRECT({ expected, received: x });
        const keysOfFields = enumerableKeysOf(expected.fields);
        if (keysOfFields.length !== 0 && typeof x !== "object")
            return FAILURE.TYPE_INCORRECT({ expected, received: x });
        const keys = [...new Set([...keysOfFields, ...enumerableKeysOf(x)])];
        const results = {};
        const memoParsed = memoParsedInherited ?? new WeakMap();
        const parsed = (() => {
            if (isObject(x)) {
                const parsed = memoParsed.get(x) ?? {};
                memoParsed.set(x, parsed);
                return parsed;
            }
            else {
                return {};
            }
        })();
        for (const key of keys) {
            const fieldsHasKey = hasEnumerableOwn(key, expected.fields);
            const xHasKey = hasEnumerableOwn(key, x);
            if (fieldsHasKey) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const runtype = expected.fields[key];
                if (xHasKey) {
                    const received = x[key];
                    if (Optional.isOptional(runtype)) {
                        defineProperty(results, key, innerValidate({ expected: runtype.underlying, received, parsing, memoParsed }));
                    }
                    else {
                        defineProperty(results, key, innerValidate({ expected: runtype, received, parsing, memoParsed }));
                    }
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    if (results[key].success)
                        defineProperty(parsed, key, results[key].value);
                }
                else {
                    if (Optional.isOptional(runtype)) {
                        if ("default" in runtype) {
                            defineProperty(results, key, SUCCESS(runtype.default));
                            defineProperty(parsed, key, runtype.default);
                        }
                        else {
                            defineProperty(results, key, SUCCESS(undefined));
                        }
                    }
                    else {
                        defineProperty(results, key, FAILURE.PROPERTY_MISSING({ expected: runtype }));
                    }
                }
            }
            else if (xHasKey) {
                const received = x[key];
                if (expected.isExact) {
                    defineProperty(results, key, FAILURE.PROPERTY_PRESENT({ expected: Never, received }));
                }
                else {
                    defineProperty(results, key, SUCCESS(received));
                }
            }
            else {
                throw new Error("impossible");
            }
        }
        const details = {};
        for (const key of keys) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = results[key];
            if (!result.success)
                defineProperty(details, key, result);
        }
        if (enumerableKeysOf(details).length !== 0)
            return FAILURE.CONTENT_INCORRECT({ expected, received: x, details });
        else
            return SUCCESS(parsing ? parsed : x);
    }, { tag: "object", fields, isExact: false }).with(self => defineIntrinsics({}, {
        asPartial: () => {
            const cloned = self.clone();
            const existingKeys = enumerableKeysOf(self.fields);
            const fields = {};
            for (const key of existingKeys) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const value = self.fields[key];
                defineProperty(fields, key, Optional.isOptional(value) ? value : Optional(value));
            }
            cloned.fields = fields;
            return cloned;
        },
        asReadonly: () => self.clone(),
        pick: (...keys) => {
            const cloned = self.clone();
            const existingKeys = enumerableKeysOf(self.fields);
            const fields = {};
            for (const key of existingKeys)
                if (keys.includes(key))
                    defineProperty(fields, key, self.fields[key]);
            cloned.fields = fields;
            return cloned;
        },
        omit: (...keys) => {
            const cloned = self.clone();
            const existingKeys = enumerableKeysOf(self.fields);
            const fields = {};
            for (const key of existingKeys)
                if (!keys.includes(key))
                    defineProperty(fields, key, self.fields[key]);
            cloned.fields = fields;
            return cloned;
        },
        extend: (extension) => {
            const cloned = self.clone();
            const fields = {};
            copyProperties(fields, self.fields);
            copyProperties(fields, extension);
            cloned.fields = fields;
            return cloned;
        },
        exact: () => {
            const cloned = self.clone();
            cloned.isExact = true;
            return cloned;
        },
    }));
};
export default Object;
