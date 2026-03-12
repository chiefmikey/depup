// Utilities
import { onBeforeUnmount, shallowRef } from 'vue';
import { IN_BROWSER } from "../util/globals.js";
export function useDocumentVisibility() {
  const visibility = shallowRef(IN_BROWSER ? document.visibilityState : 'visible');
  if (IN_BROWSER) {
    const onVisibilityChange = () => {
      visibility.value = document.visibilityState;
    };
    document.addEventListener('visibilitychange', onVisibilityChange, {
      passive: true
    });
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }
  return visibility;
}
//# sourceMappingURL=documentVisibility.js.map