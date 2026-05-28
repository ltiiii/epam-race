module.exports = {
  root: true,
  env: {
    browser: true,
    es2023: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.app.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended-type-checked',
    'prettier',
  ],
  rules: {
    'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    'react/react-in-jsx-scope': 'off',
    'import/prefer-default-export': 'off',
    'no-param-reassign': ['error', { props: false }],
    '@typescript-eslint/no-use-before-define': 'off',
    'react/require-default-props': 'off',
    'react/destructuring-assignment': 'off',
    'react/no-unused-prop-types': 'off',
  },
};
