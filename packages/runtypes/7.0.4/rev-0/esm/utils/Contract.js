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
const parseReturned = (returned, returns) => {
    if (!returns)
        return returned;
    try {
        return returns.parse(returned);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            const failure = FAILURE.RETURN_INCORRECT({
                expected: returns,
                received: returned,
                detail: error.failure,
            });
            throw new ValidationError(failure);
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
export default Contract;
