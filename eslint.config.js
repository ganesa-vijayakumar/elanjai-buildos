import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['**/dist/**', '**/node_modules/**', 'backend/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,cjs,mjs}'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
);
