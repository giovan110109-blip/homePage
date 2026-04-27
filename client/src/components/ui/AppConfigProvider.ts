import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { defineComponent, h } from "vue";

export default defineComponent({
  name: "AppConfigProvider",
  inheritAttrs: false,
  setup(_, { slots }) {
    return () =>
      h(
        ElConfigProvider,
        {
          locale: zhCn,
        },
        slots,
      );
  },
});
