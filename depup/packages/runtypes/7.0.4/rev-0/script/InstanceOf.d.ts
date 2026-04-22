import Runtype from "./Runtype.js";
type Constructor<V> = {
    new (...args: never[]): V;
};
/**
 * Validates that a value is an instance of the given class.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` if `instanceof` was `false`
 * - `INSTANCEOF_FAILED` if `instanceof` threw (per `Symbol.hasInstance`)
 */
interface InstanceOf<V = unknown> extends Runtype<V> {
    tag: "instanceof";
    ctor: Constructor<V>;
}
declare const InstanceOf: <V>(ctor: Constructor<V>) => InstanceOf<V>;
export default InstanceOf;
