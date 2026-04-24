# Client Theme Guidelines

## Goal

统一 `client` 的明暗主题表现，避免页面各自定义一套背景、面板、边框和文字规则。

## Theme Tokens

所有主题变量统一定义在 [src/style.scss](/Users/giovan/Desktop/homePage/client/src/style.scss)：

- `--theme-bg`: 页面基础背景
- `--theme-surface`: 默认玻璃面板背景
- `--theme-surface-strong`: 强强调面板背景
- `--theme-surface-soft`: 轻量面板背景
- `--theme-text-primary`: 主文字
- `--theme-text-secondary`: 次级文字
- `--theme-text-muted`: 辅助文字
- `--theme-border`: 默认边框
- `--theme-border-strong`: 强调边框
- `--theme-accent`: 品牌主色
- `--theme-accent-soft`: 主色弱化背景

## Semantic Classes

新增页面或组件时，优先使用语义类，而不是重新手写一套颜色：

- `theme-page`: 页面背景层
- `theme-panel`: 默认玻璃面板
- `theme-panel-strong`: 重点卡片/弹层
- `theme-panel-soft`: 次级容器
- `theme-card-interactive`: 可 hover 的卡片
- `theme-icon-button`: 图标按钮
- `theme-chip`: 标签/状态胶囊
- `theme-text-primary`
- `theme-text-secondary`
- `theme-text-muted`
- `theme-divider`

## Usage Rules

1. 页面外层统一使用 `theme-page`，不要再单独定义一套 `bg-black` 或随机渐变。
2. 业务卡片优先使用 `theme-panel` 或 `theme-panel-strong`，不要混用多组 `bg-white/80 dark:bg-white/5`。
3. 交互按钮统一从 `AppButton.vue` 扩展，不直接在页面里写新的主按钮视觉。
4. 头部、页脚、弹层、浮层默认沿用同一套 `surface + border + shadow` 规则。
5. 强调色默认使用蓝色系，除状态语义外，不再引入新的主视觉色作为全局基调。

## When Adding A New Page

推荐骨架：

```vue
<template>
  <div class="theme-page min-h-screen py-16">
    <section class="theme-panel-strong rounded-3xl p-8">
      <h1 class="theme-text-primary text-3xl font-bold">标题</h1>
      <p class="theme-text-secondary mt-2">描述</p>
    </section>
  </div>
</template>
```

## Refactor Direction

目前仍有一些历史页面直接使用 Tailwind 颜色类。现阶段通过全局 token 做了兼容映射；后续如果继续整理，优先把页面逐步切换到语义类，而不是继续增加新的全局覆盖。
