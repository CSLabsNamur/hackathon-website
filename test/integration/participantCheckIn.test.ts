import { afterAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "../../server/utils/prisma";
import { setParticipantCheckIn } from "../../server/utils/participants";
import { resetEventDatabase, seedParticipantData } from "../fixtures/database";

describe.skipIf(!process.env.TEST_DATABASE_URL)("participant check-in", () => {
  beforeEach(async () => {
    await resetEventDatabase();
    await seedParticipantData();
  });
  afterAll(() => prisma.$disconnect());

  it("preserves the first arrival time when both desks check in the same participant", async () => {
    const [first, second] = await Promise.all([
      setParticipantCheckIn("participant", true),
      setParticipantCheckIn("participant", true),
    ]);
    expect(first.checkedInAt).not.toBeNull();
    expect(first).toEqual(second);

    const originalArrival = new Date("2026-03-27T08:30:00Z");
    await prisma.participant.update({where: {id: "participant"}, data: {checkedInAt: originalArrival}});
    expect((await setParticipantCheckIn("participant", true)).checkedInAt).toEqual(originalArrival);
  });

  it("allows an accidental check-in to be undone and recorded again", async () => {
    await setParticipantCheckIn("participant", true);
    expect((await setParticipantCheckIn("participant", false)).checkedInAt).toBeNull();
    expect((await setParticipantCheckIn("participant", false)).checkedInAt).toBeNull();
    expect((await setParticipantCheckIn("participant", true)).checkedInAt).toBeInstanceOf(Date);
  });
});
