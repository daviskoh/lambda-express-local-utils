module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },

  extends: 'eslint:recommended',

  parser: 'babel-eslint',

  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 8,
    'ecmaFeatures': {
      'modules': true
    },
  },

  plugins: [
    'import',
    'flowtype',
  ],

  rules: {
    indent: [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    quotes: [
      'error',
      'single'
    ],
    semi: [
      'error',
      'always'
    ],
    'arrow-body-style': [
      'error',
      'as-needed'
    ],
    'no-console': 0,
    'flowtype/define-flow-type': 1,
    'flowtype/space-after-type-colon': [
      2,
      'always'
    ],
  }
};
