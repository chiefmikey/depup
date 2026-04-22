"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Mimicking the behavior of type-level `` `${number}` ``.
 *
 * Note that `` `${NaN}` `` is not assignable to a variable of type `` `${number}` ``, but `` `${NaN as number}` `` is assignable, thus this function also accepts `"NaN"`. The same applies to `Infinity` and `-Infinity`.
 */
const isNumberLikeKey = (key) => typeof key === "string" && key === globalThis.Number(key).toString();
exports.default = isNumberLikeKey;
