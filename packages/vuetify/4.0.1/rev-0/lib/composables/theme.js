// Utilities
import { computed, getCurrentScope, inject, onScopeDispose, provide, ref, shallowRef, toRef, watch, watchEffect } from 'vue';
import { consoleWarn, createRange, darken, deprecate, getCurrentInstance, getLuma, hasLightForeground, IN_BROWSER, lighten, mergeDeep, parseColor, propsFactory, RGBtoHex, SUPPORTS_MATCH_MEDIA } from "../util/index.js"; // Types
export const ThemeSymbol = Symbol.for('vuetify:theme');
export const makeThemeProps = propsFactory({
  theme: String
}, 'theme');
function genDefaults() {
  return {
    defaultTheme: 'system',
    prefix: 'v-',
    variations: {
      colors: [],
      lighten: 0,
      darken: 0
    },
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-bright': '#FFFFFF',
          'surface-light': '#EEEEEE',
          'surface-variant': '#424242',
          'on-surface-variant': '#EEEEEE',
          primary: '#1867C0',
          'primary-darken-1': '#1F5592',
          secondary: '#48A9A6',
          'secondary-darken-1': '#018786',
          error: '#B00020',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00'
        },
        variables: {
          'border-color': '#000000',
          'border-opacity': 0.12,
          'shadow-color': '#000000',
          'high-emphasis-opacity': 0.87,
          'medium-emphasis-opacity': 0.60,
          'disabled-opacity': 0.38,
          'idle-opacity': 0.04,
          'hover-opacity': 0.04,
          'focus-opacity': 0.12,
          'selected-opacity': 0.08,
          'activated-opacity': 0.12,
          'pressed-opacity': 0.12,
          'dragged-opacity': 0.08,
          'theme-kbd': '#EEEEEE',
          'theme-on-kbd': '#000000',
          'theme-code': '#F5F5F5',
          'theme-on-code': '#000000',
          'theme-on-dark': '#FFF',
          'theme-on-light': '#000',
          'elevation-overlay-color': 'black',
          'elevation-overlay-opacity-step': '2%'
        }
      },
      dark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#212121',
          'surface-bright': '#ccbfd6',
          'surface-light': '#424242',
          'surface-variant': '#c8c8c8',
          'on-surface-variant': '#000000',
          primary: '#2196F3',
          'primary-darken-1': '#277CC1',
          secondary: '#54B6B2',
          'secondary-darken-1': '#48A9A6',
          error: '#CF6679',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00'
        },
        variables: {
          'border-color': '#FFFFFF',
          'border-opacity': 0.12,
          'shadow-color': '#000000',
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.70,
          'disabled-opacity': 0.50,
          'idle-opacity': 0.10,
          'hover-opacity': 0.04,
          'focus-opacity': 0.12,
          'selected-opacity': 0.08,
          'activated-opacity': 0.12,
          'pressed-opacity': 0.16,
          'dragged-opacity': 0.08,
          'theme-kbd': '#424242',
          'theme-on-kbd': '#FFFFFF',
          'theme-code': '#343434',
          'theme-on-code': '#CCCCCC',
          'theme-on-dark': '#FFF',
          'theme-on-light': '#000',
          'elevation-overlay-color': 'white',
          'elevation-overlay-opacity-step': '2%'
        }
      }
    },
    stylesheetId: 'vuetify-theme-stylesheet',
    scoped: false,
    utilities: true
  };
}
function parseThemeOptions(options = genDefaults()) {
  const defaults = genDefaults();
  if (!options) return {
    ...defaults,
    isDisabled: true
  };
  return mergeDeep(defaults, options);
}
function createCssClass(lines, selector, content, scope) {
  lines.push(`${getScopedSelector(selector, scope)} {\n`, ...content.map(line => `  ${line};\n`), '}\n');
}
function genCssVariables(theme, prefix) {
  const lightOverlay = theme.dark ? 2 : 1;
  const darkOverlay = theme.dark ? 1 : 2;
  const variables = [];
  for (const [key, value] of Object.entries(theme.colors)) {
    const rgb = parseColor(value);
    variables.push(`--${prefix}theme-${key}: ${rgb.r},${rgb.g},${rgb.b}` + (rgb.a == null ? '' : `,${rgb.a}`));
    if (!key.startsWith('on-')) {
      variables.push(`--${prefix}theme-${key}-overlay-multiplier: ${getLuma(value) > 0.18 ? lightOverlay : darkOverlay}`);
    }
  }
  for (const [key, value] of Object.entries(theme.variables)) {
    const color = typeof value === 'string' && value.startsWith('#') ? parseColor(value) : undefined;
    const rgb = color ? `${color.r}, ${color.g}, ${color.b}` : undefined;
    variables.push(`--${prefix}${key}: ${rgb ?? value}`);
  }
  return variables;
}
function genVariation(name, color, variations) {
  const object = {};
  if (variations) {
    for (const variation of ['lighten', 'darken']) {
      const fn = variation === 'lighten' ? lighten : darken;
      for (const amount of createRange(variations[variation], 1)) {
        object[`${name}-${variation}-${amount}`] = RGBtoHex(fn(parseColor(color), amount));
      }
    }
  }
  return object;
}
function genVariations(colors, variations) {
  if (!variations) return {};
  let variationColors = {};
  for (const name of variations.colors) {
    const color = colors[name];
    if (!color) continue;
    variationColors = {
      ...variationColors,
      ...genVariation(name, color, variations)
    };
  }
  return variationColors;
}
function genOnColors(colors, variables) {
  const onColors = {};
  for (const color of Object.keys(colors)) {
    if (color.startsWith('on-') || colors[`on-${color}`]) continue;
    const onColor = `on-${color}`;
    const colorVal = parseColor(colors[color]);
    onColors[onColor] = hasLightForeground(colorVal) ? variables['theme-on-dark'] : variables['theme-on-light'];
  }
  return onColors;
}
function getScopedSelector(selector, scope) {
  if (!scope) return selector;
  const scopeSelector = `:where(${scope})`;
  return selector === ':root' ? scopeSelector : `${scopeSelector} ${selector}`;
}
function upsertStyles(id, cspNonce, styles) {
  const styleEl = getOrCreateStyleElement(id, cspNonce);
  if (!styleEl) return;
  styleEl.innerHTML = styles;
}
function getOrCreateStyleElement(id, cspNonce) {
  if (!IN_BROWSER) return null;
  let style = document.getElementById(id);
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';
    if (cspNonce) style.setAttribute('nonce', cspNonce);
    document.head.appendChild(style);
  }
  return style;
}

