"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Optional = Object.assign(((...args) => ({
    tag: "optional",
    underlying: args[0],
    ...(args.length === 2 ? { default: args[1] } : {}),
})), {
    isOptional: (runtype) => runtype.tag === "optional",
});
exports.default = Optional;
