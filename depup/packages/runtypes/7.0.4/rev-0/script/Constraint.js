"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const Constraint = (underlying, constraint) => Runtype_js_1.default.create(({ received, innerValidate, expected, parsing }) => {
    const result = innerValidate({ expected: expected.underlying, received, parsing: true });
    if (!result.success)
        return result;
    try {
        constraint(result.value);
        return (0, SUCCESS_js_1.default)(parsing ? result.value : received);
    }
    catch (error) {
        return FAILURE_js_1.default.CONSTRAINT_FAILED({ expected, received, thrown: error });
    }
}, { tag: "constraint", underlying, constraint });
exports.default = Constraint;
