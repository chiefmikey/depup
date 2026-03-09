import { createVNode as _createVNode, normalizeClass as _normalizeClass, normalizeStyle as _normalizeStyle } from "vue";
// Styles
import "./VAvatar.css";

// Components
import { VBadge } from "../VBadge/VBadge.js";
import { VDefaultsProvider } from "../VDefaultsProvider/index.js";
import { VIcon } from "../VIcon/index.js";
import { VImg } from "../VImg/index.js"; // Composables
import { makeBorderProps, useBorder } from "../../composables/border.js";
import { makeComponentProps } from "../../composables/component.js";
import { makeDensityProps, useDensity } from "../../composables/density.js";
import { IconValue } from "../../composables/icons.js";
import { makeRoundedProps, useRounded } from "../../composables/rounded.js";
import { makeSizeProps, useSize } from "../../composables/size.js";
import { makeTagProps } from "../../composables/tag.js";
import { makeThemeProps, provideTheme } from "../../composables/theme.js";
import { genOverlays, makeVariantProps, useVariant } from "../../composables/variant.js"; // Utilities
import { computed } from 'vue';
import { genericComponent, isObject, propsFactory, useRender } from "../../util/index.js"; // Types
export const makeVAvatarProps = propsFactory({
  badge: {
    type: [Boolean, Object],
    default: false
  },
  start: Boolean,
  end: Boolean,
  icon: IconValue,
  image: String,
  text: String,
  ...makeBorderProps(),
  ...makeComponentProps(),
  ...makeDensityProps(),
  ...makeRoundedProps(),
  ...makeSizeProps(),
  ...makeTagProps(),
  ...makeThemeProps(),
  ...makeVariantProps({
    variant: 'flat'
  })
}, 'VAvatar');
export const VAvatar = genericComponent()({
  name: 'VAvatar',
  props: makeVAvatarProps(),
  setup(props, {
    slots
  }) {
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      sizeClasses,
      sizeStyles
    } = useSize(props);
    const badgeDotSize = computed(() => {
      switch (props.size) {
        case 'x-small':
          return 8;
        case 'small':
          return 10;
        case 'large':
          return 14;
        case 'x-large':
          return 16;
        default:
          return 12;
      }
    });
    const badgeOffset = computed(() => {
      const {
        floating
      } = isObject(props.badge) ? props.badge : {};
      return (floating ? badgeDotSize.value / 2 : 0) - 1.5;
    });
    const badgeProps = computed(() => {
      return {
        bordered: true,
        dot: !slots.badge,
        dotSize: badgeDotSize.value,
        offsetX: badgeOffset.value,
        offsetY: badgeOffset.value,
        color: typeof props.badge === 'string' ? props.badge : 'primary',
        ...(isObject(props.badge) ? props.badge : {})
      };
    });
    useRender(() => {
      const avatar = _createVNode(props.tag, {
        "class": _normalizeClass(['v-avatar', {
          'v-avatar--start': props.start,
          'v-avatar--end': props.end
        }, themeClasses.value, borderClasses.value, colorClasses.value, densityClasses.value, roundedClasses.value, sizeClasses.value, variantClasses.value, props.class]),
        "style": _normalizeStyle([colorStyles.value, sizeStyles.value, props.style])
      }, {
        default: () => [!slots.default ? props.image ? _createVNode(VImg, {
          "key": "image",
          "src": props.image,
          "alt": "",
          "cover": true
        }, null) : props.icon ? _createVNode(VIcon, {
          "key": "icon",
          "icon": props.icon
        }, null) : props.text : _createVNode(VDefaultsProvider, {
          "key": "content-defaults",
          "defaults": {
            VImg: {
              cover: true,
              src: props.image
            },
            VIcon: {
              icon: props.icon
            }
          }
        }, {
          default: () => [slots.default()]
        }), genOverlays(false, 'v-avatar')]
      });
      return props.badge ? _createVNode(VBadge, badgeProps.value, {
        default: () => avatar,
        badge: slots.badge
      }) : avatar;
    });
    return {};
  }
});
//# sourceMappingURL=VAvatar.js.map