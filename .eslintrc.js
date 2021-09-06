module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'greasemonkey': true,
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
    'module': true,
    'ClipboardItem': true,
    'BigInt': true,
  },
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'requireConfigFile': false,
    'sourceType': 'script',
  },
  'rules': {
    'indent': ['warn', 2, {
      'SwitchCase': 1,
    }],
    'semi': ['warn', 'never'],
    'quotes': ['warn', 'single'],
    'comma-dangle': ['warn', 'only-multiline'],
    'no-unused-vars': 'warn',
    'no-useless-call': 'error',
    'no-debugger': 'warn',
  },
}