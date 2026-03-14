// Styles
import "./VGrid.css";

// Composables
import { makeComponentProps } from "../../composables/component.js";
import { makeDensityProps } from "../../composables/density.js";
import { makeTagProps } from "../../composables/tag.js"; // Utilities
import { computed, h } from 'vue';
import { convertToUnit, deprecate, genericComponent, propsFactory } from "../../util/index.js"; // Types
const ALIGNMENT = ['start', 'end', 'center'];
const SPACE = ['space-between', 'space-around', 'space-evenly'];
const ALIGN_VALUES = [...ALIGNMENT, 'baseline', 'stretch'];
const alignValidator = str => ALIGN_VALUES.includes(str);
const JUSTIFY_VALUES = [...ALIGNMENT, ...SPACE];
const justifyValidator = str => JUSTIFY_VALUES.includes(str);
const ALIGN_CONTENT_VALUES = [...ALIGNMENT, ...SPACE, 'stretch'];
const alignContentValidator = str => ALIGN_CONTENT_VALUES.includes(str);
const propMap = {
  align: ['align', 'alignSm', 'alignMd', 'alignLg', 'alignXl', 'alignXxl'],
  justify: ['justify', 'justifySm', 'justifyMd', 'justifyLg', 'justifyXl', 'justifyXxl'],
  alignContent: ['alignContent', 'alignContentSm', 'alignContentMd', 'alignContentLg', 'alignContentXl', 'alignContentXxl']
};
const classMap = {
  align: 'align',
  justify: 'justify',
  alignContent: 'align-content'
};
function breakpointClass(type, prop, val) {
  let className = classMap[type];
  if (val == null) {
    return undefined;
  }
  if (prop) {
    // alignSm -> Sm
    const breakpoint = prop.replace(type, '');
    className += `-${breakpoint}`;
  }
  // .align-items-sm-center
  className += `-${val}`;
  return className.toLowerCase();
}
export const makeVRowProps = propsFactory({
  /** @deprecated use density="compact" instead */
  dense: Boolean,
  /** @deprecated use align-* class instead */
  align: {
    type: String,
    default: null,
    validator: alignValidator
  },
  /** @deprecated use align-sm-* class instead */
  alignSm: {
    type: String,
    default: null,
    validator: alignValidator
  },
  /** @deprecated use align-md-* class instead */
  alignMd: {
    type: String,
    default: null,
    validator: alignValidator
  },
  /** @deprecated use align-lg-* class instead */
  alignLg: {
    type: String,
    default: null,
    validator: alignValidator
  },
  /** @deprecated use align-xl-* class instead */
  alignXl: {
    type: String,
    default: null,
    validator: alignValidator
  },
  /** @deprecated use align-xxl-* class instead */
  alignXxl: {
    type: String,
    default: null,
    validator: alignValidator
  },
  /** @deprecated use justify-* class instead */
  justify: {
    type: String,
    default: null,
    validator: justifyValidator
  },
  /** @deprecated use justify-sm-* class instead */
  justifySm: {
    type: String,
    default: null,
    validator: justifyValidator
  },
  /** @deprecated use justify-md-* class instead */
  justifyMd: {
    type: String,
    default: null,
    validator: justifyValidator
  },
  /** @deprecated use justify-lg-* class instead */
  justifyLg: {
    type: String,
    default: null,
    validator: justifyValidator
  },
  /** @deprecated use justify-xl-* class instead */
  justifyXl: {
    type: String,
    default: null,
    validator: justifyValidator
  },
  /** @deprecated use justify-xxl-* class instead */
  justifyXxl: {
    type: String,
    default: null,
    validator: justifyValidator
  },
  /** @deprecated use align-content-* class instead */
  alignContent: {
    type: String,
    default: null,
    validator: alignContentValidator
  },
  /** @deprecated use align-content-sm-* class instead */
  alignContentSm: {
    type: String,
    default: null,
    validator: alignContentValidator
  },
  /** @deprecated use align-content-md-* class instead */
  alignContentMd: {
    type: String,
    default: null,
    validator: alignContentValidator
  },
  /** @deprecated use align-content-lg-* class instead */
  alignContentLg: {
    type: String,
    default: null,
    validator: alignContentValidator
  },
  /** @deprecated use align-content-xl-* class instead */
  alignContentXl: {
    type: String,
    default: null,
    validator: alignContentValidator
  },
  /** @deprecated use align-content-xxl-* class instead */
  alignContentXxl: {
    type: String,
    default: null,
    validator: alignContentValidator
  },
  noGutters: Boolean,
  gap: [Number, String, Array],
  size: [Number, String],
  ...makeComponentProps(),
  ...makeDensityProps(),
  ...makeTagProps()
}, 'VRow');
export const VRow = genericComponent()({
  name: 'VRow',
  props: makeVRowProps(),
  setup(props, {
    slots
  }) {
    if (props.dense) {
      deprecate('dense', 'density="comfortable"');
    }
    const classes = computed(() => {
      const classList = [];

      // Loop through `align`, `justify`, `alignContent` breakpoint props
      let type;
      for (type in propMap) {
        propMap[type].forEach(prop => {
          const value = props[prop];
          const className = breakpointClass(type, prop, value);
          if (className) classList.push(className);
        });
      }
      classList.push({
        'v-row--density-default': props.density === 'default' && !props.noGutters && !props.dense,
        'v-row--density-compact': props.density === 'compact' || props.noGutters,
        'v-row--density-comfortable': props.density === 'comfortable' || props.dense,
        [`align-${props.align}`]: props.align,
        [`justify-${props.justify}`]: props.justify,
        [`align-content-${props.alignContent}`]: props.alignContent
      });
      return classList;
    });
    const horizontalGap = computed(() => {
      return Array.isArray(props.gap) ? convertToUnit(props.gap[0] || 0) : convertToUnit(props.gap);
    });
    const verticalGap = computed(() => {
      return Array.isArray(props.gap) ? convertToUnit(props.gap[1] || 0) : horizontalGap.value;
    });
    return () => h(props.tag, {
      class: ['v-row', classes.value, props.class],
      style: [{
        '--v-col-gap-x': horizontalGap.value,
        '--v-col-gap-y': verticalGap.value,
        '--v-row-columns': props.size
      }, props.style]
    }, slots.default?.());
  }
});
//# sourceMappingURL=VRow.js.map