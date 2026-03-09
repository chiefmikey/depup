// Composables
import { useResizeObserver } from "../../composables/resizeObserver.js"; // Utilities
import { computed, inject, onBeforeUnmount, provide, ref, toRef, useId, watch } from 'vue';

// Types

export const VSnackbarQueueSymbol = Symbol.for('vuetify:v-snackbar-queue');
export function useSnackbarQueue(props) {
  const items = ref(new Map());
  const gap = toRef(() => Number(props.gap));
  function register(id) {
    items.value.set(id, {
      height: 0,
      width: 0
    });
  }
  function unregister(id) {
    items.value.delete(id);
  }
  function setSize(id, height, width) {
    const item = items.value.get(id);
    if (!item || item.height === height && item.width === width) return;
    item.height = height;
    item.width = width;
  }
  const lastItemSize = computed(() => {
    for (const {
      width,
      height
    } of [...items.value.values()].toReversed()) {
      if (!width || !height) continue;
      return {
        width,
        height
      };
    }
    return {
      width: 0,
      height: 0
    };
  });
  function getOffset(id) {
    if (!items.value.has(id)) return null;
    let offset = 0;
    for (const [itemId, state] of [...items.value.entries()].toReversed()) {
      if (itemId === id) break;
      offset += state.height + gap.value;
    }
    return offset;
  }
  const state = {
    register,
    unregister,
    setSize,
    getOffset,
    items,
    gap,
    lastItemSize
  };
  provide(VSnackbarQueueSymbol, state);
  return state;
}
export function useSnackbarItem(isActive, contentEl) {
  const queue = inject(VSnackbarQueueSymbol, null);
  if (!queue) return null;
  const id = useId();
  queue.register(id);
  onBeforeUnmount(() => queue.unregister(id));
  watch(isActive, val => !val && queue.unregister(id), {
    flush: 'sync'
  });
  const {
    resizeRef,
    contentRect
  } = useResizeObserver();
  watch(contentEl, el => {
    resizeRef.value = el ?? null;
  });
  watch(contentRect, rect => {
    if (rect?.width) queue.setSize(id, rect.height, rect.width);
  });
  const offset = computed(() => queue.getOffset(id));
  return {
    id,
    offset
  };
}
//# sourceMappingURL=queue.js.map