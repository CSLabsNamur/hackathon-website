import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema, {
  type UpdateEventSettingsSchema,
  type UpdateSettingsSchema,
  type UpdateWebsiteSettingsSchema,
} from "#shared/schemas/settings/update";

type SettingsFormState = Omit<UpdateSettingsSchema, "website" | "event"> & {
  website: WithStringFields<UpdateWebsiteSettingsSchema, "bugReportWebhookUrl">;
  event: WithStringFields<UpdateEventSettingsSchema, "iban" | "bic">;
};

const normalizeNullableField = (value: string | null | undefined) => value ?? "";

function normalizeSettingsForForm(settings: UpdateSettingsSchema): SettingsFormState {
  return {
    website: {
      ...settings.website,
      bugReportWebhookUrl: normalizeNullableField(settings.website.bugReportWebhookUrl),
    },
    event: {
      ...settings.event,
      iban: normalizeNullableField(settings.event.iban),
      bic: normalizeNullableField(settings.event.bic),
    },
    socialLinks: settings.socialLinks.map((link) => ({...link})),
  };
}

const normalizeNullableForSave = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function normalizeSettingsForSave(settings: UpdateSettingsSchema | SettingsFormState): UpdateSettingsSchema {
  return {
    website: {
      ...settings.website,
      bugReportWebhookUrl: normalizeNullableForSave(settings.website.bugReportWebhookUrl),
    },
    event: {
      ...settings.event,
      iban: normalizeNullableForSave(settings.event.iban),
      bic: normalizeNullableForSave(settings.event.bic),
      logoPath: normalizeNullableForSave(settings.event.logoPath),
    },
    socialLinks: settings.socialLinks.map((link) => ({...link})),
  };
}

export const useAdminSettingsForm = async () => {
  const toast = useToast();
  const {status, error, data: settings, refresh} = await useAdminSettings();
  const {updateSettings} = useSettingsActions();

  const normalizedSettings = computed(() => settings.value ? normalizeSettingsForForm(settings.value) : undefined);
  const state = ref<SettingsFormState>();

  const isSaving = ref(false);
  const isModified = computed(() => {
    if (!state.value || !normalizedSettings.value) return false;
    return JSON.stringify(state.value) !== JSON.stringify(normalizedSettings.value);
  });

  function sync() {
    state.value = normalizedSettings.value ? structuredClone(toRaw(normalizedSettings.value)) : undefined;
  }

  watchImmediate(normalizedSettings, sync);

  async function saveSettings(event?: FormSubmitEvent<UpdateSettingsSchema>, logoFile?: File) {
    const rawPayload = event?.data ?? state.value;
    const payload = rawPayload ? normalizeSettingsForSave(rawPayload) : undefined;
    if (!payload || isSaving.value) return;

    try {
      isSaving.value = true;
      await updateSettings(payload, logoFile);
      await refresh();
      await refreshNuxtData("settings");
      sync();

      toast.add({
        title: "Paramètres enregistrés",
        description: "Les paramètres du site ont été mis à jour.",
        color: "success",
        icon: "i-lucide-check-circle",
      });
    } finally {
      isSaving.value = false;
    }
  }

  async function onError(event: FormErrorEvent) {
    if (event?.errors?.[0]?.id) {
      const element = document.getElementById(event.errors[0].id);
      element?.focus();
      element?.scrollIntoView({behavior: "smooth", block: "center"});
    }
  }

  return {
    schema,
    status,
    error,
    state,
    isModified,
    isSaving,
    resetSettings: sync,
    saveSettings,
    onError,
  };
};
