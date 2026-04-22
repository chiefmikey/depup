var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Runtype_createInnerValidate, _b, _c, _d, _e;
import Brand from "./Brand.js";
import Constraint from "./Constraint.js";
import Intersect from "./Intersect.js";
import Literal from "./Literal.js";
import Optional from "./Optional.js";
import Parser from "./Parser.js";
import Union from "./Union.js";
import ValidationError from "./result/ValidationError.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
import copyProperties from "./utils-internal/copyProperties.js";
import defineIntrinsics from "./utils-internal/defineIntrinsics.js";
import isObject from "./utils-internal/isObject.js";
import show from "./utils-internal/show.js";
const RuntypeSymbol = globalThis.Symbol();
const RuntypeConformance = globalThis.Symbol();
const RuntypePrivate = globalThis.Symbol();
/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
class Runtype {
    get [(_b = RuntypeSymbol, _c = RuntypeConformance, _d = RuntypePrivate, globalThis.Symbol.toStringTag)]() {
        return `Runtype<${show(this)}>`;
    }
    toString() {
        return `[object ${this[globalThis.Symbol.toStringTag]}]`;
    }
    /** @internal */ constructor(validate, base) {
        Object.defineProperty(this, "tag", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** @internal */ Object.defineProperty(this, _b, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** @internal */ Object.defineProperty(this, _c, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** @internal */ Object.defineProperty(this, _d, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // @ts-expect-error: type-only
        delete this[RuntypeSymbol];
        // @ts-expect-error: type-only
        delete this[RuntypeConformance];
        copyProperties(this, base);
        defineIntrinsics(this, {
            [RuntypePrivate]: globalThis.Object.assign(({ expected, received, visited, parsing, memoParsed, }) => {
                if (isObject(received)) {
                    const memo = visited.memo(received, expected, null);
                    if (memo)
                        return memo;
                    else if (memo === undefined) {
                        const innerValidate = __classPrivateFieldGet(_a, _a, "f", _Runtype_createInnerValidate).call(_a, visited);
                        const result = expected[RuntypePrivate].validate({
                            received,
                            innerValidate,
                            expected,
                            parsing,
                            memoParsed,
                        });
                        visited.memo(received, expected, result);
                        return result;
                    }
                    else
                        return SUCCESS((parsing && memoParsed?.get(received)) || received);
                }
                else {
                    const innerValidate = __classPrivateFieldGet(_a, _a, "f", _Runtype_createInnerValidate).call(_a, visited);
                    return expected[RuntypePrivate].validate({
                        received,
                        innerValidate,
                        expected,
                        parsing,
                        memoParsed,
                    });
                }
            }, { validate, extensions: [] }),
        });
        copyProperties(base, this);
        bindThis(base, new.target.prototype);
        return base;
    }
    /**
     * Process a value with this runtype, returning a detailed information of success or failure. Does not throw on failure.
     */
    inspect(x, options = {}) {
        return this[RuntypePrivate]({
            expected: this,
            received: x,
            visited: createVisitedState(),
            parsing: options.parse ?? true,
        });
    }
    /**
     * Validates that a value conforms to this runtype, returning the original value, statically typed. Throws `ValidationError` on failure.
     */
    check(x) {
        const result = this.inspect(x, { parse: false });
        if (result.success)
            return result.value;
        else
            throw new ValidationError(result);
    }
    /**
     * Validates that a value conforms to this runtype, returning a `boolean` that represents success or failure. Does not throw on failure.
     */
    guard(x) {
        return this.inspect(x, { parse: false }).success;
    }
    /**
     * Validates that a value conforms to this runtype. Throws `ValidationError` on failure.
     */
    assert(x) {
        return void this.check(x);
    }
    /**
     * Validates that a value conforms to this runtype and returns another value returned by the function passed to `withParser`. Throws `ValidationError` on failure. Does not modify the original value.
     */
    parse(x) {
        const result = this.inspect(x, { parse: true });
        if (result.success)
            return result.value;
        else
            throw new ValidationError(result);
    }
    /**
     * Returns a shallow clone of this runtype with additional properties. Useful when you want to integrate related values, such as the default value and utility functions.
     */
    with(extension) {
        const cloned = this.clone();
        cloned[RuntypePrivate].extensions = [...this[RuntypePrivate].extensions, extension];
        for (const extension of cloned[RuntypePrivate].extensions)
            copyProperties(cloned, typeof extension === "function" ? extension(cloned) : extension);
        return cloned;
    }
    /**
     * Creates a shallow clone of this runtype.
     */
    clone() {
        const base = typeof this === "function"
            ? this.bind(undefined)
            : globalThis.Object.create(globalThis.Object.getPrototypeOf(this));
        copyProperties(base, this);
        const cloned = new _a(this[RuntypePrivate].validate, base);
        cloned[RuntypePrivate].extensions = this[RuntypePrivate].extensions;
        for (const extension of cloned[RuntypePrivate].extensions)
            copyProperties(cloned, typeof extension === "function" ? extension(cloned) : extension);
        return cloned;
    }
    /**
     * Unions this Runtype with another.
     */
    or(other) {
        return Union(this, other);
    }
    /**
     * Intersects this Runtype with another.
     */
    and(other) {
        return Intersect(this, other);
    }
    /**
     * Optionalizes this property.
     *
     * Note that `Optional` is not a runtype, but just a contextual modifier which is only meaningful when defining the content of `Object`. If you want to allow the validated value to be `undefined`, use `undefinedable` method.
     */
    optional() {
        return Optional(this);
    }
    /**
     * Optionalizes this property, defaulting to the given value if this property was absent. Only meaningful for parsing.
     */
    default(value) {
        return Optional(this, value);
    }
    /**
     * Unions this runtype with `Null`.
     */
    nullable() {
        return Union(this, Literal(null));
    }
    /**
     * Unions this runtype with `Undefined`.
     */
    undefinedable() {
        return Union(this, Literal(undefined));
    }
    /**
     * Unions this runtype with `Null` and `Undefined`.
     */
    nullishable() {
        return Union(this, Literal(null), Literal(undefined));
    }
    /**
     * Uses a constraint function to add additional constraints to this runtype, and manually converts a static type of this runtype into another via the type argument if passed.
     */
    withConstraint(constraint) {
        return Constraint(this, (x) => {
            const message = constraint(x);
            if (typeof message === "string")
                throw message;
            else if (!message)
                throw undefined;
        });
    }
    /**
     * Uses a guard function to add additional constraints to this runtype, and automatically converts a static type of this runtype into another.
     */
    withGuard(guard) {
        return Constraint(this, (x) => {
            if (!guard(x))
                throw undefined;
        });
    }
    /**
     * Uses an assertion function to add additional constraints to this runtype, and automatically converts a static type of this runtype into another.
     */
    withAssertion(assert) {
        return Constraint(this, assert);
    }
    /**
     * Adds a brand to the type.
     */
    withBrand(brand) {
        return Brand(brand, this);
    }
    /**
     * Chains custom parser after this runtype. Basically only works in the `parse` method, but in certain cases parsing is implied within a chain of normal validation, such as before execution of a constraint, or upon function boundaries enforced with `Contract` and `AsyncContract`.
     */
    withParser(parser) {
        return Parser(this, parser);
    }
    /**
     * Statically ensures this runtype is defined for exactly `T`, not for a subtype of `T`. `X` is for the parsed type.
     */
    conform() {
        return this;
    }
}
_a = Runtype, _e = globalThis.Symbol.hasInstance;
/** @internal */ Object.defineProperty(Runtype, "create", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (validate, base) => new _a(validate, base)
});
_Runtype_createInnerValidate = { value: (visited) => context => context.expected[RuntypePrivate]({ ...context, visited }) };
/**
 * Guards if a value is a runtype.
 */
Object.defineProperty(Runtype, "isRuntype", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (x) => x instanceof globalThis.Object && globalThis.Object.hasOwn(x, RuntypePrivate)
});
/**
 * Asserts if a value is a runtype.
 */
Object.defineProperty(Runtype, "assertIsRuntype", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: x => {
        if (!_a.isRuntype(x))
            throw new Error("Expected runtype, but was not");
    }
});
Object.defineProperty(Runtype, _e, {
    enumerable: true,
    configurable: true,
    writable: true,
    value: _a.isRuntype
});
const bindThis = (self, prototype) => {
    const descriptors = globalThis.Object.getOwnPropertyDescriptors(prototype);
    delete descriptors["constructor"];
    for (const key of globalThis.Reflect.ownKeys(descriptors)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const descriptor = descriptors[key];
        if ("value" in descriptor && typeof descriptor.value === "function")
            descriptor.value = descriptor.value.bind(self);
        if ("get" in descriptor && descriptor.get)
            descriptor.get = descriptor.get.bind(self);
        if ("set" in descriptor && descriptor.set)
            descriptor.set = descriptor.set.bind(self);
    }
    globalThis.Object.defineProperties(self, descriptors);
};
const createVisitedState = () => {
    const map = new WeakMap();
    const memo = (candidate, runtype, result) => {
        const inner = map.get(candidate) ?? new WeakMap();
        map.set(candidate, inner);
        const memo = inner.get(runtype);
        inner.set(runtype, result);
        return memo;
    };
    return { memo };
};
export default Runtype;
