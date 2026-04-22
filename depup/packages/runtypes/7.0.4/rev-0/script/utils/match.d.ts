import type Runtype from "../Runtype.js";
import { type Static, type Parsed } from "../Runtype.js";
declare const Case: unique symbol;
declare const match: <C extends readonly [Case<any, any>, ...Case<any, any>[]]>(...cases: C) => Matcher<{ [K in keyof C]: C[K] extends Case<infer R, any> ? R : unknown; }, { [K in keyof C]: C[K] extends Case<any, infer Y> ? Y : unknown; }[number]>;
type Case<R extends Runtype.Core, Y> = CaseArgs<R, Y> & {
    [Case]: "must be defined with `when` helper";
};
type CaseArgs<R extends Runtype.Core, Y> = [runtype: R, transformer: (value: Parsed<R>) => Y];
type Matcher<R extends readonly Runtype.Core[], Z> = (value: {
    [K in keyof R]: Static<R[K]>;
}[number]) => Z;
declare const when: {
    <R extends Runtype.Core, Y>(runtype: R, transformer: (value: Parsed<R>) => Y): Case<R, Y>;
    <R extends Runtype.Core, Y>(case_: CaseArgs<R, Y>): Case<R, Y>;
};
export default match;
export { when };
