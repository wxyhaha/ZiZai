import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'zizai/ignores',
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/assets/fonts/**',
      'scripts/**',
      'docs/design-reference/**',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  {
    name: 'zizai/rules',
    rules: {
      // 单页面组件文件名即组件名，不强制 Vue 3.3+ 的多词约束
      'vue/multi-word-component-names': 'off',
      // 允许在模板里使用 v-html 之外的一切；v-html 本身由 lint 保留检查
      'vue/no-v-html': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // 格式化偏好：模板允许在同一行放多个属性、允许短文本单行。
      // 这些只影响观感，不应淹没真正的错误。
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': [
        'error',
        { html: { void: 'always', normal: 'always', component: 'always' } },
      ],
    },
  },
]
