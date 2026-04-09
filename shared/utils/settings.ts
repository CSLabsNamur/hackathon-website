import { type Prisma, RegistrationMode, SocialLinkType } from "../../server/prisma/generated/prisma/browser";

export const WEBSITE_SETTINGS_ID = "website-settings";
export const EVENT_SETTINGS_ID = "event-settings";

export const settingsRegistrationModeLabels: Record<RegistrationMode, string> = {
  [RegistrationMode.SCHEDULED]: "Selon les dates",
  [RegistrationMode.OPEN]: "Forcer l'ouverture",
  [RegistrationMode.CLOSED]: "Forcer la fermeture",
};

export const settingsSocialLinkTypeLabels: Record<SocialLinkType, string> = {
  [SocialLinkType.DISCORD]: "Discord",
  [SocialLinkType.FACEBOOK]: "Facebook",
  [SocialLinkType.GITHUB]: "GitHub",
  [SocialLinkType.INSTAGRAM]: "Instagram",
  [SocialLinkType.LINKEDIN]: "LinkedIn",
  [SocialLinkType.X]: "X / Twitter",
  [SocialLinkType.YOUTUBE]: "YouTube",
  [SocialLinkType.WEBSITE]: "Site web",
  [SocialLinkType.OTHER]: "Autre",
};

export const settingsSocialLinkTypeIcons: Omit<Record<SocialLinkType, string>, "OTHER"> = {
  [SocialLinkType.DISCORD]: "i-simple-icons-discord",
  [SocialLinkType.FACEBOOK]: "i-simple-icons-facebook",
  [SocialLinkType.GITHUB]: "i-simple-icons-github",
  [SocialLinkType.INSTAGRAM]: "i-simple-icons-instagram",
  [SocialLinkType.LINKEDIN]: "i-simple-icons-linkedin",
  [SocialLinkType.X]: "i-simple-icons-x",
  [SocialLinkType.YOUTUBE]: "i-simple-icons-youtube",
  [SocialLinkType.WEBSITE]: "i-lucide-globe",
} as const;

export function isCustomSocialLinkType(type: SocialLinkType) {
  return type === SocialLinkType.OTHER;
}

export function getDefaultSocialLinkValues(type: SocialLinkType) {
  if (isCustomSocialLinkType(type)) return null;

  return {
    label: settingsSocialLinkTypeLabels[type],
    icon: settingsSocialLinkTypeIcons[type]!,
  };
}

export function normalizeSocialLinkValues<T extends { type: SocialLinkType, label: string, icon: string }>(link: T): T {
  const defaults = getDefaultSocialLinkValues(link.type);
  if (!defaults) {
    return {
      ...link,
      label: link.label.trim(),
      icon: link.icon.trim(),
    };
  }

  return {
    ...link,
    label: defaults.label,
    icon: defaults.icon,
  };
}

export const defaultWebsiteSettings: Prisma.WebsiteSettingsCreateInput = {
  contactEmail: "event@cslabs.be",
  bugReportEmail: "it@cslabs.be",
  bugReportWebhookUrl: null,
} as const;

export const defaultEventSettings: Prisma.EventSettingsCreateInput = {
  title: "Le Hackathon se prépare !",
  slogan: "",
  logoPath: null,
  teaserEnabled: true,
  startDate: "2026-03-27T00:00",
  endDate: "2026-03-29T23:59",
  registrationsStartDate: "2025-11-01T00:00",
  registrationsEndDate: "2026-02-27T23:59",
  registrationMode: RegistrationMode.SCHEDULED,
  cautionAmount: 20,
  iban: "BEXX XXXX XXXX XXXX",
  bic: null,
  locationName: "Faculté d'informatique de l'Université de Namur",
  locationAddress: "Rue Grandgagnage 21, 5000 Namur, Belgique",
} as const;

export const defaultSocialLinks: Prisma.SocialLinkCreateManyInput[] = [
  {
    type: SocialLinkType.DISCORD,
    label: "Discord",
    icon: "i-simple-icons-discord",
    url: "https://discord.gg/Jf2Dht8",
    visible: true,
    sortOrder: 1,
  },
  {
    type: SocialLinkType.GITHUB,
    label: "GitHub",
    icon: "i-simple-icons-github",
    url: "https://github.com/CSLabsNamur",
    visible: true,
    sortOrder: 2,
  },
  {
    type: SocialLinkType.LINKEDIN,
    label: "LinkedIn",
    icon: "i-simple-icons-linkedin",
    url: "https://www.linkedin.com/company/cslabs-namur",
    visible: true,
    sortOrder: 3,
  },
  {
    type: SocialLinkType.INSTAGRAM,
    label: "Instagram",
    icon: "i-simple-icons-instagram",
    url: "https://www.instagram.com/cslabs_namur/",
    visible: true,
    sortOrder: 4,
  },
] as const;

export function isRegistrationOpen(mode: RegistrationMode, registrationsStartDate: string | Date, registrationsEndDate: string | Date) {
  const now = new Date();

  if (mode === RegistrationMode.OPEN) return true;
  if (mode === RegistrationMode.CLOSED) return false;

  return now > new Date(registrationsStartDate) && now < new Date(registrationsEndDate);
}
