module.exports = {
  'env': {
    'browser': true,
    'es6': true,
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
    'module': true,
    'unsafeWindow': true,
    'GM_info': true,
    'GM_addStyle': true,
    'GM_getValue': true,
    'GM_setValue': true,
    'GM_registerMenuCommand': true,
    'GM_xmlhttpRequest': true,
    'GM_listValues': true,
    'GM_deleteValue': true,
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    'indent': ['error', 2, {
      'SwitchCase': 1
    }],
    'semi': ['error', 'never'],
    'quotes': ['error', 'single'],
    'comma-dangle': ['error', 'only-multiline'],
    'no-debugger': 'warn',
  },
}