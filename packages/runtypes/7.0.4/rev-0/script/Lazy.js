"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("./Runtype.js"));
/**
 * Constructs a possibly-recursive runtype.
 */
const Lazy = (delayed) => {
    const self = {
        get tag() {
            return getWrapped().tag;
        },
    };
    let cached = undefined;
    const getWrapped = () => {
        if (!cached) {
            cached = delayed();
            for (const key of Reflect.ownKeys(cached)) {
                if (key !== "tag") {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const descriptor = globalThis.Object.getOwnPropertyDescriptor(cached, key);
                    globalThis.Object.defineProperty(self, key, descriptor);
                }
            }
        }
        return cached;
    };
    return Runtype_js_1.default.create(({ received, parsing }) => getWrapped().inspect(received, { parse: parsing }), self);
};
exports.default = Lazy;
