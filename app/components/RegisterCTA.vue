<script setup lang="ts">
import type { ButtonProps } from "#ui/components/Button.vue";

const {data: settings} = await useSettings();

const discordLink = computed(() => settings.value?.socialLinks.find((link) => link.type === "DISCORD"));
const links = computed<ButtonProps[]>(() => {
  const items: ButtonProps[] = [{
    label: "S'inscrire",
    to: "/inscription",
    icon: "i-lucide-pen-line",
  }];

  if (discordLink.value) {
    items.push({
      label: discordLink.value.label,
      to: discordLink.value.url,
      icon: discordLink.value.icon,
      target: "_blank",
      color: "secondary",
    });
  }

  return items;
});
</script>

<template>
  <UPageCTA title="Prêt(e) à relever le défi ?" description="Rejoins-nous pour un week‑end inoubliable !"
            :links class="rounded-none sm:rounded-xl"
            :ui="{container: 'bg-gradient-to-br from-primary-500/10 to-primary-300/10 dark:from-primary-400/10 dark:to-primary-200/5'}"/>
</template>
