<script setup lang="ts">
defineProps<{ participant: CurrentParticipant }>();
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Participation à l'événement</h2>
    </template>

    <div class="grid gap-6">
      <div class="grid gap-6 sm:grid-cols-2">
        <ParticipantProfileLabel label="Régime alimentaire spécifique" icon="i-lucide-apple"
                                 :value="participant.diet"/>
        <ParticipantProfileLabel label="Besoins spécifiques" icon="i-lucide-heart"
                                 :value="participant.needs"/>
      </div>

      <USeparator/>

      <dl class="grid gap-4">
        <div class="flex items-start justify-between gap-4">
          <dt class="text-sm">Newsletter par e-mail</dt>
          <dd>
            <UBadge color="neutral" variant="subtle">
              {{ participant.newsletter ? "Inscrit" : "Non inscrit" }}
            </UBadge>
          </dd>
        </div>
        <div class="flex items-start justify-between gap-4">
          <dt class="grid gap-1 text-sm">
            Utilisation de mon image
            <span class="text-xs text-muted">Pour la promotion de l'événement</span>
          </dt>
          <dd>
            <UBadge color="neutral" variant="subtle">
              {{ participant.imageAgreement ? "Autorisée" : "Non autorisée" }}
            </UBadge>
          </dd>
        </div>
      </dl>
    </div>
  </UCard>
</template>
