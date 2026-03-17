import Runtype from "./Runtype.js";
import FAILURE from "./utils-internal/FAILURE.js";
import SUCCESS from "./utils-internal/SUCCESS.js";
const SymbolFor = (key) => Runtype.create(({ received, expected }) => {
    if (typeof received !== "symbol")
        return FAILURE.TYPE_INCORRECT({ expected, received });
    else {
        if (globalThis.Symbol.keyFor(received) !== expected.key)
            return FAILURE.VALUE_INCORRECT({ expected, received });
        else
            return SUCCESS(received);
    }
}, { tag: "symbol", key });
const Symbol = Runtype.create(({ received, expected }) => typeof received === "symbol"
    ? SUCCESS(received)
    : FAILURE.TYPE_INCORRECT({ expected, received }), globalThis.Object.assign(SymbolFor, { tag: "symbol" }));
export default Symbol;
