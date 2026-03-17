"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const defineProperties_js_1 = __importDefault(require("./defineProperties.js"));
const defineIntrinsics = (target, properties) => (0, defineProperties_js_1.default)(target, properties, { configurable: true, enumerable: false, writable: true });
exports.default = defineIntrinsics;
