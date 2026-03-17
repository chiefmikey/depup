"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
globalThis.Object.defineProperty(exports, "__esModule", { value: true });
const Never_js_1 = __importDefault(require("./Never.js"));
const Optional_js_1 = __importDefault(require("./Optional.js"));
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const copyProperties_js_1 = __importDefault(require("./utils-internal/copyProperties.js"));
const defineIntrinsics_js_1 = __importDefault(require("./utils-internal/defineIntrinsics.js"));
const defineProperty_js_1 = __importDefault(require("./utils-internal/defineProperty.js"));
const enumerableKeysOf_js_1 = __importDefault(require("./utils-internal/enumerableKeysOf.js"));
const hasEnumerableOwn_js_1 = __importDefault(require("./utils-internal/hasEnumerableOwn.js"));
const isObject_js_1 = __importDefault(require("./utils-internal/isObject.js"));
const Object = (fields) => {
    return Runtype_js_1.default.create(({ received: x, innerValidate, expected, parsing, memoParsed: memoParsedInherited }) => {
        if (x === null || x === undefined)
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received: x });
        const keysOfFields = (0, enumerableKeysOf_js_1.default)(expected.fields);
        if (keysOfFields.length !== 0 && typeof x !== "object")
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received: x });
        const keys = [...new Set([...keysOfFields, ...(0, enumerableKeysOf_js_1.default)(x)])];
        const results = {};
        const memoParsed = memoParsedInherited ?? new WeakMap();
        const parsed = (() => {
            if ((0, isObject_js_1.default)(x)) {
                const parsed = memoParsed.get(x) ?? {};
                memoParsed.set(x, parsed);
                return parsed;
            }
            else {
                return {};
            }
        })();
        for (const key of keys) {
            const fieldsHasKey = (0, hasEnumerableOwn_js_1.default)(key, expected.fields);
            const xHasKey = (0, hasEnumerableOwn_js_1.default)(key, x);
            if (fieldsHasKey) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const runtype = expected.fields[key];
                if (xHasKey) {
                    const received = x[key];
                    if (Optional_js_1.default.isOptional(runtype)) {
                        (0, defineProperty_js_1.default)(results, key, innerValidate({ expected: runtype.underlying, received, parsing, memoParsed }));
                    }
                    else {
                        (0, defineProperty_js_1.default)(results, key, innerValidate({ expected: runtype, received, parsing, memoParsed }));
                    }
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    if (results[key].success)
                        (0, defineProperty_js_1.default)(parsed, key, results[key].value);
                }
                else {
                    if (Optional_js_1.default.isOptional(runtype)) {
                        if ("default" in runtype) {
                            (0, defineProperty_js_1.default)(results, key, (0, SUCCESS_js_1.default)(runtype.default));
                            (0, defineProperty_js_1.default)(parsed, key, runtype.default);
                        }
                        else {
                            (0, defineProperty_js_1.default)(results, key, (0, SUCCESS_js_1.default)(undefined));
                        }
                    }
                    else {
                        (0, defineProperty_js_1.default)(results, key, FAILURE_js_1.default.PROPERTY_MISSING({ expected: runtype }));
                    }
                }
            }
            else if (xHasKey) {
                const received = x[key];
                if (expected.isExact) {
                    (0, defineProperty_js_1.default)(results, key, FAILURE_js_1.default.PROPERTY_PRESENT({ expected: Never_js_1.default, received }));
                }
                else {
                    (0, defineProperty_js_1.default)(results, key, (0, SUCCESS_js_1.default)(received));
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
                (0, defineProperty_js_1.default)(details, key, result);
        }
        if ((0, enumerableKeysOf_js_1.default)(details).length !== 0)
            return FAILURE_js_1.default.CONTENT_INCORRECT({ expected, received: x, details });
        else
            return (0, SUCCESS_js_1.default)(parsing ? parsed : x);
    }, { tag: "object", fields, isExact: false }).with(self => (0, defineIntrinsics_js_1.default)({}, {
        asPartial: () => {
            const cloned = self.clone();
            const existingKeys = (0, enumerableKeysOf_js_1.default)(self.fields);
            const fields = {};
            for (const key of existingKeys) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const value = self.fields[key];
                (0, defineProperty_js_1.default)(fields, key, Optional_js_1.default.isOptional(value) ? value : (0, Optional_js_1.default)(value));
            }
            cloned.fields = fields;
            return cloned;
        },
        asReadonly: () => self.clone(),
        pick: (...keys) => {
            const cloned = self.clone();
            const existingKeys = (0, enumerableKeysOf_js_1.default)(self.fields);
            const fields = {};
            for (const key of existingKeys)
                if (keys.includes(key))
                    (0, defineProperty_js_1.default)(fields, key, self.fields[key]);
            cloned.fields = fields;
            return cloned;
        },
        omit: (...keys) => {
            const cloned = self.clone();
            const existingKeys = (0, enumerableKeysOf_js_1.default)(self.fields);
            const fields = {};
            for (const key of existingKeys)
                if (!keys.includes(key))
                    (0, defineProperty_js_1.default)(fields, key, self.fields[key]);
            cloned.fields = fields;
            return cloned;
        },
        extend: (extension) => {
            const cloned = self.clone();
            const fields = {};
            (0, copyProperties_js_1.default)(fields, self.fields);
            (0, copyProperties_js_1.default)(fields, extension);
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
exports.default = Object;
