import { GuestType } from "~~/server/prisma/generated/prisma/browser";

export interface GuestInfo {
  displayName: string;
  color: string;
  icon: string;
}

export const guestInfoByType: Record<GuestType, GuestInfo> = {
  [GuestType.SPEAKER]: {
    displayName: "Conférencier",
    color: "blue",
    icon: "i-lucide-mic-vocal",
  },
  [GuestType.JURY]: {
    displayName: "Jury",
    color: "green",
    icon: "i-lucide-scale",
  },
  [GuestType.COACH]: {
    displayName: "Coach",
    color: "orange",
    icon: "i-lucide-speech",
  },
  [GuestType.PHOTOGRAPHER]: {
    displayName: "Photographe",
    color: "purple",
    icon: "i-lucide-camera",
  },
  [GuestType.GUEST]: {
    displayName: "Invité",
    color: "gray",
    icon: "i-lucide-user-round",
  },
  [GuestType.OTHER]: {
    displayName: "Autre",
    color: "teal",
    icon: "i-lucide-ellipsis",
  },
};

export const guestTypeItems = Object.entries(guestInfoByType).map(([type, info]) => ({
  value: type,
  label: info.displayName,
  icon: info.icon,
}));

/**
 * Gets a display name for a guest, using the provided name or falling back to a default based on the guest type.
 *
 * @param name The guest's name, which may be null or undefined. If it's empty or only whitespace, it will be ignored
 * @param type The guest's type, used to determine a default name if the provided name is not valid
 * @returns A display name for the guest
 */
export const resolveGuestName = (name: string | null | undefined, type: GuestType) => {
  const normalizedName = name?.trim();
  return normalizedName || guestInfoByType[type].displayName;
};

/**
 * Determines the quantity of badges to assign to a guest based on the provided name and quantity.
 * Mainly just to ensure validation server-side, so that if a name is provided, it always assigns only 1 badge.
 *
 * @param name The guest's name, which may be null or undefined. If it's empty or only whitespace, it will be ignored
 * @param quantity The quantity of badges specified for the guest, which may be null or undefined. If the name is valid, this will be ignored and 1 will be returned. Otherwise, if this is null or undefined, it will default to 1
 * @return The quantity of badges to assign to the guest
 */
export const resolveGuestQuantity = (name: string | null | undefined, quantity: number | null | undefined) => {
  if (name?.trim()) {
    return 1;
  }

  return quantity ?? 1;
};
