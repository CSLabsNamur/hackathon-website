// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
    rules: {
      "vue/first-attribute-linebreak": "off",
      "vue/require-default-prop": "off",
      "vue/no-multiple-template-root": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    }
  }
)
