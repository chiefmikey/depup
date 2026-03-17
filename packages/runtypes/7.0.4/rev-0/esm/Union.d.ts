import Runtype, { type Parsed, type Static } from "./Runtype.js";
import Spread from "./Spread.js";
import type HasSymbolIterator from "./utils-internal/HasSymbolIterator.js";
/**
 * Validates that a value fulfills one of the given runtypes.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` with `details` reporting failures for each runtype
 */
interface Union<R extends readonly Runtype.Core[] = readonly Runtype.Core[]> extends Runtype<{
    [K in keyof R]: R[K] extends Runtype.Core ? Static<R[K]> : unknown;
}[number], {
    [K in keyof R]: R[K] extends Runtype.Core ? Parsed<R[K]> : unknown;
}[number]> {
    tag: "union";
    alternatives: R;
    [Symbol.iterator]: R["length"] extends 1 ? R[0] extends Runtype.Spreadable ? HasSymbolIterator<R[0]> extends true ? () => Iterator<Spread<R[0]>> : never : never : never;
    match: Match<R>;
}
type Match<R extends readonly Runtype.Core[]> = <C extends Cases<R>>(...cases: C) => Matcher<R, ReturnType<C[number]>>;
type Matcher<R extends readonly Runtype.Core[], Z> = (value: {
    [K in keyof R]: Static<R[K]>;
}[number]) => Z;
type Cases<R extends readonly Runtype.Core[]> = {
    [K in keyof R]: Case<R[K], any>;
};
type Case<R extends Runtype.Core, Y> = (value: Parsed<R>) => Y;
declare const Union: <R extends readonly Runtype.Core[]>(...alternatives: R) => Union<R>;
export default Union;
