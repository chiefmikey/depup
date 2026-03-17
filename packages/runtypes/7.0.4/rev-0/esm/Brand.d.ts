import Runtype, { type Parsed, type Static } from "./Runtype.js";
import Spread from "./Spread.js";
import type HasSymbolIterator from "./utils-internal/HasSymbolIterator.js";
declare const RuntypeName: unique symbol;
type RuntypeBrand<B extends string> = {
    [RuntypeName]: {
        [k in B]: B;
    };
};
/**
 * Adds a brand to the inferred static type.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` with `detail` reporting the inner failure
 */
interface Brand<B extends string = string, R extends Runtype.Core = Runtype.Core> extends Runtype<Static<R> & RuntypeBrand<B>, Parsed<R> & RuntypeBrand<B>> {
    tag: "brand";
    brand: B;
    entity: R;
    [Symbol.iterator]: R extends Runtype.Spreadable ? HasSymbolIterator<R> extends true ? () => Iterator<Spread<Brand<B, R>>> : never : never;
}
declare const Brand: <B extends string, R extends Runtype.Core>(brand: B, entity: R) => Brand<B, R>;
export default Brand;
