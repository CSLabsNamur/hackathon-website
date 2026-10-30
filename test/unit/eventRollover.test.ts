import { describe, expect, it } from "vitest";
import * as v from "valibot";
import schema from "../../shared/schemas/settings/rollover";
import { nextEdition } from "../fixtures/event";

describe("rollover request validation", () => {
  it("requires reviewed content and registrations that finish before the event begins", () => {
    expect(v.safeParse(schema, nextEdition).success).toBe(true);
    expect(v.safeParse(schema, {...nextEdition, slogan: ""}).success).toBe(true);
    expect(v.safeParse(schema, {...nextEdition, slogan: "a".repeat(161)}).success).toBe(false);
    expect(v.safeParse(schema, {...nextEdition, reviewedArchive: false}).success).toBe(false);
    expect(v.safeParse(schema, {...nextEdition, registrationsEndDate: nextEdition.endDate}).success).toBe(false);
    expect(v.safeParse(schema, {...nextEdition, endDate: nextEdition.startDate}).success).toBe(false);
  });
});
