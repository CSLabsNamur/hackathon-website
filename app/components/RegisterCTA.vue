<script setup lang="ts">
import type { ButtonProps } from "#ui/components/Button.vue";

const links: ButtonProps[] = [
  {
    label: "S'inscrire",
    to: "/inscription",
    icon: "i-lucide-pen-line",
  },
  {
    label: "Discord",
    to: "https://discord.gg/Jf2Dht8",
    icon: "i-simple-icons-discord",
    target: "_blank",
    color: "secondary",
  },
];
</script>

<template>
  <UPageCTA title="Prêt(e) à relever le défi ?" description="Rejoins-nous pour un week‑end inoubliable !"
            :links class="rounded-none sm:rounded-xl"
            :ui="{container: 'bg-gradient-to-br from-primary-500/10 to-primary-300/10 dark:from-primary-400/10 dark:to-primary-200/5'}"/>
</template>
