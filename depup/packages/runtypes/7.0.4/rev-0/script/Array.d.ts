import Runtype, { type Parsed, type Static } from "./Runtype.js";
import Spread from "./Spread.js";
/**
 * Validates a value is an array of the given element type.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-arrays
 * - `CONTENT_INCORRECT` with `details` reporting the failed elements
 */
interface Array<R extends Runtype.Core = Runtype.Core> extends Runtype<Static<R>[], Parsed<R>[]>, Iterable<Spread<Array<R>>> {
    tag: "array";
    element: R;
    asReadonly: () => Array.Readonly<R>;
}
declare namespace Array {
    interface Readonly<R extends Runtype.Core = Runtype.Core> extends Runtype<readonly Static<R>[], readonly Parsed<R>[]>, Iterable<Spread<Readonly<R>>> {
        tag: "array";
        element: R;
    }
}
declare const Array: <R extends Runtype.Core>(element: R) => Array<R>;
export default Array;
