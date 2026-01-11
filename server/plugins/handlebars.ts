import Handlebars from "handlebars";

export default defineNitroPlugin(() => {
  Handlebars.registerHelper("uppercase", (str: string) => {
    return str.toUpperCase();
  });

  console.log("[nitro] Handlebars helpers registered.");
});
