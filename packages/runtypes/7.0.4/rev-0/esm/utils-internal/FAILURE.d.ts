import type Runtype from "../Runtype.js";
import Failcode from "../result/Failcode.js";
import type Failure from "../result/Failure.js";
type FailureInitializer<C extends Failcode> = Failure & {
    code: C;
} extends infer F ? {
    [K in keyof F as K extends "expected" ? K : never]: Runtype.Core;
} & {
    [K in keyof F as K extends "success" | "message" | "code" | "expected" ? never : K]: F[K];
} extends infer T ? {
    [K in keyof T]: T[K];
} : never : never;
declare const FAILURE: {
    [C in Failcode]: (failure: FailureInitializer<C>) => Failure & {
        code: C;
    };
};
export default FAILURE;
