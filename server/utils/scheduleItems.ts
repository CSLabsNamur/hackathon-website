import type { CreateScheduleItemSchema } from "#shared/schemas/schedule/create";

export async function assertScheduleItemCanBeSaved(data: CreateScheduleItemSchema, ignoredScheduleItemId?: string) {
  if (dayjs(data.startTime).isSameOrAfter(dayjs(data.endTime))) {
    throw createError({
      statusCode: 400,
      statusMessage: "L'heure de début doit être antérieure à l'heure de fin.",
    });
  }

  if (!data.special) {
    return;
  }

  const overlappingSpecialItem = await prisma.scheduleItem.findFirst({
    where: {
      id: ignoredScheduleItemId ? {
        not: ignoredScheduleItemId,
      } : undefined,
      special: true,
      startTime: {
        lt: data.endTime,
      },
      endTime: {
        gt: data.startTime,
      },
    },
    select: {
      title: true,
    },
  });

  if (overlappingSpecialItem) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cet élément spécial chevauche déjà "${overlappingSpecialItem.title}".`,
    });
  }
}
