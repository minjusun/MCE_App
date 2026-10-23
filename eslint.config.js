// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // App code only; tooling scripts, the HTML wireframe and docs are checked elsewhere.
    ignores: ['dist/*', '.expo/*', 'wireframe/*', 'docs/*', 'supabase/*', 'scripts/*', 'tests/*', '.claude/*', '.githooks/*'],
  },
]);
