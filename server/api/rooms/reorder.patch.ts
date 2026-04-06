import schema from "#shared/schemas/rooms/reorder";
import * as v from "valibot";

type RoomAssignmentPayload = {
  id: string;
  teams: readonly string[];
  sequence: number;
}[];

type ExistingGraph = { roomIds: readonly string[], teamIds: readonly string[] };

function getDuplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }

  return duplicates;
}

function getValuesOutsideSet(values: readonly string[], allowedValues: ReadonlySet<string>) {
  return values.filter((value) => !allowedValues.has(value));
}

function assertRoomAssignmentGraphIsValid(payload: RoomAssignmentPayload, existingGraph: ExistingGraph) {
  const submittedRoomIds = payload.map((room) => room.id);

  if (getDuplicateValues(submittedRoomIds).size > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Une salle ne peut pas apparaître plusieurs fois dans la répartition.",
    });
  }

  const existingRoomIds = new Set(existingGraph.roomIds);
  const unknownRoomIds = getValuesOutsideSet(submittedRoomIds, existingRoomIds);
  const missingRoomIds = getValuesOutsideSet(existingGraph.roomIds, new Set(submittedRoomIds));

  if (unknownRoomIds.length > 0 || missingRoomIds.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "La répartition doit contenir exactement toutes les salles existantes.",
    });
  }

  const submittedTeamIds = payload.flatMap((room) => room.teams);

  if (getDuplicateValues(submittedTeamIds).size > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Une équipe ne peut pas être assignée à plusieurs salles.",
    });
  }

  const unknownTeamIds = getValuesOutsideSet(submittedTeamIds, new Set(existingGraph.teamIds));

  if (unknownTeamIds.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "La répartition contient une ou plusieurs équipes inconnues.",
    });
  }
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, "rooms.assign.team");

  const data = await readValidatedBody(event, v.parser(schema));

  const payload: RoomAssignmentPayload = data.map((item, index) => ({
    id: item.id,
    teams: item.teams,
    sequence: index + 1,
  }));

  return prisma.$transaction(async (tx) => {
    const [existingRooms, existingTeams] = await Promise.all([
      tx.room.findMany({
        select: {
          id: true,
        },
      }),
      tx.team.findMany({
        select: {
          id: true,
        },
      }),
    ]);

    // Validate the submitted graph against existing rooms and teams before making any updates
    assertRoomAssignmentGraphIsValid(payload, {
      roomIds: existingRooms.map((room) => room.id),
      teamIds: existingTeams.map((team) => team.id),
    });

    // First, bump all sequences by 1000 to avoid unique constraint conflicts
    await Promise.all(
      payload.map((item) => tx.room.update({
        where: {id: item.id},
        data: {
          sequence: item.sequence + 1000,
        },
      })),
    );

    // Then, set the correct sequences and teams
    await Promise.all(
      payload.map((item) => tx.room.update({
        where: {id: item.id},
        data: {
          teams: {
            set: item.teams.map((teamId) => ({id: teamId})),
          },
          sequence: item.sequence,
        },
      })),
    );
  });
});
