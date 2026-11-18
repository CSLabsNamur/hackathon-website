<script setup lang="ts">
const {data: settings} = await useSettings();
const {copyWithToast} = useCopyWithToast();

const discordLink = computed(() => settings.value?.socialLinks.find((link) => link.type === "DISCORD"));
const address = computed(() => [settings.value?.event.locationName, settings.value?.event.locationAddress]
    .filter(Boolean).join(", "),
);
const hasContact = computed(() => discordLink.value || settings.value?.website.contactEmail);

const copyAddress = () => {
  if (!address.value) return;
  copyWithToast(address.value, {title: "Adresse copiée"});
};
</script>

<template>
  <UCard v-if="address || hasContact">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Infos pratiques</h2>
    </template>

    <div class="grid gap-5">
      <div v-if="address" class="grid gap-3">
        <div class="flex gap-3">
          <UIcon name="i-lucide-map-pin" class="mt-0.5 size-5 shrink-0 text-muted"/>
          <div class="min-w-0 text-sm">
            <p class="font-medium text-highlighted">{{ settings?.event.locationName }}</p>
            <p class="text-muted">{{ settings?.event.locationAddress }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-copy" @click="copyAddress">
            Copier l'adresse
          </UButton>
          <UButton to="/infos" color="neutral" variant="ghost" size="sm">
            Accès et détails
          </UButton>
        </div>
      </div>

      <div v-if="hasContact" class="grid gap-3">
        <h3 class="text-sm font-medium text-highlighted">Contacter l'organisation</h3>
        <div class="flex flex-wrap gap-2">
          <UButton v-if="discordLink" :to="discordLink.url" :icon="discordLink.icon" target="_blank"
                   color="neutral" variant="soft" size="sm">
            {{ discordLink.label }}
          </UButton>
          <UButton v-if="settings?.website.contactEmail" :to="`mailto:${settings.website.contactEmail}`"
                   color="neutral" variant="soft" size="sm" icon="i-lucide-mail">
            E-mail
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
