"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const defineIntrinsics_js_1 = __importDefault(require("../utils-internal/defineIntrinsics.js"));
const ValidationErrorSymbol = globalThis.Symbol();
class ValidationError extends Error {
    constructor(failure) {
        super(failure.message);
        /**
         * Always `"ValidationError"`.
         */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ValidationError"
        });
        /**
         * A string that summarizes the problem overall.
         */
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * An object that describes the problem in a structured way.
         */
        Object.defineProperty(this, "failure", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.message = failure.message;
        this.failure = failure;
        (0, defineIntrinsics_js_1.default)(this, { [ValidationErrorSymbol]: undefined });
    }
}
_a = globalThis.Symbol.hasInstance;
Object.defineProperty(ValidationError, "isValidationError", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (value) => value instanceof Error && globalThis.Object.hasOwn(value, ValidationErrorSymbol)
});
Object.defineProperty(ValidationError, _a, {
    enumerable: true,
    configurable: true,
    writable: true,
    value: ValidationError.isValidationError
});
exports.default = ValidationError;
