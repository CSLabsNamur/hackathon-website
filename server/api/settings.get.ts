export default defineEventHandler(async (event) => {
  return getPublicSettings(event);
});
