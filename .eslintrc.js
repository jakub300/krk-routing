module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/recommended', '@vue/airbnb', 'plugin:prettier/recommended', 'prettier/vue'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'import/extensions': [
      'error',
      'always',
      { js: 'never', mjs: 'never', jsx: 'never', ts: 'never', tsx: 'never', vue: 'never' },
    ],
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
  settings: {
    'import/extensions': ['.vue'],
  },
};
