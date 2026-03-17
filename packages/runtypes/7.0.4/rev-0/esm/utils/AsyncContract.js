import InstanceOf from "../InstanceOf.js";
import ValidationError from "../result/ValidationError.js";
import FAILURE from "../utils-internal/FAILURE.js";
const parseReceived = (received, receives) => {
    if (!receives)
        return received;
    try {
        return receives.parse(received);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            const failure = FAILURE.ARGUMENTS_INCORRECT({
                expected: receives,
                received,
                detail: error.failure,
            });
            throw new ValidationError(failure);
        }
        else
            throw error;
    }
};
const InstanceOfPromise = InstanceOf(Promise);
const parseReturned = async (returned, returns) => {
    try {
        InstanceOfPromise.assert(returned);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            const failure = FAILURE.RETURN_INCORRECT({
                expected: InstanceOfPromise,
                received: returned,
                detail: error.failure,
            });
            throw new ValidationError(failure);
        }
    }
    const awaited = await returned;
    if (!returns)
        return awaited;
    try {
        return returns.parse(awaited);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            const failure = FAILURE.RESOLVE_INCORRECT({
                expected: returns,
                received: awaited,
                detail: error.failure,
            });
            throw new ValidationError(failure);
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
export default AsyncContract;
