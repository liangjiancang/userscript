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
    'GM_download': true,
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    'indent': ['warn', 2, {
      'SwitchCase': 1
    }],
    'semi': ['warn', 'never'],
    'quotes': ['warn', 'single'],
    'comma-dangle': ['warn', 'only-multiline'],
    'no-unused-vars': ['warn', { 'args': 'none' }],
    'no-debugger': 'warn',
  },
}