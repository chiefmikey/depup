"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const defineIntrinsics_js_1 = __importDefault(require("./utils-internal/defineIntrinsics.js"));
const Spread = globalThis.Object.assign((content) => ({
    tag: "spread",
    content,
}), {
    /** @internal */
    asSpreadable: (base) => (0, defineIntrinsics_js_1.default)(base, {
        *[Symbol.iterator]() {
            yield Spread(base);
        },
    }),
});
exports.default = Spread;
