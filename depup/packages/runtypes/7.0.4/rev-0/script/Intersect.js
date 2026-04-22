"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const Spread_js_1 = __importDefault(require("./Spread.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const Intersect = (...intersectees) => {
    const base = {
        tag: "intersect",
        intersectees,
    };
    return Runtype_js_1.default.create(({ received, innerValidate, expected, parsing }) => {
        if (expected.intersectees.length === 0)
            return (0, SUCCESS_js_1.default)(received);
        const results = [];
        const details = {};
        let success = (0, SUCCESS_js_1.default)(received);
        for (let i = 0; i < expected.intersectees.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const intersectee = expected.intersectees[i];
            const result = innerValidate({ expected: intersectee, received, parsing });
            results.push(result);
            if (result.success) {
                if (success)
                    success = result;
            }
            else {
                details[i] = result;
                success = undefined;
            }
        }
        if (!success)
            return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received, details });
        return (0, SUCCESS_js_1.default)(parsing ? success.value : received);
    }, Spread_js_1.default.asSpreadable(base));
};
exports.default = Intersect;
