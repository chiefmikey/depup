"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const SUCCESS_js_1 = __importDefault(require("./utils-internal/SUCCESS.js"));
const Unknown = Runtype_js_1.default.create(({ received }) => (0, SUCCESS_js_1.default)(received), {
    tag: "unknown",
});
exports.default = Unknown;
