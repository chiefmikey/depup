import type Runtype from "../Runtype.js";
import { type Static, type Parsed } from "../Runtype.js";
type Options = {
    receives?: Runtype.Core<readonly unknown[]> | undefined;
    resolves?: Runtype.Core | undefined;
};
type AsyncFunction = (...args: readonly any[]) => Promise<any>;
type EnforcedParametersStatic<O extends Options, F extends AsyncFunction> = O["receives"] extends Runtype.Core ? Static<O["receives"]> : Parameters<F>;
type EnforcedReturnTypeStatic<O extends Options, F extends AsyncFunction> = O["resolves"] extends Runtype.Core ? Static<O["resolves"]> : Awaited<ReturnType<F>>;
type EnforcedParametersParsed<O extends Options, F extends AsyncFunction> = O["receives"] extends Runtype.Core ? Parsed<O["receives"]> : Parameters<F>;
type EnforcedReturnTypeParsed<O extends Options, F extends AsyncFunction> = O["resolves"] extends Runtype.Core ? Parsed<O["resolves"]> & Awaited<ReturnType<F>> : Awaited<ReturnType<F>>;
type AsyncContract<O extends Options> = O & {
    enforce: <F extends (...args: EnforcedParametersParsed<O, F>) => Promise<EnforcedReturnTypeStatic<O, F>>>(f: F) => (...args: EnforcedParametersStatic<O, F>) => Promise<EnforcedReturnTypeParsed<O, F>>;
};
/**
 * Creates an async function contract.
 *
 * Possible failures:
 *
 * - `ARGUMENTS_INCORRECT` with `detail` reporting the inner failures
 * - `RETURN_INCORRECT` with `detail` reporting that the returned value is not a `Promise`
 * - `RESOLVE_INCORRECT` with `detail` reporting the inner failure
 */
declare const AsyncContract: <O extends Options>({ receives, resolves }: O) => AsyncContract<O>;
export default AsyncContract;
