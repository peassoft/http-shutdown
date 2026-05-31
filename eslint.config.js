import mnrConfig from '@memnrev/eslint-v9-config';

export default [
  {
    ignores: [
      'dist',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...mnrConfig.configs.node,
];
