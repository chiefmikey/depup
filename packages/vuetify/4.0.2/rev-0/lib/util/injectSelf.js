// Utilities
import { getCurrentInstance } from "./getCurrentInstance.js"; // Types
export function injectSelf(key, vm = getCurrentInstance('injectSelf')) {
  const {
    provides
  } = vm;
  if (provides && key in provides) {
    // TS doesn't allow symbol as index type
    return provides[key];
  }
  return undefined;
}
//# sourceMappingURL=injectSelf.js.map