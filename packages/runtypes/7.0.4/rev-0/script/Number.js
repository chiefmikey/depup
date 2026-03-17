"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const Number = Runtype_js_1.default.create(({ received, expected }) => typeof received === "number"
    ? (0, SUCCESS_js_1.default)(received)
    : FAILURE_js_1.default.TYPE_INCORRECT({ expected, received }), { tag: "number" });
exports.default = Number;
