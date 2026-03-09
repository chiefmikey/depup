import { normalizeClass as _normalizeClass, normalizeStyle as _normalizeStyle, createElementVNode as _createElementVNode } from "vue";
// Composables
import { makeComponentProps } from "../../composables/component.js";
import { createForm, makeFormProps } from "../../composables/form.js";
import { forwardRefs } from "../../composables/forwardRefs.js"; // Utilities
import { ref } from 'vue';
import { genericComponent, propsFactory, useRender } from "../../util/index.js"; // Types
export const makeVFormProps = propsFactory({
  ...makeComponentProps(),
  ...makeFormProps()
}, 'VForm');
export const VForm = genericComponent()({
  name: 'VForm',
  props: makeVFormProps(),
  emits: {
    'update:modelValue': val => true,
    submit: e => true
  },
  setup(props, {
    slots,
    emit
  }) {
    const form = createForm(props);
    const formRef = ref();
    function onReset(e) {
      e.preventDefault();
      form.reset();
    }
    function onSubmit(_e) {
      const e = _e;
      const ready = form.validate();
      e.then = ready.then.bind(ready);
      e.catch = ready.catch.bind(ready);
      e.finally = ready.finally.bind(ready);
      emit('submit', e);
      if (!e.defaultPrevented) {
        ready.then(({
          valid
        }) => {
          if (valid) {
            formRef.value?.submit();
          }
        });
      }
      e.preventDefault();
    }
    useRender(() => _createElementVNode("form", {
      "ref": formRef,
      "class": _normalizeClass(['v-form', props.class]),
      "style": _normalizeStyle(props.style),
      "novalidate": true,
      "onReset": onReset,
      "onSubmit": onSubmit
    }, [slots.default?.({
      errors: form.errors.value,
      isDisabled: form.isDisabled.value,
      isReadonly: form.isReadonly.value,
      isValidating: form.isValidating.value,
      isValid: form.isValid.value,
      items: form.items.value,
      validate: form.validate,
      reset: form.reset,
      resetValidation: form.resetValidation
    })]));
    return forwardRefs(form, formRef);
  }
});
//# sourceMappingURL=VForm.js.map