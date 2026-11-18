<script setup lang="ts">
const props = defineProps<{ participant: CurrentParticipant }>();

const {data: settings, status, refresh} = await useSettings({lazy: true});
const {copyWithToast} = useCopyWithToast();

const hasPendingCaution = computed(() => props.participant.caution === CautionStatus.NOT_PAID);
const paymentReference = computed(() => getParticipantCautionReference(props.participant.user));
const cautionColor = computed(() => {
  if (props.participant.caution === CautionStatus.NOT_PAID) return "warning";
  if (props.participant.caution === CautionStatus.WAIVED) return "neutral";
  return "success";
});
const cautionDescription = computed(() => {
  if (props.participant.caution === CautionStatus.PAID) return "Votre caution a bien été enregistrée.";
  if (props.participant.caution === CautionStatus.REFUNDED) return "Votre caution a été remboursée.";
  if (props.participant.caution === CautionStatus.WAIVED) return "Vous êtes exonéré de caution.";
  return null;
});

const paymentFields = computed(() => settings.value && hasPendingCaution.value ? [
  {label: "Compte (IBAN)", value: settings.value.event.iban},
  {label: "BIC", value: settings.value.event.bic},
  {label: "Communication", value: paymentReference.value},
] : []);

const isGeneratingQrCode = shallowRef(false);
const qrCode = computedAsync(() => {
  const event = settings.value?.event;
  if (!hasPendingCaution.value || !event || status.value === "error") return null;

  const {cautionAmount, iban, bic} = event;
  return generateEpcQrcode(props.participant.user, {amount: cautionAmount, iban, bic}).catch(() => null);
}, null, isGeneratingQrCode);

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Caution</h2>
        <UBadge :color="cautionColor" variant="subtle">
          {{ cautionStatusTranslateMap[participant.caution] }}
        </UBadge>
      </div>
    </template>

    <p v-if="!hasPendingCaution" class="text-sm text-muted">{{ cautionDescription }}</p>

    <UAlert v-else-if="status === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Informations de paiement indisponibles"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>

    <div v-else-if="!settings" class="grid gap-4">
      <USkeleton class="h-20"/>
      <USkeleton class="size-48 mx-auto"/>
    </div>

    <div v-else class="grid gap-5">
      <p class="text-sm text-muted">
        Réglez votre caution de
        <span class="font-semibold text-highlighted">{{ settings.event.cautionAmount }}€</span>
        par virement avec la communication ci-dessous.
      </p>

      <div class="grid gap-4">
        <ParticipantProfileLabel v-for="field in paymentFields" :key="field.label" :label="field.label">
          <div class="flex items-start justify-between gap-2">
            <span class="min-w-0 font-mono wrap-anywhere">{{ field.value }}</span>
            <UButton color="neutral" variant="ghost" icon="i-lucide-copy" size="xs"
                     :aria-label="`Copier ${field.label}`"
                     @click="copyWithToast(field.value, {title: 'Information copiée'})"/>
          </div>
        </ParticipantProfileLabel>
      </div>

      <div class="grid justify-items-center gap-2">
        <USkeleton v-if="isGeneratingQrCode" class="size-48"/>
        <template v-else-if="qrCode">
          <img :src="qrCode" alt="Code QR pour préparer le virement de la caution"
               class="size-48 rounded-md border border-default bg-white p-2">
          <p class="text-center text-xs text-muted">Scannez ce code avec votre application bancaire.</p>
        </template>
        <p v-else class="text-sm text-muted">
          Le QR code est indisponible. Utilisez les coordonnées de paiement ci-dessus.
        </p>
      </div>
    </div>
  </UCard>
</template>
