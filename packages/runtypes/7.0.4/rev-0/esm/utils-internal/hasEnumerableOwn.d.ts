declare const hasEnumerableOwn: <K extends PropertyKey>(key: K, object: object) => object is globalThis.Record<K, unknown>;
export default hasEnumerableOwn;
