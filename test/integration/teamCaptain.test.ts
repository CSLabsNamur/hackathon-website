import { afterAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "../../server/utils/prisma";
import { disbandOwnTeam, removeOwnTeamMember, updateOwnTeam } from "../../server/utils/teams";
import { resetEventDatabase, seedParticipantData } from "../fixtures/database";

describe.skipIf(!process.env.TEST_DATABASE_URL)("team captain", () => {
  beforeEach(resetEventDatabase);
  afterAll(() => prisma.$disconnect());

  it("lets the captain edit and remove a member while rejecting the same actions from a member", async () => {
    await seedParticipantData({withSeparateCaptain: true});
    const captain = await prisma.participant.findUniqueOrThrow({where: {id: "captain"}});
    const changes = {name: "Updated team", description: "Updated description"};

    await expect(updateOwnTeam("participant-user", changes)).rejects.toMatchObject({statusCode: 403});
    await expect(removeOwnTeamMember("participant-user", "team", "captain")).rejects.toMatchObject({statusCode: 403});
    await expect(disbandOwnTeam("participant-user", "team")).rejects.toMatchObject({statusCode: 403});
    await expect(updateOwnTeam(captain.userId, changes)).resolves.toMatchObject(changes);
    await expect(removeOwnTeamMember(captain.userId, "team", "captain")).rejects.toMatchObject({statusCode: 409});
    await expect(disbandOwnTeam(captain.userId, "team")).rejects.toMatchObject({statusCode: 409});
    await expect(removeOwnTeamMember(captain.userId, "team", "participant")).resolves.toBeUndefined();
    await expect(removeOwnTeamMember(captain.userId, "team", "participant")).rejects.toMatchObject({statusCode: 404});
    await expect(prisma.participant.findUnique({where: {id: "participant"}})).resolves.toMatchObject({teamId: null});
    await expect(prisma.submission.findUnique({where: {id: "submission"}})).resolves.toMatchObject({participantId: "participant"});
    await expect(disbandOwnTeam(captain.userId, "team")).resolves.toBeUndefined();
    await expect(prisma.team.count()).resolves.toBe(0);
    await expect(prisma.participant.findUnique({where: {id: "captain"}})).resolves.toMatchObject({teamId: null});
  });

  it("allows the captain to disband a team with zero members", async () => {
    await seedParticipantData();
    await prisma.participant.update({where: {id: "participant"}, data: {teamId: null}});

    await expect(disbandOwnTeam("participant-user", "team")).resolves.toBeUndefined();
    await expect(prisma.team.count()).resolves.toBe(0);
  });
});
