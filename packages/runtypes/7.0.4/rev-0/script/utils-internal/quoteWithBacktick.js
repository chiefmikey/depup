"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quoteWithBacktick = (string) => `\`${string.replaceAll("`", "\\`")}\``;
exports.default = quoteWithBacktick;
