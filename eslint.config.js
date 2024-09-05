import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import tailwind from 'eslint-plugin-tailwindcss'

export default tseslint.config(
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  ...tailwind.configs['flat/recommended'],
  {
    rules: {
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'jsx-quotes': ['error', 'prefer-single'],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-indent': ['error', 2],
      'react/jsx-max-props-per-line': ['error', { when: 'always' }],
      'react/jsx-first-prop-new-line': ['error', 'multiline'],
      'react/jsx-closing-bracket-location': ['error', 'line-aligned'],
      'react/jsx-closing-tag-location': ['error', 'line-aligned'],
      'react/jsx-sort-props': ['error', {
        'noSortAlphabetically': true,
        'callbacksLast': true,
        'shorthandLast': true,
        'reservedFirst': ['key', 'ref'],
      }],
      'react/jsx-no-bind': ['error', {
        'allowFunctions': true,
        'allowArrowFunctions': false,
        'allowBind': true,
      }],
      'tailwindcss/classnames-order': ['error', {
        'callees': ['classnames', 'clsx', 'cn', 'ctl', 'cva', 'tv'],
      }],
    },
  },
)
