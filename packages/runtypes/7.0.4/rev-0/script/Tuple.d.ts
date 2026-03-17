import type Array from "./Array.js";
import Runtype, { type Parsed, type Static } from "./Runtype.js";
import Spread from "./Spread.js";
type Lrt<L extends readonly Runtype.Core[] = readonly Runtype.Core[], R = unknown, T extends readonly Runtype.Core[] = readonly Runtype.Core[]> = {
    leading: L;
    rest: R;
    trailing: T;
};
type SplitAtSpreadImplRest<L extends readonly Runtype.Core[], R extends readonly (Runtype.Core | Spread)[], T extends readonly Runtype.Core[]> = R["length"] extends 0 ? Lrt<L, unknown, T> : R extends readonly [...(readonly Spread<infer X>[])] ? Lrt<L, X, T> : Lrt<L, unknown, T>;
type SplitAtSpreadImplTrailing<L extends readonly Runtype.Core[], R extends readonly (Runtype.Core | Spread)[], T extends readonly Runtype.Core[]> = R extends [...infer S, infer X] ? X extends Runtype.Core ? S extends readonly (Runtype.Core | Spread)[] ? SplitAtSpreadImplTrailing<L, S, [X, ...T]> : never : SplitAtSpreadImplRest<L, R, T> : SplitAtSpreadImplRest<L, R, T>;
type SplitAtSpreadImplLeading<L extends readonly Runtype.Core[], R extends readonly (Runtype.Core | Spread)[], T extends readonly Runtype.Core[]> = R extends [infer X, ...infer S] ? X extends Runtype.Core ? S extends readonly (Runtype.Core | Spread)[] ? SplitAtSpreadImplLeading<[...L, X], S, T> : never : SplitAtSpreadImplTrailing<L, R, T> : SplitAtSpreadImplTrailing<L, R, T>;
type SplitAtSpread<R extends readonly (Runtype.Core | Spread)[]> = SplitAtSpreadImplLeading<[
], R, [
]>;
type FlattenSplitAtSpread<R extends readonly (Runtype.Core | Spread)[]> = SplitAtSpread<R> extends Lrt<infer L0, infer R0, infer T0> ? R0 extends Array<any> ? Lrt<L0, R0, T0> : R0 extends Tuple<infer R> ? FlattenSplitAtSpread<R> extends Lrt<infer L1, infer R1, infer T1> ? {
    leading: [...L0, ...L1];
    rest: R1;
    trailing: [...T1, ...T0];
} : Lrt<L0, R0, T0> : Lrt<L0, R0, T0> : never;
type MapParsed<R extends readonly Runtype.Core[]> = {
    [K in keyof R]: Parsed<R[K]>;
};
type TupleParsed<R extends readonly (Runtype.Core | Spread)[]> = FlattenSplitAtSpread<R> extends infer X ? X extends Lrt<infer L, infer R, infer T> ? R extends Runtype.Core<readonly unknown[]> ? [...MapParsed<L>, ...Parsed<R>, ...MapParsed<T>] : [...MapParsed<L>, ...MapParsed<T>] : never : never;
type MapStatic<R extends readonly Runtype.Core[]> = {
    [K in keyof R]: Static<R[K]>;
};
type TupleStatic<R extends readonly (Runtype.Core | Spread)[]> = FlattenSplitAtSpread<R> extends infer X ? X extends Lrt<infer L, infer R, infer T> ? R extends Runtype.Core<readonly unknown[]> ? [...MapStatic<L>, ...Static<R>, ...MapStatic<T>] : [...MapStatic<L>, ...MapStatic<T>] : never : never;
type ToReadonlyImpl<A extends readonly unknown[], B extends readonly unknown[]> = A extends [
    infer A0,
    ...infer A
] ? ToReadonlyImpl<A, readonly [...B, A0]> : B;
type ToReadonly<A extends readonly unknown[]> = ToReadonlyImpl<A, readonly []>;
/**
 * Validates that a value is an array of the given element types.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-arrays
 * - `CONSTRAINT_FAILED` with `thrown` being a string reporting that the length constraint was not fulfilled
 * - `CONTENT_INCORRECT` with `details` reporting the failed elements
 */
interface Tuple<R extends readonly (Runtype.Core | Spread)[] = readonly (Runtype.Core | Spread)[]> extends Runtype<TupleStatic<R>, TupleParsed<R>>, Iterable<Spread<Tuple<R>>> {
    tag: "tuple";
    readonly components: Tuple.Components<R> extends infer X ? {
        [K in keyof X]: X[K];
    } : never;
    asReadonly: () => Tuple.Readonly<R>;
}
declare namespace Tuple {
    type Components<R extends readonly (Runtype.Core | Spread)[]> = FlattenSplitAtSpread<R> extends infer X ? X extends Lrt<infer L, infer R, infer T> ? unknown extends R ? [...L, ...T] : X : never : never;
    interface Readonly<R extends readonly (Runtype.Core | Spread)[] = readonly (Runtype.Core | Spread)[]> extends Runtype<ToReadonly<TupleStatic<R>>, ToReadonly<TupleParsed<R>>>, Iterable<Spread<Readonly<R>>> {
        tag: "tuple";
        readonly components: Tuple.Components<R> extends infer X ? {
            [K in keyof X]: X[K];
        } : never;
    }
    namespace Components {
        type Fixed<R extends readonly (Runtype.Core | Spread)[] = never> = [R] extends [never] ? readonly Runtype[] : Components<R>;
        type Variadic<R extends readonly (Runtype.Core | Spread)[] = never> = [R] extends [never] ? Lrt<readonly Runtype[], Runtype.Spreadable, readonly Runtype[]> : Components<R>;
    }
}
declare const Tuple: <R extends readonly (Runtype.Core | Spread)[]>(...components: R) => Tuple<R>;
export default Tuple;
