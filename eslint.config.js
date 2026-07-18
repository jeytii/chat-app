import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import queryPlugin from '@tanstack/eslint-plugin-query'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import typescript from 'typescript-eslint'

const controlStatements = [
    'if',
    'return',
    'for',
    'while',
    'do',
    'switch',
    'try',
    'throw',
]
const paddingAroundControl = [
    ...controlStatements.flatMap(stmt => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
]

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    reactHooks.configs.flat['recommended-latest'],
    ...queryPlugin.configs['flat/recommended'],
    ...typescript.configs.recommended,
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'], // Required for React 17+
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        plugins: {
            'import-sort': importSort,
        },
        rules: {
            'import-sort/imports': 'error',
            'import-sort/exports': 'error',
        },
    },
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/indent': 'error',
            '@stylistic/semi': ['error', 'never'],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
            '@stylistic/padding-line-between-statements': [
                'error',
                ...paddingAroundControl,
            ],
            '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
            '@stylistic/jsx-quotes': ['error', 'prefer-single'],
            '@stylistic/jsx-indent-props': ['error', 4],
            '@stylistic/jsx-closing-tag-location': ['error', 'tag-aligned'],
            '@stylistic/jsx-tag-spacing': 'error',
            '@stylistic/jsx-max-props-per-line': ['error', {
                maximum: {
                    single: 2,
                    multi: 1,
                },
            }],
            '@stylistic/jsx-self-closing-comp': ['error', {
                component: true,
                html: true,
            }],
        },
    },
    {
        ignores: [
            'vendor',
            'node_modules',
            'public',
            'bootstrap/ssr',
            'resources/js/components/ui/*',
        ],
    },
]
