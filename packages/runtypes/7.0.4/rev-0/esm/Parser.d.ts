import Runtype, { type Parsed, type Static } from "./Runtype.js";
/**
 * Adds a parser to the given runtype.
 *
 * Possible failures when `check`-ing:
 *
 * - Failures of the inner runtype
 *
 * Possible failures when `parse`-ing:
 *
 * - Failures of the inner runtype
 * - `PARSING_FAILED` with `thrown` reporting the thrown value from the parser function
 */
interface Parser<R extends Runtype.Core = Runtype.Core, X = Parsed<R>> extends Runtype<Static<R>, X> {
    tag: "parser";
    underlying: R;
    parser: (value: Parsed<R>) => X;
}
declare const Parser: <R extends Runtype.Core, X>(underlying: R, parser: (value: Parsed<R>) => X) => Parser<R, X>;
export default Parser;
