<script setup lang="ts">
const props = defineProps<{ token: string }>();

const {copyWithToast} = useCopyWithToast();

const copyToken = () => {
  copyWithToast(props.token, {title: "Code d'invitation copié"});
};
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Inviter des membres</h2>
    </template>

    <div class="grid gap-4">
      <p class="text-sm text-muted">
        Partagez ce code pour permettre à d'autres participants de rejoindre votre équipe.
      </p>
      <code class="rounded-md bg-elevated p-3 font-mono text-sm text-highlighted break-all">
        {{ token }}
      </code>
      <UButton color="neutral" variant="soft" icon="i-lucide-copy" class="place-self-start"
               @click="copyToken">
        Copier le code
      </UButton>
    </div>
  </UCard>
</template>
