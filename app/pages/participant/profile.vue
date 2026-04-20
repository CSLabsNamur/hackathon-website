<script setup lang="ts">
import { ParticipantEditModal } from "#components";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Mon profil",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["participants.read.own"],
});

const {status, data: currentParticipant} = await useCurrentParticipant();
const {data: settings} = await useSettings();
const {can} = useAbility(currentParticipant);
const {setActions} = useDashboardNavbar();
const canUpdateProfile = computed(() => can("updateOwn", "Participant"));

const overlay = useOverlay();
const editModal = overlay.create(ParticipantEditModal);
const {downloadParticipantCv} = useParticipantsActions();

const githubUrl = computed(() => currentParticipant.value?.githubAccount ? getParticipantGithubUrl(currentParticipant.value.githubAccount) : null);
const linkedInUrl = computed(() => currentParticipant.value?.linkedInAccount ? getParticipantLinkedInUrl(currentParticipant.value.linkedInAccount) : null);

const {cautionAmount, iban: cautionIban, bic: cautionBic} = settings.value!.event;

const hasPendingCaution = currentParticipant.value?.caution === CautionStatus.NOT_PAID;
const cautionStatusColor = computed(() => {
  if (currentParticipant.value?.caution === CautionStatus.PAID) return "success";
  if (currentParticipant.value?.caution === CautionStatus.NOT_PAID) return "error";
  if (currentParticipant.value?.caution === CautionStatus.WAIVED) return "warning";
  return "neutral";
});
const cautionPaymentReference = hasPendingCaution ? getParticipantCautionReference({
  firstName: currentParticipant.value!.user.firstName,
  lastName: currentParticipant.value!.user.lastName,
}) : null;
const cautionQrCode = hasPendingCaution ? await generateEpcQrcode({
  firstName: currentParticipant.value!.user.firstName,
  lastName: currentParticipant.value!.user.lastName,
}, {amount: cautionAmount, iban: cautionIban, bic: cautionBic}) : null;

setActions([{
  label: "Voir mon profil public",
  icon: "i-lucide-external-link",
  to: `/participant/${currentParticipant.value!.id}`,
  target: "_blank",
}]);
</script>

<template>
  <UContainer>
    <UCard v-if="status === 'pending'" :ui="{body: 'p-0'}">
      <USkeleton class="h-128 w-full"/>
    </UCard>

    <UCard v-else-if="status === 'success'">
      <template #default>
        <div class="grid gap-2">
          <div class="grid grid-cols-2 gap-6 *:w-full">
            <ParticipantProfileLabel label="Nom complet" icon="i-lucide-user"
                                     :value="`${currentParticipant!.user.firstName} ${currentParticipant!.user.lastName}`"/>

            <ParticipantProfileLabel label="Adresse e-mail" icon="i-lucide-at-sign"
                                     :value="currentParticipant!.user.email"/>

            <ParticipantProfileLabel label="Compte GitHub" icon="i-simple-icons-github" :url="githubUrl"
                                     :value="currentParticipant!.githubAccount"/>

            <ParticipantProfileLabel label="Compte LinkedIn" icon="i-simple-icons-linkedin" :url="linkedInUrl"
                                     :value="currentParticipant!.linkedInAccount"/>

            <ParticipantProfileLabel label="École / Université" icon="i-lucide-graduation-cap"
                                     :value="currentParticipant!.school"/>

            <ParticipantProfileLabel label="Régime alimentaire spécifique" icon="i-lucide-apple"
                                     :value="currentParticipant!.diet"/>

            <ParticipantProfileLabel label="Besoins spécifiques" icon="i-lucide-heart"
                                     :value="currentParticipant!.needs"/>

            <ParticipantProfileLabel label="CV" icon="i-lucide-file-user" :value="currentParticipant!.curriculumVitae">
              <UButton size="xs" variant="ghost" icon="i-lucide-download"
                       @click="downloadParticipantCv(currentParticipant!.curriculumVitae)">
                Télécharger
              </UButton>
            </ParticipantProfileLabel>

            <ParticipantProfileLabel label="Statut de la caution" icon="i-lucide-wallet">
              <UBadge :color="cautionStatusColor" variant="subtle">
                {{ cautionStatusTranslateMap[currentParticipant!.caution] }}
              </UBadge>
            </ParticipantProfileLabel>
          </div>

          <UCard v-if="hasPendingCaution" variant="subtle">
            <template #header>
              <div>
                <p class="font-medium">Paiement de la caution</p>
                <p class="text-sm text-muted">
                  Réglez votre caution de {{ cautionAmount }}€ avec les informations ci-dessous.
                </p>
              </div>
            </template>

            <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2 *:w-full">
                <ParticipantProfileLabel label="Compte" icon="i-lucide-credit-card">
                  {{ cautionIban }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="BIC" icon="i-lucide-building-2">
                  {{ cautionBic }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="Communication" icon="i-lucide-message-square-quote">
                  {{ cautionPaymentReference }}
                </ParticipantProfileLabel>
              </div>

              <div class="grid w-56 justify-items-center gap-2 self-start md:justify-self-end">
                <img :src="cautionQrCode!" alt="Code QR pour le paiement de la caution"
                     class="size-56 rounded-lg border border-default p-2 bg-white">
                <p class="text-center text-xs text-muted">
                  Scannez ce code pour préparer le virement.
                </p>
              </div>
            </div>
          </UCard>

          <div class="grid gap-2">
            <UCheckbox label="Recevoir la newsletter par e-mail"
                       :model-value="currentParticipant!.newsletter"
                       disabled/>
            <UCheckbox label="Accepter que mon image soit utilisée dans le cadre de la promotion de l'évènement"
                       :model-value="currentParticipant!.imageAgreement"
                       disabled/>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-1.5">
          <UButton :disabled="!canUpdateProfile"
                   @click="canUpdateProfile && editModal.open({participant: currentParticipant!})">
            Modifier mon profil
          </UButton>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>

<style scoped>
* {
  --ui-container: 60rem;
}
</style>
