module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'greasemonkey': true,
  },
  'extends': 'eslint:recommended',
  'globals': {
    'module': 'readonly',
    'ClipboardItem': 'readonly',
    'BigInt': 'readonly',
  },
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'requireConfigFile': false,
    'sourceType': 'script',
  },
  'rules': {
    'comma-dangle': ['warn', 'only-multiline'],
    'indent': ['warn', 2, {
      'SwitchCase': 1,
    }],
    'no-debugger': 'warn',
    'no-unused-vars': 'warn',
    'no-useless-call': 'error',
    'prefer-const': 'warn',
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'never'],
  },
}