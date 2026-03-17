import type Array from "./Array.js";
import type BigInt from "./BigInt.js";
import type Boolean from "./Boolean.js";
import Brand from "./Brand.js";
import Constraint from "./Constraint.js";
import type Function from "./Function.js";
import type InstanceOf from "./InstanceOf.js";
import Intersect from "./Intersect.js";
import Literal from "./Literal.js";
import type Never from "./Never.js";
import type Number from "./Number.js";
import type Object from "./Object.js";
import Optional from "./Optional.js";
import Parser from "./Parser.js";
import type Record from "./Record.js";
import type Spread from "./Spread.js";
import type String from "./String.js";
import type Symbol from "./Symbol.js";
import type Template from "./Template.js";
import type Tuple from "./Tuple.js";
import Union from "./Union.js";
import type Unknown from "./Unknown.js";
import type Result from "./result/Result.js";
declare const RuntypeSymbol: unique symbol;
declare const RuntypeConformance: unique symbol;
declare const RuntypePrivate: unique symbol;
/**
 * Obtains the static type associated with a runtype.
 */
type Static<R extends {
    readonly [RuntypeSymbol]: [unknown, unknown];
}> = R[typeof RuntypeSymbol][0];
/**
 * Obtains the parsed type associated with a runtype.
 */
