import Handlebars from "handlebars";

export default defineNitroPlugin(() => {
  Handlebars.registerHelper("uppercase", (str: string) => {
    return str.toUpperCase();
  });

  if (import.meta.dev) {
    console.debug("[nitro] Handlebars helpers registered.");
  }
});
