// Utilities
import { toRef } from 'vue';
import { getCurrentInstanceName, propsFactory } from "../util/index.js"; // Types
const positionValues = ['static', 'relative', 'fixed', 'absolute', 'sticky'];
// Composables
export const makePositionProps = propsFactory({
  position: {
    type: String,
    validator: /* istanbul ignore next */v => positionValues.includes(v)
  }
}, 'position');
export function usePosition(props, name = getCurrentInstanceName()) {
  const positionClasses = toRef(() => {
    return props.position ? `${name}--${props.position}` : undefined;
  });
  return {
    positionClasses
  };
}
//# sourceMappingURL=position.js.map