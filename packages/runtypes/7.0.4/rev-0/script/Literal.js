"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
/**
 * <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#same-value-zero_equality>
 */
const sameValueZero = (x, y) => {
    if (typeof x === "number" && typeof y === "number") {
        // x and y are equal (may be -0 and 0) or they are both NaN
        return x === y || (x !== x && y !== y);
    }
    return x === y;
};
const Literal = (value) => Runtype_js_1.default.create(({ received: x, expected }) => sameValueZero(x, value)
    ? (0, SUCCESS_js_1.default)(x)
    : typeof x !== typeof value || value === null
        ? FAILURE_js_1.default.TYPE_INCORRECT({ expected, received: x })
        : FAILURE_js_1.default.VALUE_INCORRECT({ expected, received: x }), { tag: "literal", value });
exports.default = Literal;