type Parsed<R extends {
    readonly [RuntypeSymbol]: [unknown, unknown];
}> = R[typeof RuntypeSymbol][1];
/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
declare class Runtype<T = any, X = T> implements Conformance<T, X> {
    #private;
    tag: string;
    /** @internal */ readonly [RuntypeSymbol]: [T, X];
    /** @internal */ readonly [RuntypeConformance]: Conformance<T, X>[typeof RuntypeConformance];
    /** @internal */ private readonly [RuntypePrivate];
    get [globalThis.Symbol.toStringTag](): string;
    toString(): string;
    /** @internal */ static create: <R extends Runtype>(validate: (context: Context<R> & {
        innerValidate: InnerValidate;
        memoParsed?: WeakMap<object, object>;
    }) => Result<Static<R> | Parsed<R>>, base: Runtype.Base<R>) => R;
    /** @internal */ private constructor();
    /**
     * Process a value with this runtype, returning a detailed information of success or failure. Does not throw on failure.
     */
    inspect<U, P extends boolean = true>(x: U, options?: {
        /**
         * Whether to parse.
         *
         * @default true
         */
        parse?: P | undefined;
    }): Result<P extends true ? X : Validated<T, U>>;
    /**
     * Validates that a value conforms to this runtype, returning the original value, statically typed. Throws `ValidationError` on failure.
     */
    check<U = T>(x: Target<T, U, this>): Validated<T, U>;
    /**
     * Validates that a value conforms to this runtype, returning a `boolean` that represents success or failure. Does not throw on failure.
     */
    guard<U = T>(x: Target<T, U, this>): x is Validated<T, U>;
    /**
     * Validates that a value conforms to this runtype. Throws `ValidationError` on failure.
     */
    assert<U = T>(x: Target<T, U, this>): asserts x is Validated<T, U>;
    /**
     * Validates that a value conforms to this runtype and returns another value returned by the function passed to `withParser`. Throws `ValidationError` on failure. Does not modify the original value.
     */
    parse<U = T>(x: Target<T, U, this>): X;
    /**
     * Returns a shallow clone of this runtype with additional properties. Useful when you want to integrate related values, such as the default value and utility functions.
     */
    with<P extends object>(extension: P | ((self: this) => P)): this & P;
    /**
     * Creates a shallow clone of this runtype.
     */
    clone(): this;
    /**
     * Unions this Runtype with another.
     */
    or<R extends Runtype.Core>(other: R): Union<[this, R]>;
    /**
     * Intersects this Runtype with another.
     */
    and<R extends Runtype.Core>(other: R): Intersect<[this, R]>;
    /**
     * Optionalizes this property.
     *
     * Note that `Optional` is not a runtype, but just a contextual modifier which is only meaningful when defining the content of `Object`. If you want to allow the validated value to be `undefined`, use `undefinedable` method.
     */
    optional(): Optional<this, never>;
    /**
     * Optionalizes this property, defaulting to the given value if this property was absent. Only meaningful for parsing.
     */
    default<X = never>(value: X): Optional<this, X>;
    /**
     * Unions this runtype with `Null`.
     */
    nullable(): Union<[this, Literal<null>]>;
    /**
     * Unions this runtype with `Undefined`.
     */
    undefinedable(): Union<[this, Literal<undefined>]>;
    /**
     * Unions this runtype with `Null` and `Undefined`.
     */
    nullishable(): Union<[this, Literal<null>, Literal<undefined>]>;
    /**
     * Uses a constraint function to add additional constraints to this runtype, and manually converts a static type of this runtype into another via the type argument if passed.
     */
    withConstraint<Y extends X>(constraint: (x: X) => boolean | string): Constraint<this, Y>;
    /**
     * Uses a guard function to add additional constraints to this runtype, and automatically converts a static type of this runtype into another.
     */
    withGuard<Y extends X>(guard: (x: X) => x is Y): Constraint<this, Y>;
    /**
     * Uses an assertion function to add additional constraints to this runtype, and automatically converts a static type of this runtype into another.
     */
    withAssertion<Y extends X>(assert: (x: X) => asserts x is Y): Constraint<this, Y>;
    /**
     * Adds a brand to the type.
     */
    withBrand<B extends string>(brand: B): Brand<B, this>;
    /**
     * Chains custom parser after this runtype. Basically only works in the `parse` method, but in certain cases parsing is implied within a chain of normal validation, such as before execution of a constraint, or upon function boundaries enforced with `Contract` and `AsyncContract`.
     */
    withParser<Y>(parser: (value: X) => Y): Parser<this, Y>;
    /**
     * Statically ensures this runtype is defined for exactly `T`, not for a subtype of `T`. `X` is for the parsed type.
     */
    conform<T, X = T>(this: Conform<T, X>): Conform<T, X> & this;
    /**
     * Guards if a value is a runtype.
     */
    static isRuntype: (x: unknown) => x is Runtype.Interfaces;
    /**
     * Asserts if a value is a runtype.
     */
    static assertIsRuntype: (x: unknown) => asserts x is Runtype.Interfaces;
    static [globalThis.Symbol.hasInstance]: (x: unknown) => x is Runtype.Interfaces;
}
declare namespace Runtype {
    /** @internal */ type Base<R> = {
        [K in keyof R as K extends Exclude<keyof Runtype, "tag"> ? never : K]: R[K];
    } & (globalThis.Function | object);
    /**
     * An upper bound of a {@link Runtype|`Runtype`}, with the bare minimum set of APIs to perform validation and parsing. Useful when you want a variable to accept any runtype; if you want to introspect the contents of it, use {@link Runtype.isRuntype|`Runtype.isRuntype`} or {@link Runtype.assertIsRuntype|`Runtype.assertIsRuntype`} first and `switch` with the {@link Runtype.prototype.tag|`Runtype.prototype.tag`}.
     */
    type Core<T = any, X = T> = Pick<Runtype<T, X>, typeof RuntypeSymbol | "tag" | "inspect" | "check" | "guard" | "assert" | "parse">;
    /**
     * The union of all possible runtypes. {@link Runtype.isRuntype|`Runtype.isRuntype`} or {@link Runtype.assertIsRuntype|`Runtype.assertIsRuntype`} can be used to ensure a value is of this type.
     */
    type Interfaces = Array | Array.Readonly | BigInt | Boolean | Brand | Constraint | Function | InstanceOf | Intersect | Literal | Never | Number | Object | Object.Readonly | Parser | Record | String | Symbol | Symbol<string | undefined> | Template | Tuple | Tuple.Readonly | Union | Unknown;
    type Spreadable = Runtype.Core<readonly unknown[]> & Iterable<Spread<Spreadable>>;
}
type Conform<T, X> = Runtype.Core<T, X> & Conformance<T, X>;
type Conformance<T, X> = {
    /** @internal */ readonly [RuntypeConformance]: [
        (StaticTypeOfThis: T) => T,
        (ParsedTypeOfThis: X) => X
    ];
};
type IsGeneric<R extends Runtype.Core> = string extends R["tag"] ? true : false;
type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;
type Target<T, U, This extends Runtype.Core> = IsAny<T & U> extends true ? any : IsGeneric<This> extends true ? U : [T & U] extends [never] ? T : U;
type Validated<T, U> = IsAny<T & U> extends true ? T : T & U;
type Context<R extends Runtype.Core> = {
    expected: R;
    received: unknown;
    parsing: boolean;
};
type InnerValidate = <T, X>(context: Context<Runtype.Core<T, X>> & {
    memoParsed?: WeakMap<object, object>;
}) => Result<T | X>;
export default Runtype;
export type { Static, Parsed };
