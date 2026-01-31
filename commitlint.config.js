/** @type { import('cz-git').UserConfig } */
export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // @see https://commitlint.js.org/#/reference-rules

        // 提交类型枚举，git提交type必须是以下类型
        'type-enum': [
            2,
            'always',
            [
                'feat', // 新增功能
                'fix', // 修复缺陷
                'hotfix', // 紧急修复
                'docs', // 文档变更
                'style', // 代码格式（不影响功能，例如空格、分号等格式修正）
                'refactor', // 代码重构（不包括 bug 修复、功能新增）
                'perf', // 性能优化
                'test', // 添加疏漏测试或已有测试改动
                'build', // 构建流程、外部依赖变更（如升级 npm 包、修改 webpack 配置等）
                'deps', // 依赖更新
                'ci', // 修改 CI 配置、脚本
                'release', // 发布版本
                'revert', // 回滚 commit
                'chore', // 对构建过程或辅助工具和库的更改（不影响源文件、测试用例）
                'wip' // 工作进行中
            ]
        ],
        'subject-case': [0] // subject大小写不做校验
    },
    prompt: {
        messages: {
            type: '选择你要提交的类型 :',
            scope: '选择一个提交范围（可选）:',
            customScope: '请输入自定义的提交范围 :',
            subject: '填写简短精炼的变更描述 :\n',
            body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
            breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
            footerPrefixesSelect: '选择关联issue前缀（可选）:',
            customFooterPrefix: '输入自定义issue前缀 :',
            footer: '列举关联issue (可选) 例如: #31, #I3244 :\n',
            generatingByAI: '正在通过 AI 生成你的提交简短描述...',
            generatedSelectByAI: '选择一个 AI 生成的简短描述:',
            confirmCommit: '是否提交或修改commit ?'
        },
        // prettier-ignore
        types: [
            { value: "feat", name: "特性:     ✨  新增功能", emoji: ":sparkles:" },
            { value: "fix", name: "修复:     🐛  修复缺陷", emoji: ":bug:" },
            { value: "hotfix", name: "紧急修复:  🔥  紧急修复生产环境缺陷", emoji: ":fire:" },
            { value: "docs", name: "文档:     📝  文档变更", emoji: ":memo:" },
            { value: "style", name: "样式:     🎨  样式表修改（CSS/SCSS/Less 等）或代码格式修正", emoji: ":art:" },
            { value: "refactor", name: "重构:     🔄  代码重构（不包括 bug 修复、功能新增）", emoji: ":recycle:" },
            { value: "perf", name: "性能:     🚀  性能优化", emoji: ":zap:" },
            { value: "test", name: "测试:     🧪  添加疏漏测试或已有测试改动", emoji: ":white_check_mark:" },
            { value: "build", name: "构建:     📦️  构建流程、外部依赖变更（如升级 npm 包、修改 vite 配置等）", emoji: ":package:" },
            { value: "deps", name: "依赖:     ⬆️  更新依赖版本", emoji: ":arrow_up:" },
            { value: "ci", name: "集成:     ⚙️  修改 CI 配置、脚本", emoji: ":ferris_wheel:" },
            { value: "release", name: "发布:     🎉  发布版本", emoji: ":tada:" },
            { value: "revert", name: "回退:     ↩️  回滚 commit", emoji: ":rewind:" },
            { value: "chore", name: "其他:     🛠️  对构建过程或辅助工具和库的更改（不影响源文件、测试用例）", emoji: ":hammer:" },
            { value: "wip", name: "进行中:   🚧  工作进行中（不建议提交）", emoji: ":construction:" },
        ],
        useEmoji: true, // 是否开启 commit message 带有 Emoji 字符。
        emojiAlign: 'center', // 设置 Emoji 字符 的 位于头部位置
        themeColorCode: '', // 设置提示查询器主题颜色, cyan青色
        scopes: [], // 自定义选择 模块范围 命令行显示信息
        // scopes: [...scopes], // 自定义选择 模块范围 命令行显示信息
        allowCustomScopes: true, // 是否在选择 模块范围 显示自定义选项(custom)
        allowEmptyScopes: true, // 是否在选择 模块范围 显示为空选项(empty)
        customScopesAlign: 'bottom', // 设置 选择范围 中 为空选项(empty) 和 自定义选项(custom) 的 位置
        customScopesAlias: 'custom', // 自定义 选择范围 中 自定义选项(custom) 在命令行中显示的 名称
        emptyScopesAlias: 'empty', // 自定义 选择范围 中 为空选项(empty) 在命令行中显示的 名称
        upperCaseSubject: false, // 是否自动将简短描述(subject)第一个字符进行大写处理
        markBreakingChangeMode: false, // 添加额外的问题重大变更(BREAKING CHANGES)提问，询问是否需要添加 "!" 标识于
        allowBreakingChanges: ['feat', 'fix'], // 允许出现 重大变更(BREAKING CHANGES)的特定 type
        breaklineNumber: 100, // 详细描述(body)和重大变更(BREAKING CHANGES)中根据字符超过该数值自动换行
        breaklineChar: '|', // 详细描述(body)和重大变更(BREAKING CHANGES)中换行字符
        skipQuestions: ['scope', 'body', 'breaking', 'footerPrefix', 'footer'], // 自定义选择指定的问题不显示
        // 自定义选择issue前缀
        issuePrefixs: [
            // 如果使用 gitee 作为开发管理
            { value: 'link', name: 'link:     链接 ISSUES 进行中' },
            { value: 'closed', name: 'closed:   标记 ISSUES 已完成' }
        ],
        customIssuePrefixsAlign: 'top', // 设置 选择 issue 前缀 中 跳过选项(skip) 和 自定义选项(custom) 的 位置
        emptyIssuePrefixsAlias: 'skip', // 自定义 选择 issue 前缀 中 跳过选项(skip) 在命令行中显示的 名称
        customIssuePrefixsAlias: 'custom', // 自定义 选择 issue 前缀 中 自定义选项(custom) 在命令行中显示的 名称
        allowCustomIssuePrefixs: true, // 是否在选择 ISSUE 前缀 显示自定义选项(custom)
        allowEmptyIssuePrefixs: true, // 是否在选择 ISSUE 前缀 显示为跳过选项(skip)
        confirmColorize: true, // 确定提交中模板 commit message 是否着色
        maxHeaderLength: Infinity, // 定义commit message中的 header 长度, 给予在命令行中的校验信息
        maxSubjectLength: Infinity, // 定义commit message中的 subject 长度, 给予在命令行中的校验信息
        minSubjectLength: 0, // 定义commit message中的 subject 长度, 给予在命令行中的校验信息
        scopeOverrides: undefined, // 自定义选择了特定类型后 覆盖模块范围 命令行显示信息
        defaultBody: '', // 在 详细描述 中是否使用显示默认值
        defaultIssues: '', // 在 输入ISSUE 中是否使用显示默认值
        defaultScope: '', // 如果 defaultScope 与在选择范围列表项中的 value 相匹配就会进行星标置顶操作。
        defaultSubject: '' // 在 简短描述 中是否使用显示默认值
    }
}
