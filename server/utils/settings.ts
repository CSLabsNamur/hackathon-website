import type {
  UpdateEventSettingsSchema,
  UpdateSettingsSchema,
  UpdateSocialLinkSchema,
  UpdateWebsiteSettingsSchema,
} from "#shared/schemas/settings/update";
import dayjs from "./dayjs";
import { serverSupabaseClient } from "#supabase/server";
import type { H3Event } from "h3";

const toDateTimeInput = (date: Date | string) => dayjs(date).format("YYYY-MM-DDTHH:mm");
const fromDateTimeInput = (value: string) => dayjs.tz(value, "Europe/Brussels").toDate();

type PublicSettings = {
  website: Pick<UpdateWebsiteSettingsSchema, "contactEmail" | "bugReportEmail">;
  event: Pick<
    UpdateEventSettingsSchema,
    "title"
    | "slogan"
    | "teaserEnabled"
    | "startDate"
    | "endDate"
    | "registrationsStartDate"
    | "registrationsEndDate"
    | "registrationMode"
    | "cautionAmount"
    | "locationName"
    | "locationAddress"
  > & {
    logoUrl: string | null;
  };
  socialLinks: Array<Pick<UpdateSocialLinkSchema, "type" | "label" | "icon" | "url">>;
};

export async function getEditableSettings(): Promise<UpdateSettingsSchema> {
  const [website, event, socialLinks] = await prisma.$transaction([
    prisma.websiteSettings.findUnique({
      where: {id: WEBSITE_SETTINGS_ID},
      select: {
        contactEmail: true,
        bugReportEmail: true,
        bugReportWebhookUrl: true,
      },
    }),
    prisma.eventSettings.findUnique({
      where: {id: EVENT_SETTINGS_ID},
      select: {
        title: true,
        slogan: true,
        logoPath: true,
        teaserEnabled: true,
        startDate: true,
        endDate: true,
        registrationsStartDate: true,
        registrationsEndDate: true,
        registrationMode: true,
        cautionAmount: true,
        iban: true,
        bic: true,
        locationName: true,
        locationAddress: true,
      },
    }),
    prisma.socialLink.findMany({
      select: {
        id: true,
        type: true,
        label: true,
        icon: true,
        url: true,
        visible: true,
        sortOrder: true,
      },
      orderBy: [
        {sortOrder: "asc"},
        {label: "asc"},
      ],
    }),
  ]);

  if (!website || !event) {
    throw createError({
      statusCode: 500,
      statusMessage: "Les paramètres n'ont pas été trouvés dans la base de données.",
    });
  }

  return {
    website,
    event: {
      ...event,
      startDate: toDateTimeInput(event.startDate),
      endDate: toDateTimeInput(event.endDate),
      registrationsStartDate: toDateTimeInput(event.registrationsStartDate),
      registrationsEndDate: toDateTimeInput(event.registrationsEndDate),
    },
    socialLinks: socialLinks.map(normalizeSocialLinkValues),
  };
}

export async function getPublicSettings(event: H3Event): Promise<PublicSettings> {
  const [website, eventSettings, socialLinks] = await prisma.$transaction([
    prisma.websiteSettings.findUnique({
      where: {id: WEBSITE_SETTINGS_ID},
      select: {
        contactEmail: true,
        bugReportEmail: true,
      },
    }),
    prisma.eventSettings.findUnique({
      where: {id: EVENT_SETTINGS_ID},
    }),
    prisma.socialLink.findMany({
      where: {visible: true},
      select: {
        type: true,
        label: true,
        icon: true,
        url: true,
      },
      orderBy: [
        {sortOrder: "asc"},
        {label: "asc"},
      ],
    }),
  ]);

  if (!website || !eventSettings) {
    throw createError({
      statusCode: 500,
      statusMessage: "Les paramètres n'ont pas été trouvés dans la base de données.",
    });
  }

  const supabase = await serverSupabaseClient(event);

  return {
    website,
    event: {
      // TODO: When the teaser is enabled, hide important event details like the title, slogan and dates
      ...eventSettings,
      startDate: toDateTimeInput(eventSettings.startDate),
      endDate: toDateTimeInput(eventSettings.endDate),
      registrationsStartDate: toDateTimeInput(eventSettings.registrationsStartDate),
      registrationsEndDate: toDateTimeInput(eventSettings.registrationsEndDate),
      logoUrl: eventSettings.logoPath ? supabase.storage.from(EVENT_ASSETS_BUCKET).getPublicUrl(eventSettings.logoPath).data.publicUrl : null,
    },
    socialLinks: socialLinks.map(normalizeSocialLinkValues),
  };
}

export async function updateSettings(settings: UpdateSettingsSchema) {
  await prisma.$transaction([
    prisma.websiteSettings.update({
      where: {id: WEBSITE_SETTINGS_ID},
      data: {
        contactEmail: settings.website.contactEmail.trim().toLowerCase(),
        bugReportEmail: settings.website.bugReportEmail.trim().toLowerCase(),
        bugReportWebhookUrl: settings.website.bugReportWebhookUrl,
      },
    }),
    prisma.eventSettings.update({
      where: {id: EVENT_SETTINGS_ID},
      data: {
        title: settings.event.title.trim(),
        slogan: settings.event.slogan.trim(),
        logoPath: settings.event.logoPath,
        teaserEnabled: settings.event.teaserEnabled,
        startDate: fromDateTimeInput(settings.event.startDate),
        endDate: fromDateTimeInput(settings.event.endDate),
        registrationsStartDate: fromDateTimeInput(settings.event.registrationsStartDate),
        registrationsEndDate: fromDateTimeInput(settings.event.registrationsEndDate),
        registrationMode: settings.event.registrationMode,
        cautionAmount: settings.event.cautionAmount,
        iban: settings.event.iban,
        bic: settings.event.bic,
        locationName: settings.event.locationName.trim(),
        locationAddress: settings.event.locationAddress.trim(),
      },
    }),
    prisma.socialLink.deleteMany({
      where: {
        type: {
          notIn: settings.socialLinks.map((link) => link.type),
        },
      },
    }),
    ...settings.socialLinks.map((rawLink) => {
      const link = normalizeSocialLinkValues(rawLink);

      return prisma.socialLink.upsert({
        where: {
          type: link.type,
        },
        create: {
          type: link.type,
          label: link.label.trim(),
          icon: link.icon.trim(),
          url: link.url.trim(),
          visible: link.visible,
          sortOrder: link.sortOrder,
        },
        update: {
          label: link.label.trim(),
          icon: link.icon.trim(),
          url: link.url.trim(),
          visible: link.visible,
          sortOrder: link.sortOrder,
        },
      });
    }),
  ]);

  return getEditableSettings();
}
