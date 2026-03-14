// Composables
import { useProxiedModel } from "./proxiedModel.js"; // Utilities
import { toRef } from 'vue';
import { EventProp, getCurrentInstanceName, propsFactory } from "../util/index.js"; // Types
// Composables
export const makeFocusProps = propsFactory({
  focused: Boolean,
  'onUpdate:focused': EventProp()
}, 'focus');
export function useFocus(props, name = getCurrentInstanceName()) {
  const isFocused = useProxiedModel(props, 'focused');
  const focusClasses = toRef(() => {
    return {
      [`${name}--focused`]: isFocused.value
    };
  });
  function focus() {
    isFocused.value = true;
  }
  function blur() {
    isFocused.value = false;
  }
  return {
    focusClasses,
    isFocused,
    focus,
    blur
  };
}
//# sourceMappingURL=focus.js.map