import Runtype from "./Runtype.js";
/**
 * Validates that a value is a symbol, and optionally the key is equal to the given one. If you want to ensure a symbol is *not* keyed, pass `undefined`.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-symbols
 * - `VALUE_INCORRECT` if the key is not equal to the given one
 */
interface Symbol<K extends string | undefined = never> extends Runtype<symbol> {
    tag: "symbol";
    key?: K;
    <K extends string | undefined>(key: K): Symbol<K>;
}
declare const Symbol: Symbol;
export default Symbol;
