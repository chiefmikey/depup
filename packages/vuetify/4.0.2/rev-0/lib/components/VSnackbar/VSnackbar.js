import { createElementVNode as _createElementVNode, createVNode as _createVNode, normalizeClass as _normalizeClass, Fragment as _Fragment, mergeProps as _mergeProps } from "vue";
// Styles
import "./VSnackbar.css";

// Components
import { VAvatar } from "../VAvatar/index.js";
import { VDefaultsProvider } from "../VDefaultsProvider/index.js";
import { VIcon } from "../VIcon/index.js";
import { VOverlay } from "../VOverlay/index.js";
import { makeVOverlayProps } from "../VOverlay/VOverlay.js";
import { VProgressCircular } from "../VProgressCircular/index.js";
import { VProgressLinear } from "../VProgressLinear/index.js";
import { useSnackbarItem } from "../VSnackbarQueue/queue.js"; // Composables
import { useLayout } from "../../composables/index.js";
import { forwardRefs } from "../../composables/forwardRefs.js";
import { IconValue } from "../../composables/icons.js";
import { VuetifyLayoutKey } from "../../composables/layout.js";
import { makeLocationProps } from "../../composables/location.js";
import { makePositionProps, usePosition } from "../../composables/position.js";
import { useProxiedModel } from "../../composables/proxiedModel.js";
import { makeRoundedProps, useRounded } from "../../composables/rounded.js";
import { useScopeId } from "../../composables/scopeId.js";
import { makeThemeProps, provideTheme } from "../../composables/theme.js";
import { useToggleScope } from "../../composables/toggleScope.js";
import { genOverlays, makeVariantProps, useVariant } from "../../composables/variant.js"; // Utilities
import { computed, inject, mergeProps, nextTick, onMounted, onScopeDispose, ref, shallowRef, watch, watchEffect } from 'vue';
import { convertToUnit, genericComponent, omit, propsFactory, refElement, useRender } from "../../util/index.js"; // Types
function useCountdown(milliseconds) {
  const time = shallowRef(milliseconds());
  let timer = -1;
  function clear() {
    clearInterval(timer);
  }
  function reset() {
    clear();
    nextTick(() => time.value = milliseconds());
  }
  function start(el) {
    const style = el ? getComputedStyle(el) : {
      transitionDuration: 0.2
    };
    const interval = parseFloat(style.transitionDuration) * 1000 || 200;
    clear();
    if (time.value <= 0) return;
    const startTime = performance.now();
    timer = window.setInterval(() => {
      const elapsed = performance.now() - startTime + interval;
      time.value = Math.max(milliseconds() - elapsed, 0);
      if (time.value <= 0) clear();
    }, interval);
  }
  onScopeDispose(clear);
  return {
    clear,
    time,
    start,
    reset
  };
}
export const makeVSnackbarProps = propsFactory({
  collapsed: Object,
  loading: Boolean,
  prependAvatar: String,
  prependIcon: IconValue,
  queueGap: Number,
  queueIndex: Number,
  title: String,
  text: String,
  reverseTimer: Boolean,
  timer: {
    type: [Boolean, String],
    default: false
  },
  timerColor: String,
  timeout: {
    type: [Number, String],
    default: 5000
  },
  vertical: Boolean,
  ...makeLocationProps({
    location: 'bottom'
  }),
  ...makePositionProps(),
  ...makeRoundedProps(),
  ...makeVariantProps(),
  ...makeThemeProps(),
  ...omit(makeVOverlayProps({
    transition: 'v-snackbar-transition'
  }), ['persistent', 'noClickAnimation', 'offset', 'retainFocus', 'captureFocus', 'disableInitialFocus', 'scrim', 'scrollStrategy', 'stickToTarget', 'viewportMargin'])
}, 'VSnackbar');
export const VSnackbar = genericComponent()({
  name: 'VSnackbar',
  props: makeVSnackbarProps(),
  emits: {
    'update:modelValue': v => true
  },
  setup(props, {
    slots
  }) {
    const isActive = useProxiedModel(props, 'modelValue');
    const {
      positionClasses
    } = usePosition(props);
    const {
      scopeId
    } = useScopeId();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(props);
    const {
      roundedClasses
    } = useRounded(props);
    const countdown = useCountdown(() => Number(props.timeout));
    const overlay = ref();
    const queueItem = useSnackbarItem(isActive, () => overlay.value?.contentEl);
    let _lastOffset;
    const timerRef = ref();
    const isHovering = shallowRef(false);
    const isFocused = shallowRef(false);
    const startY = shallowRef(0);
    const mainStyles = ref();
    const hasLayout = inject(VuetifyLayoutKey, undefined);
    useToggleScope(() => !!hasLayout, () => {
      const layout = useLayout();
      watchEffect(() => {
        mainStyles.value = layout.mainStyles.value;
      });
    });
    watch(isActive, startTimeout);
    watch(() => props.timeout, startTimeout);
    onMounted(() => {
      if (isActive.value) startTimeout();
    });
    let activeTimeout = -1;
    function startTimeout() {
      countdown.reset();
      window.clearTimeout(activeTimeout);
      const timeout = Number(props.timeout);
      if (!isActive.value || timeout === -1) return;
      const element = refElement(timerRef.value);
      nextTick(() => countdown.start(element));
      activeTimeout = window.setTimeout(() => {
        isActive.value = false;
      }, timeout);
    }
    function clearTimeout() {
      countdown.reset();
      window.clearTimeout(activeTimeout);
    }
    function onPointerenter() {
      isHovering.value = true;
      clearTimeout();
    }
    function onPointerleave() {
      isHovering.value = false;
      if (!isFocused.value) startTimeout();
    }
    function onFocusin() {
      isFocused.value = true;
      clearTimeout();
    }
    function onFocusout(event) {
      const contentEl = overlay.value?.contentEl;
      if (contentEl?.contains(event.relatedTarget)) {
        return;
      }
      isFocused.value = false;
      if (!isHovering.value) startTimeout();
    }
    function onTouchstart(event) {
      startY.value = event.touches[0].clientY;
    }
    function onTouchend(event) {
      if (Math.abs(startY.value - event.changedTouches[0].clientY) > 50) {
        isActive.value = false;
      }
    }
    function onAfterLeave() {
      if (isHovering.value) onPointerleave();
      isFocused.value = false;
    }
    const locationClasses = computed(() => {
      return props.location.split(' ').reduce((acc, loc) => {
        acc[`v-snackbar--${loc}`] = true;
        return acc;
      }, {});
    });
    const queueDirection = computed(() => {
      const [side, align] = props.location.split(' ');
      return side === 'bottom' || ['left', 'right'].includes(side) && align === 'end' ? -1 : 1;
    });
    const collapsedStyles = computed(() => {
      if (!props.collapsed) return null;
      return {
        '--v-snackbar-collapsed-height': convertToUnit(props.collapsed.height),
        '--v-snackbar-collapsed-width': convertToUnit(props.collapsed.width)
      };
    });
    const offset = computed(() => {
      if (!queueItem) return {};
      if (queueItem.offset.value === null) {
        return _lastOffset;
      }
      return _lastOffset = convertToUnit(queueItem.offset.value);
    });
    const transition = computed(() => {
      if (typeof props.transition !== 'string' || !props.transition.endsWith('-auto')) {
        return props.transition;
      }
      const prefix = props.transition.replace('-auto', '');
      const [side, align] = props.location.split(' ');
      const axis = ['start', 'end', 'left', 'right'].includes(align) || ['left', 'right'].includes(side) ? 'x' : 'y';
      const reverse = ['end', 'right'].includes(align) || !['start', 'left'].includes(align) && ['bottom', 'right'].includes(side) ? '-reverse' : '';
      return `${prefix}-${axis}${reverse}-transition`;
    });
    useRender(() => {
      const overlayProps = omit(VOverlay.filterProps(props), ['transition']);
      const hasPrependMedia = !!(props.prependAvatar || props.prependIcon);
      const hasPrepend = !!(hasPrependMedia || props.loading || slots.prepend);
      const hasContent = !!(slots.default || slots.text || slots.title || props.text || props.title);
      return _createVNode(VOverlay, _mergeProps({
        "ref": overlay,
        "class": ['v-snackbar', {
          'v-snackbar--active': isActive.value,
          'v-snackbar--collapsed': !!props.collapsed,
          'v-snackbar--timer': !!props.timer,
          'v-snackbar--vertical': props.vertical
        }, locationClasses.value, positionClasses.value, props.class],
        "style": [mainStyles.value, {
          '--v-snackbar-offset': offset.value,
          '--v-snackbar-gap': convertToUnit(props.queueGap),
          '--v-snackbar-index': props.queueIndex,
          '--v-snackbar-direction': queueDirection.value
        }, collapsedStyles.value, props.style]
      }, overlayProps, {
        "transition": transition.value,
        "modelValue": isActive.value,
        "onUpdate:modelValue": $event => isActive.value = $event,
        "contentProps": mergeProps({
          class: ['v-snackbar__wrapper', themeClasses.value, colorClasses.value, roundedClasses.value, variantClasses.value],
          style: [colorStyles.value],
          onPointerenter,
          onPointerleave,
          onFocusin,
          onFocusout
        }, overlayProps.contentProps),
        "persistent": true,
        "noClickAnimation": true,
        "scrim": false,
        "scrollStrategy": "none",
        "_disableGlobalStack": true,
        "onTouchstartPassive": onTouchstart,
        "onTouchend": onTouchend,
        "onAfterLeave": onAfterLeave
      }, scopeId), {
        default: () => [genOverlays(false, 'v-snackbar'), slots.header && _createElementVNode("div", {
          "class": "v-snackbar__header"
        }, [slots.header?.()]), props.timer && countdown.time.value > 0 && !isHovering.value && _createElementVNode("div", {
          "key": "timer",
          "class": _normalizeClass(['v-snackbar__timer', `v-snackbar__timer--${props.timer === 'bottom' ? 'bottom' : 'top'}`])
        }, [_createVNode(VProgressLinear, {
          "ref": timerRef,
          "color": props.timerColor ?? 'info',
          "max": props.timeout,
          "modelValue": props.reverseTimer ? Number(props.timeout) - countdown.time.value : countdown.time.value
        }, null)]), hasPrepend && _createVNode(VDefaultsProvider, {
          "key": "prepend-defaults",
          "disabled": !hasPrependMedia && !props.loading,
          "defaults": {
            VAvatar: {
              image: props.prependAvatar
            },
            VIcon: {
              icon: props.prependIcon
            },
            VProgressCircular: {
              indeterminate: true,
              size: 24,
              width: 3
            }
          }
        }, {
          default: () => [_createElementVNode("div", {
            "class": "v-snackbar__prepend"
          }, [slots.prepend ? slots.prepend() : _createElementVNode(_Fragment, null, [props.loading && _createVNode(VProgressCircular, null, null), !props.loading && props.prependAvatar && _createVNode(VAvatar, null, null), !props.loading && props.prependIcon && _createVNode(VIcon, null, null)])])]
        }), hasContent && _createElementVNode("div", {
          "key": "content",
          "class": "v-snackbar__content",
          "role": "status",
          "aria-live": "polite"
        }, [slots.title?.() ?? (props.title ? _createElementVNode("div", {
          "class": "v-snackbar__title",
          "key": "title"
        }, [props.title]) : ''), slots.text?.() ?? props.text, slots.default?.()]), slots.actions && _createVNode(VDefaultsProvider, {
          "defaults": {
            VBtn: {
              variant: 'text',
              ripple: false,
              slim: true
            }
          }
        }, {
          default: () => [_createElementVNode("div", {
            "class": "v-snackbar__actions"
          }, [slots.actions({
            isActive
          })])]
        })],
        activator: slots.activator
      });
    });
    return forwardRefs({}, overlay);
  }
});
//# sourceMappingURL=VSnackbar.js.map