"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const Spread_js_1 = __importDefault(require("./Spread.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const Brand = (brand, entity) => {
    const base = {
        tag: "brand",
        brand,
        entity,
    };
    return Runtype_js_1.default.create(({ received, innerValidate, expected, parsing }) => {
        const result = innerValidate({ expected: expected.entity, received, parsing });
        if (result.success)
            return result;
        return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received, detail: result });
    }, Spread_js_1.default.asSpreadable(base));
};
exports.default = Brand;
