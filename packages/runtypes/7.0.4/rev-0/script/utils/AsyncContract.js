"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InstanceOf_js_1 = __importDefault(require("../InstanceOf.js"));
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
const InstanceOfPromise = (0, InstanceOf_js_1.default)(Promise);
const parseReturned = async (returned, returns) => {
    try {
        InstanceOfPromise.assert(returned);
    }
    catch (error) {
        if (error instanceof ValidationError_js_1.default) {
            const failure = FAILURE_js_1.default.RETURN_INCORRECT({
                expected: InstanceOfPromise,
                received: returned,
                detail: error.failure,
            });
            throw new ValidationError_js_1.default(failure);
        }
    }
    const awaited = await returned;
    if (!returns)
        return awaited;
    try {
        return returns.parse(awaited);
    }
    catch (error) {
        if (error instanceof ValidationError_js_1.default) {
            const failure = FAILURE_js_1.default.RESOLVE_INCORRECT({
                expected: returns,
                received: awaited,
                detail: error.failure,
            });
            throw new ValidationError_js_1.default(failure);
        }
        else
            throw error;
    }
};
/**
 * Creates an async function contract.
 *
 * Possible failures:
 *
 * - `ARGUMENTS_INCORRECT` with `detail` reporting the inner failures
 * - `RETURN_INCORRECT` with `detail` reporting that the returned value is not a `Promise`
 * - `RESOLVE_INCORRECT` with `detail` reporting the inner failure
 */
const AsyncContract = ({ receives, resolves }) => {
    return {
        receives,
        resolves,
        enforce: f => async (...args) => await parseReturned(f(...parseReceived(args, receives)), resolves),
    };
};
exports.default = AsyncContract;
