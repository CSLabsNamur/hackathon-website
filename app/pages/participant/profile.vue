<script setup lang="ts">
import { ParticipantEditModal, ParticipantPasswordEditModal } from "#components";

definePageMeta({
  layout: "user-dashboard",
});

const overlay = useOverlay();
const editModal = overlay.create(ParticipantEditModal);
const passwordModal = overlay.create(ParticipantPasswordEditModal);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Mon profil"/>
    </template>
    <template #body>
      <UContainer>
        <UCard>
          <template #default>
            <div class="grid gap-2">
              <div class="grid grid-cols-2 gap-6 *:w-full">
                <ParticipantProfileLabel label="Nom complet" icon="i-lucide-user">
                  {{ currentParticipant.firstName }} {{ currentParticipant.lastName }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="Adresse e-mail" icon="i-lucide-at-sign">
                  {{ currentParticipant.email }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="Compte GitHub" icon="i-simple-icons-github">
                  {{ currentParticipant.githubAccount || "Non renseigné" }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="Compte LinkedIn" icon="i-simple-icons-linkedin">
                  {{ currentParticipant.linkedInAccount || "Non renseigné" }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="École / Université" icon="i-lucide-graduation-cap">
                  {{ currentParticipant.school || "Non renseigné" }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="Régime alimentaire spécifique" icon="i-lucide-apple">
                  {{ currentParticipant.diet || "Aucun" }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="Besoins spécifiques" icon="i-lucide-heart">
                  {{ currentParticipant.needs || "Aucun" }}
                </ParticipantProfileLabel>

                <ParticipantProfileLabel label="CV" icon="i-lucide-file-user">
                  <div v-if="currentParticipant.curriculumVitae">
                    <UButton size="xs" variant="ghost" :to="currentParticipant.curriculumVitae"
                             icon="i-lucide-download">
                      Télécharger
                    </UButton>
                  </div>
                  <div v-else>
                    Non renseigné
                  </div>
                </ParticipantProfileLabel>
              </div>

              <div class="grid gap-2">
                <UCheckbox label="Recevoir la newsletter par e-mail"
                           :model-value="currentParticipant.newsletter"
                           disabled/>
                <UCheckbox label="Accepter que mon image soit utilisée dans le cadre de la promotion de l'évènement"
                           :model-value="currentParticipant.imageAgreement"
                           disabled/>
              </div>
            </div>
          </template>

          <template #footer>
            <div class="flex gap-1.5">
              <UButton @click="editModal.open({participant: currentParticipant})">
                Modifier mon profil
              </UButton>
              <UButton color="warning" @click="passwordModal.open()">
                Modifier le mot de passe
              </UButton>
            </div>
          </template>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
* {
  --ui-container: 60rem;
}
</style>
