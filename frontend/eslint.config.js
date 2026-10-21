import hooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ignores:['dist/**']},js.configs.recommended,...ts.configs.recommended,{files:['src/**/*.{ts,tsx}'],plugins:{'react-hooks':hooks},rules:{'react-hooks/exhaustive-deps':'warn','@typescript-eslint/no-explicit-any':'warn','@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}});
