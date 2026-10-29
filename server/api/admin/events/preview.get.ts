export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, "settings.read");
  return prisma.$transaction((db) => getEventRolloverPreview(db), {isolationLevel: "RepeatableRead"});
});
