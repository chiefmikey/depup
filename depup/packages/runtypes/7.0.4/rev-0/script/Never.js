"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
const FAILURE_js_1 = __importDefault(require("./utils-internal/FAILURE.js"));
const Never = Runtype_js_1.default.create(({ received, expected }) => FAILURE_js_1.default.NOTHING_EXPECTED({ expected, received }), { tag: "never" });
exports.default = Never;
