import type Failure from "./Failure.js";
import type Success from "./Success.js";
/**
 * The result of a type validation.
 */
type Result<T> = Success<T> | Failure;
export default Result;
