<script setup lang="ts">
definePageMeta({
  requiredPermissions: ["settings.read"],
});

const {data: currentAdmin} = await useCurrentAdmin();
const {can} = useAbility(currentAdmin);
const {
  schema,
  status,
  error,
  state,
  isModified,
  isSaving,
  resetSettings,
  saveSettings,
  onError,
} = await useAdminSettingsForm();
const {data: settings} = await useSettings();

const canUpdateSettings = computed(() => can("update", "Settings"));

const logoFile = ref<File>();
const eventLogoAccept = acceptedFormatsToHtmlAccept(ACCEPTED_EVENT_LOGO_EXTS);
const eventLogoFormatsLabel = acceptedFormatsToLabel(ACCEPTED_EVENT_LOGO_EXTS)?.toUpperCase() ?? "PNG, JPG, JPEG, WEBP";
const eventLogoDescription = `${eventLogoFormatsLabel}, max 5MB`;
const currentLogoUrl = computed(() => settings.value?.event.logoUrl);

const canSave = computed(() => isModified.value || !!logoFile.value);

async function onSubmit(event: Parameters<typeof saveSettings>[0]) {
  await saveSettings(event, logoFile.value);
  logoFile.value = undefined;
}

function resetForm() {
  resetSettings();
  logoFile.value = undefined;
}
</script>

<template>
  <UForm v-if="state" id="settings-event-form" :schema :state :disabled="isSaving || !canUpdateSettings"
         class="grid gap-6" @submit="onSubmit" @error="onError">
    <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex justify-end gap-2'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Événement</h2>
          <p class="text-sm text-muted">
            Configurez les informations visibles sur la page d'accueil et la page d'informations.
          </p>
        </div>
        <UBadge v-if="!canUpdateSettings" color="neutral" variant="soft">Lecture seule</UBadge>
      </template>

      <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
        <UFormField label="Titre" name="event.title" required>
          <UInput v-model="state.event.title" icon="i-lucide-type" class="w-full"/>
        </UFormField>

        <UFormField label="Slogan" name="event.slogan">
          <UInput v-model="state.event.slogan" icon="i-lucide-sparkles" class="w-full"/>
        </UFormField>

        <UFormField label="Logo de l'événement" class="flex flex-col gap-4 md:col-span-2"
                    :description="eventLogoDescription">
          <UFileUpload v-model="logoFile" :accept="eventLogoAccept" hint="Déposez un nouveau logo ici"
                       label="Déposez un nouveau logo ici" :description="eventLogoDescription" icon="i-lucide-image-up"
                       size="sm" position="inside" layout="list"/>

          <div v-if="currentLogoUrl" class="flex items-center gap-4">
            <img :src="currentLogoUrl" alt="Logo actuel de l'événement"
                 class="max-h-24 max-w-40 rounded object-contain bg-default p-2">
            <div class="grid gap-1">
              <UButton :to="currentLogoUrl" target="_blank" external variant="link" icon="i-lucide-image"
                       class="justify-start px-0">
                Voir le logo actuel
              </UButton>
              <p v-if="state.event.logoPath" class="text-xs text-muted break-all">
                {{ state.event.logoPath }}
              </p>
            </div>
          </div>
        </UFormField>

        <UFormField label="Début de l'événement" name="event.startDate" required>
          <UInput v-model="state.event.startDate" type="datetime-local" icon="i-lucide-calendar-plus" class="w-full"/>
        </UFormField>

        <UFormField label="Fin de l'événement" name="event.endDate" required>
          <UInput v-model="state.event.endDate" type="datetime-local" icon="i-lucide-calendar-minus" class="w-full"/>
        </UFormField>

        <UFormField label="Lieu" name="event.locationName" required>
          <UInput v-model="state.event.locationName" icon="i-lucide-map-pinned" class="w-full"/>
        </UFormField>

        <UFormField label="Adresse" name="event.locationAddress" required>
          <UInput v-model="state.event.locationAddress" icon="i-lucide-map" class="w-full"/>
        </UFormField>

        <UFormField name="event.teaserEnabled" class="md:col-span-2">
          <UCheckbox v-model="state.event.teaserEnabled" label="Activer le mode teaser"
                     description="Cache les pages d'inscription, partenaires et informations de l'évènement sur le site public."/>
        </UFormField>
      </div>

      <template #footer>
        <UButton color="neutral" variant="soft" :disabled="isSaving || !canSave" @click="resetForm">
          Annuler
        </UButton>
        <UButton type="submit" icon="i-lucide-save" :loading="isSaving" :disabled="!canUpdateSettings || !canSave">
          Enregistrer
        </UButton>
      </template>
    </UCard>
  </UForm>
  <UCard v-else-if="status === 'pending'" :ui="{body: 'grid gap-4'}">
    <USkeleton class="h-6 w-48"/>
    <USkeleton v-for="n in 7" :key="n" class="h-10 w-full"/>
  </UCard>
  <UAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle" title="Impossible de charger les paramètres"
          :description="error?.statusMessage || error?.message || 'Vérifiez que la base de données a bien été initialisée.'"/>
</template>
