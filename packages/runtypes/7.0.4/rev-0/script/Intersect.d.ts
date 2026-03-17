import Runtype, { type Parsed, type Static } from "./Runtype.js";
import Spread from "./Spread.js";
import type HasSymbolIterator from "./utils-internal/HasSymbolIterator.js";
/**
 * Validates that a value fulfills all of the given runtypes.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` with `details` reporting failures for each runtype
 */
interface Intersect<R extends readonly Runtype.Core[] = readonly Runtype.Core[]> extends Runtype<{
    [K in keyof R]: (_: Static<R[K]>) => unknown;
}[number] extends (_: infer I) => unknown ? I : unknown, R extends [...(readonly unknown[]), infer R] ? R extends Runtype.Core ? Parsed<R> : never : unknown> {
    tag: "intersect";
    intersectees: R;
    [Symbol.iterator]: R["length"] extends 1 ? R[0] extends Runtype.Spreadable ? HasSymbolIterator<R[0]> extends true ? () => Iterator<Spread<R[0]>> : never : never : never;
}
declare const Intersect: <R extends readonly Runtype.Core[]>(...intersectees: R) => Intersect<R>;
export default Intersect;
