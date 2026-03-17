import type Failure from "./Failure.js";
declare class ValidationError extends Error {
    /**
     * Always `"ValidationError"`.
     */
    name: "ValidationError";
    /**
     * A string that summarizes the problem overall.
     */
    message: string;
    /**
     * An object that describes the problem in a structured way.
     */
    failure: Failure;
    constructor(failure: Failure);
    static isValidationError: (value: unknown) => value is ValidationError;
    static [globalThis.Symbol.hasInstance]: (value: unknown) => value is ValidationError;
}
export default ValidationError;
