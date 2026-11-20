import * as v from "valibot";
import dayjs from "../../../../lib/dayjs";

export function submissionRequestFormSchema(eventDateStart: Date | string, eventDateEnd: Date | string) {
  const eventStart = dayjs.utc(eventDateStart).startOf("minute").valueOf();
  const eventEnd = dayjs.utc(eventDateEnd).startOf("minute").valueOf();

  return v.strictObject({
    title: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty("Le titre ne peut pas être vide."),
      v.maxLength(50, "Le titre est trop long (50 caractères maximum)."),
    ),
    description: v.optional(v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(150, "La description est trop longue (150 caractères maximum)."),
    )),
    deadline: v.pipe(
      v.string(),
      v.isoDateTime("Saisissez une date et une heure."),
      v.check((value) => {
        const deadline = dayjs.tz(value, "Europe/Brussels");
        const timestamp = deadline.valueOf();
        return deadline.format("YYYY-MM-DDTHH:mm") === value
          && timestamp >= eventStart && timestamp <= eventEnd;
      }, "Choisissez une date et une heure valides entre le début et la fin de l’événement."),
    ),
    acceptedFormats: v.optional(v.array(v.string())),
    required: v.optional(v.boolean()),
    teamRequest: v.optional(v.boolean()),
    type: v.picklist(["text", "file", "files"]),
  });
}

export function createSubmissionRequestSchema(eventDateStart: Date | string, eventDateEnd: Date | string) {
  const formSchema = submissionRequestFormSchema(eventDateStart, eventDateEnd);
  return v.strictObject({
    ...formSchema.entries,
    expectedEditionId: v.optional(v.string()),
  });
}

export type CreateSubmissionRequestSchema = v.InferOutput<ReturnType<typeof createSubmissionRequestSchema>>;
