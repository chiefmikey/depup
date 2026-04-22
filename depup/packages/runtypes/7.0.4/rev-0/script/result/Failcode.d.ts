/**
 * A predefined error code indicating what type of failure has occured.
 */
type Failcode = keyof typeof Failcode;
declare const Failcode: {
    /** The type of the received primitive value is incompatible with expected one. */
    readonly TYPE_INCORRECT: "TYPE_INCORRECT";
    /** The received primitive value is incorrect. */
    readonly VALUE_INCORRECT: "VALUE_INCORRECT";
    /** The key of the property is incorrect. */
    readonly KEY_INCORRECT: "KEY_INCORRECT";
    /** One or more elements or properties of the received object are incorrect. */
    readonly CONTENT_INCORRECT: "CONTENT_INCORRECT";
    /** One or more arguments passed to the function is incorrect. */
    readonly ARGUMENTS_INCORRECT: "ARGUMENTS_INCORRECT";
    /** The value returned by the function is incorrect. */
    readonly RETURN_INCORRECT: "RETURN_INCORRECT";
    /** The value resolved by the function is incorrect. */
    readonly RESOLVE_INCORRECT: "RESOLVE_INCORRECT";
    /** The received value does not fulfill the constraint. */
    readonly CONSTRAINT_FAILED: "CONSTRAINT_FAILED";
    /** The property must be present but missing. */
    readonly PROPERTY_MISSING: "PROPERTY_MISSING";
    /** The property must not be present but present. */
    readonly PROPERTY_PRESENT: "PROPERTY_PRESENT";
    /** The value must not be present but present. */
    readonly NOTHING_EXPECTED: "NOTHING_EXPECTED";
    /** The value can't be parsed. */
    readonly PARSING_FAILED: "PARSING_FAILED";
    /** `Symbol.hasInstance` of the class failed. */
    readonly INSTANCEOF_FAILED: "INSTANCEOF_FAILED";
};
export default Failcode;
