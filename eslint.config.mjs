// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
    rules: {
      "vue/first-attribute-linebreak": "off",
      "vue/require-default-prop": "off",
      "vue/no-multiple-template-root": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-literal-enum-member": "off",
      "import/no-named-default": "off",
      "no-irregular-whitespace": "off",
      "unused-eslint-disable": "off",
    },
  },
  {
    files: ["server/mail/generated/**/*.{js,ts}"],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    }
  }
);
