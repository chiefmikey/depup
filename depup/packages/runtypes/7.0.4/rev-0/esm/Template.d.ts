import type Literal from "./Literal.js";
import Runtype, { type Parsed, type Static } from "./Runtype.js";
type LiteralStatic = Static<Literal>;
type TemplateParsed<A extends readonly LiteralStatic[], B extends readonly Runtype.Core<LiteralStatic>[]> = A extends readonly [infer carA, ...infer cdrA] ? carA extends LiteralStatic ? B extends readonly [infer carB, ...infer cdrB] ? carB extends Runtype.Core<LiteralStatic> ? cdrA extends readonly LiteralStatic[] ? cdrB extends readonly Runtype.Core<LiteralStatic>[] ? `${carA}${Parsed<carB>}${TemplateParsed<cdrA, cdrB>}` : `${carA}${Parsed<carB>}` : `${carA}${Parsed<carB>}` : `${carA}` : `${carA}` : "" : "";
type TemplateStatic<A extends readonly LiteralStatic[], B extends readonly Runtype.Core<LiteralStatic>[]> = A extends readonly [infer carA, ...infer cdrA] ? carA extends LiteralStatic ? B extends readonly [infer carB, ...infer cdrB] ? carB extends Runtype.Core<LiteralStatic> ? cdrA extends readonly LiteralStatic[] ? cdrB extends readonly Runtype.Core<LiteralStatic>[] ? `${carA}${Static<carB>}${TemplateStatic<cdrA, cdrB>}` : `${carA}${Static<carB>}` : `${carA}${Static<carB>}` : `${carA}` : `${carA}` : "" : "";
/**
 * Validates that a value is a string that conforms to the template.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for non-strings
 * - `VALUE_INCORRECT` if the string didn't match the template
 *
 * You can use the familiar syntax to create a `Template` runtype:
 *
 * ```ts
 * const T = Template`foo${Literal('bar')}baz`;
 * ```
 *
 * But then the type inference won't work:
 *
 * ```ts
 * type T = Static<typeof T>; // inferred as string
 * ```
 *
 * Because TS doesn't provide the exact string literal type information (`["foo", "baz"]` in this case) to the underlying function. See the issue [microsoft/TypeScript#33304](https://github.com/microsoft/TypeScript/issues/33304), especially this comment [microsoft/TypeScript#33304 (comment)](https://github.com/microsoft/TypeScript/issues/33304#issuecomment-697977783) we hope to be implemented.
 *
 * If you want the type inference rather than the tagged syntax, you have to manually write a function call:
 *
 * ```ts
 * const T = Template(['foo', 'baz'] as const, Literal('bar'));
 * type T = Static<typeof T>; // inferred as "foobarbaz"
 * ```
 *
 * As a convenient solution for this, it also supports another style of passing arguments:
 *
 * ```ts
 * const T = Template('foo', Literal('bar'), 'baz');
 * type T = Static<typeof T>; // inferred as "foobarbaz"
 * ```
 *
 * You can pass various things to the `Template` constructor, as long as they are assignable to `string | number | bigint | boolean | null | undefined` and the corresponding `Runtype`s:
 *
 * ```ts
 * // Equivalent runtypes
 * Template(Literal('42'));
 * Template(42);
 * Template(Template('42'));
 * Template(4, '2');
 * Template(Literal(4), '2');
 * Template(String.withConstraint(s => s === '42'));
 * Template(
 *   Intersect(
 *     Number.withConstraint(n => n === 42),
 *     String.withConstraint(s => s.length === 2),
 *     // `Number`s in `Template` accept alternative representations like `"0x2A"`,
 *     // thus we have to constraint the length of string, to accept only `"42"`
 *   ),
 * );
 * ```
 *
 * Trivial items such as bare literals, `Literal`s, and single-element `Union`s and `Intersect`s are all coerced into strings at the creation time of the runtype. Additionally, `Union`s of such runtypes are converted into `RegExp` patterns like `(?:foo|bar|...)`, so we can assume `Union` of `Literal`s is a fully supported runtype in `Template`.
 *
 * ### Caveats
 *
 * A `Template` internally constructs a `RegExp` to parse strings. This can lead to a problem if it contains multiple non-literal runtypes:
 *
 * ```ts
 * const UpperCaseString = Constraint(String, s => s === s.toUpperCase(), {
 *   name: 'UpperCaseString',
 * });
 * const LowerCaseString = Constraint(String, s => s === s.toLowerCase(), {
 *   name: 'LowerCaseString',
 * });
 * Template(UpperCaseString, LowerCaseString);
 * ```
 *
 * The only thing we can do for parsing such strings correctly is brute-forcing every single possible combination until it fulfills all the constraints, which must be hardly done. Actually `Template` treats `String` runtypes as the simplest `RegExp` pattern `.*` and the “greedy” strategy is always used, that is, the above runtype won't work expectedly because the entire pattern is just `^(.*)(.*)$` and the first `.*` always wins. You have to avoid using `Constraint` this way, and instead manually parse it using a single `Constraint` which covers the entire string.
 */
interface Template<A extends readonly [string, ...string[]] = readonly [string, ...string[]], B extends readonly Runtype.Core<LiteralStatic>[] = readonly Runtype.Core<LiteralStatic>[]> extends Runtype<A extends TemplateStringsArray ? string : TemplateStatic<A, B>, A extends TemplateStringsArray ? string : TemplateParsed<A, B>> {
    tag: "template";
    strings: A;
    runtypes: B;
}
type ExtractStrings<A extends readonly (LiteralStatic | Runtype.Core<LiteralStatic>)[], prefix extends string = ""> = A extends readonly [infer carA, ...infer cdrA] ? cdrA extends readonly any[] ? carA extends Runtype.Core<LiteralStatic> ? [prefix, ...ExtractStrings<cdrA>] : carA extends LiteralStatic ? [...ExtractStrings<cdrA, `${prefix}${carA}`>] : never : never : [prefix];
type ExtractRuntypes<A extends readonly (LiteralStatic | Runtype.Core<LiteralStatic>)[]> = A extends readonly [infer carA, ...infer cdrA] ? cdrA extends readonly any[] ? carA extends Runtype.Core<LiteralStatic> ? [carA, ...ExtractRuntypes<cdrA>] : carA extends LiteralStatic ? [...ExtractRuntypes<cdrA>] : never : never : [];
declare const Template: {
    <A extends TemplateStringsArray, B extends readonly Runtype.Core<LiteralStatic>[]>(strings: A, ...runtypes: B): Template<A & [string, ...string[]], B>;
    <A extends readonly [string, ...string[]], B extends readonly Runtype.Core<LiteralStatic>[]>(strings: A, ...runtypes: B): Template<A, B>;
    <A extends readonly (LiteralStatic | Runtype.Core<LiteralStatic>)[]>(...args: A): Template<ExtractStrings<A>, ExtractRuntypes<A>>;
};
export default Template;
