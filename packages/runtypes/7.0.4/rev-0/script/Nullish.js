"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Null_js_1 = __importDefault(require("./Null.js"));
const Undefined_js_1 = __importDefault(require("./Undefined.js"));
const Union_js_1 = __importDefault(require("./Union.js"));
/**
 * An alias for `Union(Null, Undefined)`.
 */
const Nullish = (0, Union_js_1.default)(Null_js_1.default, Undefined_js_1.default);
exports.default = Nullish;
