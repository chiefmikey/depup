// Composables
import { makeComponentProps } from "../composables/component.js"; // Utilities
import { camelize, capitalize, h } from 'vue';
import { genericComponent } from "./defineComponent.js";
export function createSimpleFunctional(klass, tag = 'div', name) {
  return genericComponent()({
    name: name ?? capitalize(camelize(klass.replace(/__/g, '-'))),
    props: {
      tag: {
        type: String,
        default: tag
      },
      ...makeComponentProps()
    },
    setup(props, {
      slots
    }) {
      return () => {
        return h(props.tag, {
          class: [klass, props.class],
          style: props.style
        }, slots.default?.());
      };
    }
  });
}
//# sourceMappingURL=createSimpleFunctional.js.map