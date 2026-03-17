import type Runtype from "../Runtype.js";
import { type Static, type Parsed } from "../Runtype.js";
type Options = {
    receives?: Runtype.Core<readonly unknown[]> | undefined;
    returns?: Runtype.Core | undefined;
};
type Function = (...args: readonly any[]) => any;
type EnforcedParametersStatic<O extends Options, F extends Function> = O["receives"] extends Runtype.Core ? Static<O["receives"]> : Parameters<F>;
type EnforcedReturnTypeStatic<O extends Options, F extends Function> = O["returns"] extends Runtype.Core ? Static<O["returns"]> : ReturnType<F>;
type EnforcedParametersParsed<O extends Options, F extends Function> = O["receives"] extends Runtype.Core ? Parsed<O["receives"]> : Parameters<F>;
type EnforcedReturnTypeParsed<O extends Options, F extends Function> = O["returns"] extends Runtype.Core ? Parsed<O["returns"]> & ReturnType<F> : ReturnType<F>;
type Contract<O extends Options> = O & {
    enforce: <F extends (...args: EnforcedParametersParsed<O, F>) => EnforcedReturnTypeStatic<O, F>>(f: F) => (...args: EnforcedParametersStatic<O, F>) => EnforcedReturnTypeParsed<O, F>;
};
/**
 * Creates an  function contract.
 *
 * Possible failures:
 *
 * - `ARGUMENTS_INCORRECT` with `detail` reporting the inner failures
 * - `RETURN_INCORRECT` with `detail` reporting the inner failure
 */
declare const Contract: <O extends Options>({ receives, returns }: O) => Contract<O>;
export default Contract;
