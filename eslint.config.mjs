import js from "@eslint/js";
import globals from "globals";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
    // 1. 全局忽略配置 (必须作为独立的第一个对象)
    // 这完全替代了以前的 .eslintignore 文件
    {
        ignores: [
            "dist/**",
            "build/**",
            "node_modules/**",
            "public/**"
        ],
    },

    // 2. ESLint 官方推荐的基础 JS 规则
    // 替代了原来的 extends: ["eslint:recommended"]
    js.configs.recommended,

    // 3. 全局环境变量与解析器选项
    // 替代了原来的 env 和 parserOptions
    {
        languageOptions: {
            // 定义全局变量 (如 window, document, process, __dirname)
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },

    // 4. 自定义你的业务规则
    {
        rules: {
            "no-console": "warn",
            "no-unused-vars": "warn",
        },
    },

    // 5. Prettier 集成 (必须放在数组的最后一位！)
    // 这一个导入等价于原来的 extends: ["plugin:prettier/recommended"]
    // 它会自动关闭所有与 Prettier 冲突的 ESLint 格式化规则，并把 Prettier 作为 ESLint 规则运行
    eslintPluginPrettierRecommended,
];