import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { createSubmissionRequestSchema } from "../../shared/schemas/submissions/requests/create";
import { editSubmissionRequestSchema } from "../../shared/schemas/submissions/requests/edit";
import { getSubmissionRequestProgress } from "../../server/utils/submissionRequestProgress";

describe("admin submission requests", () => {
  it("counts the latest response per team and distinguishes skips from deliveries", () => {
    const records = [
      {participantId: "p1", teamId: "t1", skipped: true, hasAnswer: false},
      {participantId: "p2", teamId: "t1", skipped: false, hasAnswer: true},
      {participantId: "p3", teamId: "t2", skipped: false, hasAnswer: true},
      {participantId: "p4", teamId: "t3", skipped: false, hasAnswer: false},
      {participantId: "p5", teamId: null, skipped: false, hasAnswer: true},
    ];
    expect(getSubmissionRequestProgress(true, records)).toEqual({submitted: 1, skipped: 1});
    expect(getSubmissionRequestProgress(false, records)).toEqual({submitted: 3, skipped: 1});
  });

  it("validates the creation of a new submission request", () => {
    const schema = createSubmissionRequestSchema(new Date("2026-06-01T07:00:30Z"), new Date("2026-06-01T16:00:30Z"));
    const response = v.parse(schema, {type: "text", title: " Prototype ", description: "", deadline: "2026-06-01T18:00"});
    expect(response.title).toBe("Prototype");
    expect(response.description).toBe("");
    expect(response.deadline).toBe("2026-06-01T18:00");
    expect(v.safeParse(schema, {...response, deadline: "2026-06-01T09:00"}).success).toBe(true);
    expect(v.safeParse(schema, {...response, deadline: "2026-06-01T08:59"}).success).toBe(false);
    expect(v.safeParse(schema, {...response, deadline: "2026-06-01T18:01"}).success).toBe(false);
    expect(v.safeParse(schema, {...response, deadline: ""}).success).toBe(false);
  });

  it("rejects a nonexistent local time during the daylight saving transition", () => {
    const schema = createSubmissionRequestSchema("2026-03-28T11:00:00Z", "2026-03-29T16:00:00Z");
    expect(v.safeParse(schema, {type: "text", title: "Prototype", deadline: "2026-03-29T02:30"}).success).toBe(false);
  });

  it("keeps the response type immutable and validates the edit timestamp", () => {
    const schema = editSubmissionRequestSchema("2026-06-01T07:00:00Z", "2026-06-01T16:00:00Z");
    const edit = {title: "Prototype", deadline: "2026-06-01T18:00", expectedUpdatedAt: "2026-05-01T12:00:00Z"};
    expect(v.parse(schema, edit)).toEqual(edit);
    expect(v.safeParse(schema, {...edit, type: "file"}).success).toBe(false);
    expect(v.safeParse(schema, {...edit, expectedUpdatedAt: "2026-05-01"}).success).toBe(false);
  });
});
