"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const SymbolFor = (key) => Runtype_js_1.default.create(({ received, expected }) => {
    if (typeof received !== "symbol")
        return FAILURE_js_1.default.TYPE_INCORRECT({ expected, received });
    else {
        if (globalThis.Symbol.keyFor(received) !== expected.key)
            return FAILURE_js_1.default.VALUE_INCORRECT({ expected, received });
        else
            return (0, SUCCESS_js_1.default)(received);
    }
}, { tag: "symbol", key });
const Symbol = Runtype_js_1.default.create(({ received, expected }) => typeof received === "symbol"
    ? (0, SUCCESS_js_1.default)(received)
    : FAILURE_js_1.default.TYPE_INCORRECT({ expected, received }), globalThis.Object.assign(SymbolFor, { tag: "symbol" }));
exports.default = Symbol;
