import type Optional from "./Optional.js";
import Runtype, { type Parsed, type Static } from "./Runtype.js";
type RecordStatic<K extends Runtype.Core<PropertyKey> = Runtype.Core<PropertyKey>, V extends Runtype.Core = Runtype.Core> = V extends Optional ? {
    [_ in Static<K>]?: Static<V>;
} : {
    [_ in Static<K>]: Static<V>;
};
type RecordParsed<K extends Runtype.Core<PropertyKey> = Runtype.Core<PropertyKey>, V extends Runtype.Core = Runtype.Core> = V extends Optional ? {
    [_ in Parsed<K>]?: Parsed<V>;
} : {
    [_ in Parsed<K>]: Parsed<V>;
};
/**
 * Validates that a value is an object, and properties fulfill the given key and value runtypes.
 *
 * Possible failures:
 *
 * - `TYPE_INCORRECT` for `null`, `undefined`, non-objects, non-plain-object non-arrays, and non-plain-object arrays if the key runtype was `String`
 * - `CONTENT_INCORRECT` with `details` reporting the failed properties
 *
 * For each property, contextual failures can be seen in addition to failures of the property runtype:
 *
 * - `PROPERTY_MISSING` for missing required properties
 * - `KEY_INCORRECT` with `detail` reporting the failure of the key runtype
 */
interface Record<K extends Runtype.Core<PropertyKey> = Runtype.Core<PropertyKey>, V extends Runtype.Core = Runtype.Core> extends Runtype<RecordStatic<K, V>, RecordParsed<K, V>> {
    tag: "record";
    key: K;
    value: V;
}
declare const Record: <K extends Runtype.Core<PropertyKey>, V extends Runtype.Core>(key: K, value: V) => Record<K, V>;
export default Record;
