import type Runtype from "./Runtype.js";
/**
 * A pseudo-runtype that is only usable in the context of `Object` properties. This works as the runtime counterpart of optional properties.
 *
 * ```typescript
 * const O = Object({ x: Number.optional() })
 * const O = Static<typeof O> // { x?: number }
 * ```
 */
interface Optional<R extends Runtype.Core = Runtype.Core, D = any> {
    tag: "optional";
    underlying: R;
    default?: D;
}
declare const Optional: {
    <R extends Runtype.Core>(underlying: R): Optional<R, never>;
    <R extends Runtype.Core, D>(underlying: R, defaultValue: D): Optional<R, D>;
    isOptional: (runtype: Runtype.Core | Optional) => runtype is Optional;
};
export default Optional;
