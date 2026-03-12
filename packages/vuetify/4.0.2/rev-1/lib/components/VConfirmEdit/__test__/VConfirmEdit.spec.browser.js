import { createElementVNode as _createElementVNode, createVNode as _createVNode, Fragment as _Fragment, createTextVNode as _createTextVNode } from "vue";
// Components
import { VConfirmEdit } from "../index.js"; // Utilities
import { render, screen, userEvent } from '@test';
import { nextTick, shallowRef } from 'vue';
describe('VConfirmEdit', () => {
  it('mirrors external updates', async () => {
    const externalModel = shallowRef('foo');
    render(() => _createVNode(VConfirmEdit, {
      "modelValue": externalModel.value
    }, {
      default: ({
        model
      }) => _createElementVNode("p", null, [model.value])
    }));
    expect(screen.getByText('foo')).toBeVisible();
    externalModel.value = 'bar';
    await nextTick();
    expect(screen.getByText('bar')).toBeVisible();
  });
  it("doesn't mutate the original value", async () => {
    const externalModel = shallowRef(['foo']);
    render(() => _createVNode(VConfirmEdit, {
      "modelValue": externalModel.value,
      "onUpdate:modelValue": $event => externalModel.value = $event
    }, {
      default: ({
        model
      }) => _createElementVNode(_Fragment, null, [_createElementVNode("p", null, [model.value.join(',')]), _createElementVNode("button", {
        "data-testid": "push",
        "onClick": () => model.value.push('bar')
      }, [_createTextVNode("Push")])])
    }));
    expect(screen.getByText('foo')).toBeVisible();
    await userEvent.click(screen.getByTestId('push'));
    expect(screen.getByText('foo,bar')).toBeVisible();
    expect(externalModel.value).toEqual(['foo']);
    await userEvent.click(screen.getByText('OK'));
    expect(externalModel.value).toEqual(['foo', 'bar']);
  });
  describe('hides actions if used from the slot', () => {
    it('nothing', () => {
      render(() => _createVNode(VConfirmEdit, null, null));
      expect(screen.getAllByCSS('button')).toHaveLength(2);
    });
    it('consume model', () => {
      render(() => _createVNode(VConfirmEdit, null, {
        default: ({
          model
        }) => {
          void model;
        }
      }));
      expect(screen.getAllByCSS('button')).toHaveLength(2);
    });
    it('consume actions', () => {
      render(() => _createVNode(VConfirmEdit, null, {
        default: ({
          actions
        }) => {
          void actions;
        }
      }));
      expect(screen.queryAllByCSS('button')).toHaveLength(0);
    });
    it('render actions', () => {
      render(() => _createVNode(VConfirmEdit, null, {
        default: ({
          actions
        }) => actions()
      }));
      expect(screen.getAllByCSS('button')).toHaveLength(2);
    });
  });
});
//# sourceMappingURL=VConfirmEdit.spec.browser.js.map