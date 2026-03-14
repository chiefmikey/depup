// Utilities
import { isRef, toRef } from 'vue';
import { propsFactory } from "../util/index.js"; // Types
// Composables
export const makeElevationProps = propsFactory({
  elevation: {
    type: [Number, String],
    // no limit to allow both 0-6 (MD3) and legacy 0-24 (MD2)
    validator: value => parseInt(value) >= 0
  }
}, 'elevation');
export function useElevation(props) {
  const elevationClasses = toRef(() => {
    const elevation = isRef(props) ? props.value : props.elevation;
    if (elevation == null) return [];
    return [`elevation-${parseInt(elevation)}`];
  });
  return {
    elevationClasses
  };
}
//# sourceMappingURL=elevation.js.map