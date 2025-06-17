module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:svelte/recommended',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        extraFileExtensions: ['.svelte']
    },
    env: {
        browser: true,
        es2017: true,
        node: true
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser'
            },
            rules: {
                // Svelte-specific rules
                'svelte/no-at-html-tags': 'warn',
                'svelte/no-target-blank': 'error',
                'svelte/no-reactive-functions': 'error',
                'svelte/no-reactive-literals': 'error'
            }
        },
        {
            files: ['*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off'
            }
        }
    ],
    rules: {
        // General JavaScript/TypeScript rules
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': 'off', // Handled by TypeScript
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                ignoreRestSiblings: true
            }
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',

        // Code quality rules
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'prefer-arrow-callback': 'error',
        'prefer-template': 'error',
        'template-curly-spacing': 'error',
        'arrow-spacing': 'error',
        'comma-dangle': ['error', 'only-multiline'],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'semi': ['error', 'always'],

        // Import rules
        'no-duplicate-imports': 'error',

        // Accessibility rules
        'no-alert': 'warn'
    },
    globals: {
        // Global variables
        __APP_VERSION__: 'readonly',
        __BUILD_TIME__: 'readonly'
    }
};