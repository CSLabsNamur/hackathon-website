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

const canUpdateSettings = computed(() => can("update", "Settings"));

const registrationModeItems = Object.values(RegistrationMode).map((mode) => ({
  label: settingsRegistrationModeLabels[mode],
  value: mode,
}));

</script>

<template>
  <UForm v-if="state" id="settings-registrations-form" :schema :state :disabled="isSaving || !canUpdateSettings"
         class="grid gap-6" @submit="saveSettings" @error="onError">
    <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex justify-end gap-2'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Inscriptions et paiement</h2>
          <p class="text-sm text-muted">
            Gérez la période d'inscription, les exceptions d'ouverture et les informations de caution.
          </p>
        </div>
        <UBadge v-if="!canUpdateSettings" color="neutral" variant="soft">Lecture seule</UBadge>
      </template>

      <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
        <UFormField label="Mode d'inscription" name="event.registrationMode" required class="md:col-span-2">
          <URadioGroup v-model="state.event.registrationMode" :items="registrationModeItems" orientation="horizontal"
                       variant="table"
                       :color="state.event.registrationMode === RegistrationMode.SCHEDULED ? 'primary' : 'warning'"/>
        </UFormField>

        <UFormField label="Ouverture des inscriptions" name="event.registrationsStartDate" required>
          <UInput v-model="state.event.registrationsStartDate" type="datetime-local" icon="i-lucide-calendar-plus"
                  class="w-full"/>
        </UFormField>

        <UFormField label="Fermeture des inscriptions" name="event.registrationsEndDate" required>
          <UInput v-model="state.event.registrationsEndDate" type="datetime-local" icon="i-lucide-calendar-minus"
                  class="w-full"/>
        </UFormField>

        <div class="md:col-span-2 grid gap-4 grid-cols-1 md:grid-cols-3">
          <UFormField label="Montant de la caution" name="event.cautionAmount" required>
            <UInputNumber v-model="state.event.cautionAmount" :min="0" :max="500" class="w-full" disable-wheel-change
                          :format-options="{style: 'currency', currency: 'EUR', minimumFractionDigits: 0}"/>
          </UFormField>

          <UFormField label="IBAN" name="event.iban">
            <UInput v-model="state.event.iban" icon="i-lucide-credit-card" class="w-full"/>
          </UFormField>

          <UFormField label="BIC" name="event.bic">
            <UInput v-model="state.event.bic" icon="i-lucide-banknote" class="w-full"/>
          </UFormField>
        </div>
      </div>

      <template #footer>
        <UButton color="neutral" variant="soft" :disabled="isSaving || !isModified" @click="resetSettings">
          Annuler
        </UButton>
        <UButton type="submit" icon="i-lucide-save" :loading="isSaving" :disabled="!canUpdateSettings || !isModified">
          Enregistrer
        </UButton>
      </template>
    </UCard>
  </UForm>
  <UCard v-else-if="status === 'pending'" :ui="{body: 'grid gap-4'}">
    <USkeleton class="h-6 w-48"/>
    <USkeleton v-for="n in 6" :key="n" class="h-10 w-full"/>
  </UCard>
  <UAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle"
          title="Impossible de charger les paramètres"
          :description="error?.statusMessage || error?.message || 'Vérifiez que la base de données a bien été initialisée.'"/>
</template>
