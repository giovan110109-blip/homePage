import { defineComponent, h } from "vue";
import { AnimatePresence as MotionAnimatePresence } from "motion-v";

export default defineComponent({
  name: "AnimatePresence",
  inheritAttrs: false,
  props: ["mode", "initial", "as", "custom", "onExitComplete", "anchorX"],
  setup(props, { slots }) {
    return () => h(MotionAnimatePresence, props, slots);
  },
});
