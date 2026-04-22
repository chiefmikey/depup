"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quoteWithDoubleQuote = (string) => `"${string.replaceAll('"', '\\"')}"`;
exports.default = quoteWithDoubleQuote;
