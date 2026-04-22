"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Runtype_js_1 = __importDefault(require("../Runtype.js"));
const unwrapTrivial = (runtype) => {
    Runtype_js_1.default.assertIsRuntype(runtype);
    switch (runtype.tag) {
        case "brand":
            return unwrapTrivial(runtype.entity);
        case "intersect":
            if (runtype.intersectees.length === 1)
                return unwrapTrivial(runtype.intersectees[0]);
            break;
        case "union":
            if (runtype.alternatives.length === 1)
                return unwrapTrivial(runtype.alternatives[0]);
            break;
    }
    return runtype;
};
exports.default = unwrapTrivial;
