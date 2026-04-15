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

const usedTypes = computed(() => new Set(state.value?.socialLinks.map((link) => link.type) ?? []));

const canAddSocialLink = computed(() => Object.values(SocialLinkType).some((type) => !usedTypes.value.has(type)));

function getSocialTypeItems(index: number) {
  const currentType = state.value?.socialLinks[index]?.type;

  return Object.values(SocialLinkType).map((type) => ({
    label: settingsSocialLinkTypeLabels[type],
    icon: getDefaultSocialLinkValues(type)?.icon ?? "i-lucide-link",
    value: type,
    disabled: usedTypes.value.has(type) && type !== currentType,
  }));
}

function addSocialLink() {
  if (!state.value || !canAddSocialLink.value) return;

  const type = Object.values(SocialLinkType).find((candidate) => !usedTypes.value.has(candidate));
  if (!type) return;

  const defaults = getDefaultSocialLinkValues(type);
  const sortOrder = Math.max(0, ...state.value.socialLinks.map((link) => link.sortOrder)) + 10;
  state.value.socialLinks.push({
    type,
    label: defaults?.label ?? "",
    icon: defaults?.icon ?? "i-lucide-link",
    url: "https://example.com",
    visible: false,
    sortOrder,
  });

  // Focus the label input of the newly added link for better UX.
  nextTick(() => {
    const fieldName = type === SocialLinkType.OTHER ? "label" : "url";
    const input = document.querySelector<HTMLInputElement>(`#settings-socials-form [name="socialLinks.${state.value!.socialLinks.length - 1}.${fieldName}"]`);
    input?.focus();
  });
}

function removeSocialLink(index: number) {
  if (!state.value) return;
  state.value.socialLinks.splice(index, 1);
}

function onSocialTypeChange(index: number, type: string) {
  if (!(Object.values(SocialLinkType) as readonly string[]).includes(type)) return;

  const link = state.value?.socialLinks[index];
  if (!link) return;

  link.type = type as keyof typeof SocialLinkType;
  const defaults = getDefaultSocialLinkValues(link.type);
  link.label = defaults?.label ?? "";
  link.icon = defaults?.icon ?? "i-lucide-link";
}

function reorderSocialLinks(from: number, to: number) {
  if (!state.value || from === to) return;

  const links = [...state.value.socialLinks];
  const [movedLink] = links.splice(from, 1);
  if (!movedLink) return;

  links.splice(to, 0, movedLink);

  // Reassign a new array so form state observers reliably detect reorder changes.
  state.value.socialLinks = links.map((link, index) => ({
    ...link,
    sortOrder: index + 1,
  }));
}

function moveLinkUp(index: number) {
  if (!state.value || index === 0) return;
  reorderSocialLinks(index, index - 1);
}

function moveLinkDown(index: number) {
  if (!state.value || index === state.value.socialLinks.length - 1) return;
  reorderSocialLinks(index, index + 1);
}
</script>

<template>
  <UForm v-if="state" id="settings-socials-form" :schema :state :disabled="isSaving || !canUpdateSettings"
         class="grid gap-6" @submit="saveSettings" @error="onError">
    <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex justify-end gap-2'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Réseaux sociaux</h2>
          <p class="text-sm text-muted">
            Ces liens sont utilisés dans le footer, les CTA et certaines pages du site.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge v-if="!canUpdateSettings" color="neutral" variant="soft">Lecture seule</UBadge>
          <UButton type="button" icon="i-lucide-plus" variant="soft" size="sm"
                   :disabled="!canUpdateSettings || !canAddSocialLink || isSaving" @click="addSocialLink">
            Ajouter
          </UButton>
        </div>
      </template>

      <div v-auto-animate class="grid gap-4">
        <UCard v-for="(link, index) in state.socialLinks" :key="link.id || link.type" variant="subtle"
               :ui="{header: 'flex items-center justify-between gap-3'}">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon :name="link.icon" class="size-5 text-primary"/>
              <span class="font-medium text-highlighted">{{ link.label }}</span>
              <UBadge v-if="!link.visible" color="neutral" variant="soft">Masqué</UBadge>
            </div>

            <div class="flex gap-2 items-center">
              <div class="flex">
                <UButton icon="i-lucide-arrow-up" color="neutral" variant="ghost" size="sm"
                         :disabled="index === 0 || isSaving" :aria-label="`Déplacer le lien ${link.label} vers le haut`"
                         @click="moveLinkUp(index)"/>
                <UButton icon="i-lucide-arrow-down" color="neutral" variant="ghost" size="sm"
                         :disabled="index === state.socialLinks.length - 1 || isSaving"
                         :aria-label="`Déplacer le lien ${link.label} vers le bas`" @click="moveLinkDown(index)"/>
              </div>

              <USeparator orientation="vertical" class="h-6"/>

              <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                       :disabled="!canUpdateSettings || isSaving" :aria-label="`Supprimer le lien ${link.label}`"
                       @click="removeSocialLink(index)"/>
            </div>
          </template>

          <div v-auto-animate class="grid gap-4 grid-cols-1 md:grid-cols-2">
            <UFormField label="Type" :name="`socialLinks.${index}.type`" required>
              <USelectMenu :model-value="link.type" :items="getSocialTypeItems(index)" value-key="value"
                           :leading-icon="getDefaultSocialLinkValues(link.type)?.icon || link.icon || 'i-lucide-link'"
                           class="w-full"
                           @update:model-value="onSocialTypeChange(index, $event)"/>
            </UFormField>

            <UFormField v-if="isCustomSocialLinkType(link.type)" label="Libellé" :name="`socialLinks.${index}.label`" required>
              <UInput v-model="link.label" icon="i-lucide-type" class="w-full"/>
            </UFormField>

            <UFormField v-if="isCustomSocialLinkType(link.type)" label="Icône" :name="`socialLinks.${index}.icon`"
                        required class="md:col-span-2">
              <LazyIconPicker v-model="link.icon"/>
            </UFormField>

            <UFormField label="URL" :name="`socialLinks.${index}.url`" required
                        :class="isCustomSocialLinkType(link.type) ? 'md:col-span-2' : undefined">
              <UInput v-model="link.url" icon="i-lucide-link" class="w-full"/>
            </UFormField>

            <UFormField :name="`socialLinks.${index}.visible`" class="md:col-span-2">
              <UCheckbox v-model="link.visible" label="Afficher ce lien publiquement"/>
            </UFormField>
          </div>
        </UCard>

        <UEmpty v-if="state.socialLinks.length === 0" title="Aucun lien social"
                description="Ajoutez un lien pour l'afficher sur le site public." icon="i-lucide-share-2"/>
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
    <USkeleton v-for="n in 4" :key="n" class="h-24 w-full"/>
  </UCard>
  <UAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle"
          title="Impossible de charger les paramètres"
          :description="error?.statusMessage || error?.message || 'Vérifiez que la base de données a bien été initialisée.'"/>
</template>
