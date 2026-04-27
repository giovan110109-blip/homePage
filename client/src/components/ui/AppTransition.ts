import { Transition, defineComponent, h, type PropType, type TransitionProps } from "vue";

export default defineComponent({
  name: "AppTransition",
  inheritAttrs: false,
  props: {
    appear: Boolean,
    css: {
      type: Boolean,
      default: true,
    },
    duration: [Number, Object] as PropType<TransitionProps["duration"]>,
    enterActiveClass: String,
    enterFromClass: String,
    enterToClass: String,
    leaveActiveClass: String,
    leaveFromClass: String,
    leaveToClass: String,
    mode: String as () => TransitionProps["mode"],
    name: String,
    persisted: Boolean,
    type: String as () => TransitionProps["type"],
    onAfterEnter: Function,
    onAfterLeave: Function,
    onBeforeEnter: Function,
    onBeforeLeave: Function,
    onEnter: Function,
    onLeave: Function,
  },
  setup(props, { slots }) {
    return () => h(Transition, props as TransitionProps, slots);
  },
});
