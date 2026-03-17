"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationError_js_1 = __importDefault(require("../result/ValidationError.js"));
const FAILURE_js_1 = __importDefault(require("../utils-internal/FAILURE.js"));
const parseReceived = (received, receives) => {
    if (!receives)
        return received;
    try {
        return receives.parse(received);
    }
    catch (error) {
        if (error instanceof ValidationError_js_1.default) {
            const failure = FAILURE_js_1.default.ARGUMENTS_INCORRECT({
                expected: receives,
                received,
                detail: error.failure,
            });
            throw new ValidationError_js_1.default(failure);
        }
        else
            throw error;
    }
};
const parseReturned = (returned, returns) => {
    if (!returns)
        return returned;
    try {
        return returns.parse(returned);
    }
    catch (error) {
        if (error instanceof ValidationError_js_1.default) {
            const failure = FAILURE_js_1.default.RETURN_INCORRECT({
                expected: returns,
                received: returned,
                detail: error.failure,
            });
            throw new ValidationError_js_1.default(failure);
        }
        else
            throw error;
    }
};
/**
 * Creates an  function contract.
 *
 * Possible failures:
 *
 * - `ARGUMENTS_INCORRECT` with `detail` reporting the inner failures
 * - `RETURN_INCORRECT` with `detail` reporting the inner failure
 */
const Contract = ({ receives, returns }) => {
    return {
        receives,
        returns,
        enforce: f => (...args) => parseReturned(f(...parseReceived(args, receives)), returns),
    };
};
exports.default = Contract;