// Composables
export function createTheme(options) {
  const parsedOptions = parseThemeOptions(options);
  const _name = shallowRef(parsedOptions.defaultTheme);
  const themes = ref(parsedOptions.themes);
  const systemName = shallowRef('light');
  const name = computed({
    get() {
      return _name.value === 'system' ? systemName.value : _name.value;
    },
    set(val) {
      _name.value = val;
    }
  });
  const computedThemes = computed(() => {
    const acc = {};
    for (const [name, original] of Object.entries(themes.value)) {
      const defaultTheme = original.dark || name === 'dark' ? themes.value.dark : themes.value.light;
      const merged = mergeDeep(defaultTheme, original);
      const colors = {
        ...merged.colors,
        ...genVariations(merged.colors, parsedOptions.variations)
      };
      acc[name] = {
        ...merged,
        colors: {
          ...colors,
          ...genOnColors(colors, merged.variables)
        }
      };
    }
    return acc;
  });
  const current = toRef(() => computedThemes.value[name.value]);
  const isSystem = toRef(() => _name.value === 'system');
  const styles = computed(() => {
    const lines = [];
    const scoped = parsedOptions.scoped ? parsedOptions.prefix : '';
    lines.push('@layer theme-base {\n');
    if (current.value?.dark) {
      createCssClass(lines, ':root', ['color-scheme: dark'], parsedOptions.scope);
    }
    createCssClass(lines, ':root', genCssVariables(current.value, parsedOptions.prefix), parsedOptions.scope);
    for (const [themeName, theme] of Object.entries(computedThemes.value)) {
      createCssClass(lines, `.${parsedOptions.prefix}theme--${themeName}`, [`color-scheme: ${theme.dark ? 'dark' : 'normal'}`, ...genCssVariables(theme, parsedOptions.prefix)], parsedOptions.scope);
    }
    lines.push('}\n');
    if (parsedOptions.utilities) {
      const bgLines = [];
      const fgLines = [];
      const colors = new Set(Object.values(computedThemes.value).flatMap(theme => Object.keys(theme.colors)));
      for (const key of colors) {
        if (key.startsWith('on-')) {
          createCssClass(fgLines, `.${key}`, [`color: rgb(var(--${parsedOptions.prefix}theme-${key}))`], parsedOptions.scope);
        } else {
          createCssClass(bgLines, `.${scoped}bg-${key}`, [`--${parsedOptions.prefix}theme-overlay-multiplier: var(--${parsedOptions.prefix}theme-${key}-overlay-multiplier)`, `background-color: rgb(var(--${parsedOptions.prefix}theme-${key}))`, `color: rgb(var(--${parsedOptions.prefix}theme-on-${key}))`], parsedOptions.scope);
          createCssClass(fgLines, `.${scoped}text-${key}`, [`color: rgb(var(--${parsedOptions.prefix}theme-${key}))`], parsedOptions.scope);
          createCssClass(fgLines, `.${scoped}border-${key}`, [`--${parsedOptions.prefix}border-color: var(--${parsedOptions.prefix}theme-${key})`], parsedOptions.scope);
        }
      }
      lines.push('@layer theme-background {\n', ...bgLines.map(v => `  ${v}`), '}\n', '@layer theme-foreground {\n', ...fgLines.map(v => `  ${v}`), '}\n');
    }
    return '@layer vuetify-utilities {\n' + lines.map(v => `  ${v}`).join('') + '\n}';
  });
  const themeClasses = toRef(() => parsedOptions.isDisabled ? undefined : `${parsedOptions.prefix}theme--${name.value}`);
  const themeNames = toRef(() => Object.keys(computedThemes.value));
  if (SUPPORTS_MATCH_MEDIA) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function updateSystemName() {
      systemName.value = media.matches ? 'dark' : 'light';
    }
    updateSystemName();
    media.addEventListener('change', updateSystemName, {
      passive: true
    });
    if (getCurrentScope()) {
      onScopeDispose(() => {
        media.removeEventListener('change', updateSystemName);
      });
    }
  }
  function install(app) {
    if (parsedOptions.isDisabled) return;
    const head = app._context.provides.usehead;
    if (head) {
      function getHead() {
        return {
          style: [{
            textContent: styles.value,
            id: parsedOptions.stylesheetId,
            nonce: parsedOptions.cspNonce || false,
            tagPosition: 'bodyOpen'
          }]
        };
      }
      if (head.push) {
        const entry = head.push(getHead);
        if (IN_BROWSER) {
          watch(styles, () => {
            entry.patch(getHead);
          });
        }
      } else {
        if (IN_BROWSER) {
          head.addHeadObjs(toRef(getHead));
          watchEffect(() => head.updateDOM());
        } else {
          head.addHeadObjs(getHead());
        }
      }
    } else {
      if (IN_BROWSER) {
        watch(styles, updateStyles, {
          immediate: true
        });
      } else {
        updateStyles();
      }
      function updateStyles() {
        upsertStyles(parsedOptions.stylesheetId, parsedOptions.cspNonce, styles.value);
      }
    }
  }
  function change(themeName) {
    if (themeName !== 'system' && !themeNames.value.includes(themeName)) {
      consoleWarn(`Theme "${themeName}" not found on the Vuetify theme instance`);
      return;
    }
    name.value = themeName;
  }
  function cycle(themeArray = themeNames.value) {
    const currentIndex = themeArray.indexOf(name.value);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themeArray.length;
    change(themeArray[nextIndex]);
  }
  function toggle(themeArray = ['light', 'dark']) {
    cycle(themeArray);
  }
  const globalName = new Proxy(name, {
    get(target, prop) {
      return Reflect.get(target, prop);
    },
    set(target, prop, val) {
      if (prop === 'value') {
        deprecate(`theme.global.name.value = ${val}`, `theme.change('${val}')`);
      }
      return Reflect.set(target, prop, val);
    }
  });
  return {
    install,
    change,
    cycle,
    toggle,
    isDisabled: parsedOptions.isDisabled,
    isSystem,
    name,
    themes,
    current,
    computedThemes,
    prefix: parsedOptions.prefix,
    themeClasses,
    styles,
    global: {
      name: globalName,
      current
    }
  };
}
export function provideTheme(props) {
  getCurrentInstance('provideTheme');
  const theme = inject(ThemeSymbol, null);
  if (!theme) throw new Error('Could not find Vuetify theme injection');
  const name = toRef(() => props.theme ?? theme.name.value);
  const current = toRef(() => theme.themes.value[name.value]);
  const themeClasses = toRef(() => theme.isDisabled ? undefined : `${theme.prefix}theme--${name.value}`);
  const newTheme = {
    ...theme,
    name,
    current,
    themeClasses
  };
  provide(ThemeSymbol, newTheme);
  return newTheme;
}
export function useTheme() {
  getCurrentInstance('useTheme');
  const theme = inject(ThemeSymbol, null);
  if (!theme) throw new Error('Could not find Vuetify theme injection');
  return theme;
}
//# sourceMappingURL=theme.js.map