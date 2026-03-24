import type { RadioGroupItem } from "#ui/types";
import { translateGuestType } from "#shared/utils/types";
import { GuestType } from "#server/prisma/generated/prisma/enums";

export const guestTypeItems: RadioGroupItem[] = [{
  label: translateGuestType(GuestType.SPEAKER),
  value: GuestType.SPEAKER,
  icon: "i-lucide-mic-vocal",
}, {
  label: translateGuestType(GuestType.JURY),
  value: GuestType.JURY,
  icon: "i-lucide-scale",
}, {
  label: translateGuestType(GuestType.COACH),
  value: GuestType.COACH,
  icon: "i-lucide-speech",
}, {
  label: translateGuestType(GuestType.PHOTOGRAPHER),
  value: GuestType.PHOTOGRAPHER,
  icon: "i-lucide-camera",
}, {
  label: translateGuestType(GuestType.GUEST),
  value: GuestType.GUEST,
  icon: "i-lucide-user-round",
}, {
  label: translateGuestType(GuestType.OTHER),
  value: GuestType.OTHER,
  icon: "i-lucide-ellipsis",
}];
