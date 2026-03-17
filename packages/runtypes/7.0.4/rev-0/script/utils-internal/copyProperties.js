"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const copyProperties = (dst, src) => {
    globalThis.Object.defineProperties(dst, globalThis.Object.getOwnPropertyDescriptors(src));
};
exports.default = copyProperties;
