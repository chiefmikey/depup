"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.when = void 0;
const match = (...cases) => value => {
    for (const [T, f] of cases)
        try {
            return f(T.parse(value));
        }
        catch (error) {
            continue;
        }
    throw new Error("No alternatives were matched");
};
const when = (...args) => (Array.isArray(args[0]) ? args[0] : [args[0], args[1]]);
exports.when = when;
exports.default = match;
