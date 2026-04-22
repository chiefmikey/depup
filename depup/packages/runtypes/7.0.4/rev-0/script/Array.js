"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const Spread_js_1 = __importDefault(require("./Spread.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const defineIntrinsics_js_1 = __importDefault(require("./utils-internal/defineIntrinsics.js"));
const enumerableKeysOf_js_1 = __importDefault(require("./utils-internal/enumerableKeysOf.js"));
const isNumberLikeKey_js_1 = __importDefault(require("./utils-internal/isNumberLikeKey.js"));
const Array = (element) => {
    const base = {
        tag: "array",
        element,
    };
    return Runtype_js_1.default.create(({ received, innerValidate, expected, parsing }) => {
        if (!globalThis.Array.isArray(received))
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received });
        const keys = (0, enumerableKeysOf_js_1.default)(received).filter(isNumberLikeKey_js_1.default);
        const results = keys.map(key => innerValidate({ expected: element, received: received[key], parsing }));
        const details = {};
        for (const key of keys) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = results[key];
            if (!result.success)
                details[key] = result;
        }
        if ((0, enumerableKeysOf_js_1.default)(details).length !== 0)
            return FAILURE_js_1.default.CONTENT_INCORRECT({ expected, received, details });
        else
            return (0, SUCCESS_js_1.default)(parsing ? results.map(result => result.value) : received);
    }, Spread_js_1.default.asSpreadable(base)).with(self => (0, defineIntrinsics_js_1.default)({}, { asReadonly: () => self }));
};
exports.default = Array;
