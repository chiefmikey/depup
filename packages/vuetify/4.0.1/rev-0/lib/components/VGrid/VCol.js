// Styles
import "./VGrid.css";

// Composables
import { makeComponentProps } from "../../composables/component.js";
import { breakpoints } from "../../composables/display.js";
import { makeTagProps } from "../../composables/tag.js"; // Utilities
import { capitalize, computed, h } from 'vue';
import { genericComponent, keys, propsFactory } from "../../util/index.js"; // Types
const breakpointProps = (() => {
  return breakpoints.reduce((props, val) => {
    props[val] = {
      type: [Boolean, String, Number],
      default: false
    };
    return props;
  }, {});
})();
const offsetProps = (() => {
  return breakpoints.reduce((props, val) => {
    const offsetKey = 'offset' + capitalize(val);
    props[offsetKey] = {
      type: [String, Number],
      default: null
    };
    return props;
  }, {});
})();
const propMap = {
  col: keys(breakpointProps),
  offset: keys(offsetProps),
  order: ['order', 'orderSm', 'orderMd', 'orderLg', 'orderXl', 'orderXxl']
};
function parseCols(val) {
  if (typeof val === 'string' && val.includes('/')) {
    const [cols, size] = val.split('/');
    return {
      cols: Number(cols),
      size: Number(size)
    };
  }
  return {
    cols: val
  };
}
function parseBreakpoint(type, prop, val) {
  if (val == null || val === false) {
    return {};
  }
  const {
    cols,
    size
  } = parseCols(val);
  const breakpoint = prop.replace(type, '').toLowerCase();
  if (type === 'offset') {
    return {
      className: `v-col--offset-${breakpoint}-${cols}`,
      variables: [{
        [`--v-col-offset-base-${breakpoint}`]: size
      }]
    };
  } else if (type === 'order') {
    return {
      className: `order-${breakpoint}-${cols}`
    };
  }

  // Handling the boolean style prop when accepting [Boolean, String, Number]
  // means Vue will not convert <v-col sm></v-col> to sm: true for us.
  // Since the default is false, an empty string indicates the prop's presence.
  return {
    className: cols === '' || cols === true ? `v-col--${breakpoint}` : `v-col--cols-${breakpoint}-${cols}`,
    variables: [{
      [`--v-col-size-base-${breakpoint}`]: size
    }]
  };
}
const ALIGN_SELF_VALUES = ['auto', 'start', 'end', 'center', 'baseline', 'stretch'];
const alignSelfValidator = str => ALIGN_SELF_VALUES.includes(str);
export const makeVColProps = propsFactory({
  cols: {
    type: [Boolean, String, Number],
    default: false
  },
  ...breakpointProps,
  offset: {
    type: [String, Number],
    default: null
  },
  ...offsetProps,
  /** @deprecated use order-* class instead */
  order: {
    type: [String, Number],
    default: null
  },
  /** @deprecated use order-sm-* class instead */
  orderSm: {
    type: String,
    default: null
  },
  /** @deprecated use order-md-* class instead */
  orderMd: {
    type: String,
    default: null
  },
  /** @deprecated use order-lg-* class instead */
  orderLg: {
    type: String,
    default: null
  },
  /** @deprecated use order-xl-* class instead */
  orderXl: {
    type: String,
    default: null
  },
  /** @deprecated use order-xxl-* class instead */
  orderXxl: {
    type: String,
    default: null
  },
  /** @deprecated use align-self-* class instead */
  alignSelf: {
    type: String,
    default: null,
    validator: alignSelfValidator
  },
  /** @deprecated use align-self-sm-* class instead */
  alignSelfSm: {
    type: String,
    default: null,
    validator: alignSelfValidator
  },
  /** @deprecated use align-self-md-* class instead */
  alignSelfMd: {
    type: String,
    default: null,
    validator: alignSelfValidator
  },
  /** @deprecated use align-self-lg-* class instead */
  alignSelfLg: {
    type: String,
    default: null,
    validator: alignSelfValidator
  },
  /** @deprecated use align-self-xl-* class instead */
  alignSelfXl: {
    type: String,
    default: null,
    validator: alignSelfValidator
  },
  /** @deprecated use align-self-xxl-* class instead */
  alignSelfXxl: {
    type: String,
    default: null,
    validator: alignSelfValidator
  },
  ...makeComponentProps(),
  ...makeTagProps()
}, 'VCol');
export const VCol = genericComponent()({
  name: 'VCol',
  props: makeVColProps(),
  setup(props, {
    slots
  }) {
    const sizeBaseOverride = computed(() => parseCols(props.cols).size);
    const offsetBaseOverride = computed(() => parseCols(props.offset).size);
    const responsive = computed(() => {
      const classList = ['v-col'];
      const variablesList = [];

      // Loop through `col`, `offset`, `order` breakpoint props
      let type;
      for (type in propMap) {
        propMap[type].forEach(prop => {
          const value = props[prop];
          const {
            className,
            variables
          } = parseBreakpoint(type, prop, value);
          if (className) classList.push(className);
          if (variables) variablesList.push(...variables);
        });
      }
      const {
        cols
      } = parseCols(props.cols);
      const {
        cols: offset
      } = parseCols(props.offset);
      classList.push({
        [`v-col--cols-${cols}`]: cols,
        [`v-col--offset-${offset}`]: offset,
        [`order-${props.order}`]: props.order,
        [`align-self-${props.alignSelf}`]: props.alignSelf
      });
      return {
        classes: classList,
        variables: variablesList
      };
    });
    return () => h(props.tag, {
      class: [responsive.value.classes, props.class],
      style: [{
        '--v-col-size-base': sizeBaseOverride.value
      }, {
        '--v-col-offset-base': offsetBaseOverride.value
      }, responsive.value.variables, props.style]
    }, slots.default?.());
  }
});
//# sourceMappingURL=VCol.js.map