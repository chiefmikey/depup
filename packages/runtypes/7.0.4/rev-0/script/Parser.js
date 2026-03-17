"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const Parser = (underlying, parser) => Runtype_js_1.default.create(({ received, innerValidate, expected, parsing }) => {
    try {
        const result = innerValidate({ expected: expected.underlying, received, parsing });
        if (!result.success)
            return result;
        if (!parsing)
            return result;
        return (0, SUCCESS_js_1.default)(expected.parser(result.value));
    }
    catch (error) {
        return FAILURE_js_1.default.PARSING_FAILED({ expected, received, thrown: error });
    }
}, { tag: "parser", underlying, parser });
exports.default = Parser;
