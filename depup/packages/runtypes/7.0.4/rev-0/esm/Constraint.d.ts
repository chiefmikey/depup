import Runtype, { type Static, type Parsed } from "./Runtype.js";
/**
 * Adds a constraint to a runtype, narrowing its inferred static type.
 *
 * Possible failures:
 *
 * - Failures of the inner runtype
 * - `CONSTRAINT_FAILED` with `thrown` reporting the thrown value from the constraint function
 */
interface Constraint<R extends Runtype.Core = Runtype.Core, T extends Parsed<R> = Parsed<R>> extends Runtype<[Static<R>, Parsed<R>] extends [Parsed<R>, Static<R>] ? T : Static<R>, T> {
    tag: "constraint";
    underlying: R;
    constraint: (x: Parsed<R>) => asserts x is T;
}
declare const Constraint: <R extends Runtype.Core, T extends Parsed<R>>(underlying: R, constraint: (x: Parsed<R>) => asserts x is T) => Constraint<R, T>;
export default Constraint;
