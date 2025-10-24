<script setup lang="ts">
import type { StepperItem } from "#ui/components/Stepper.vue";

definePageMeta({
  layout: "user-dashboard",
});

const toast = useToast();

const active = ref(0);
const stepperItems = computed<StepperItem[]>(() => submissionRequests.value.map((submission) => ({
  title: submission.title,
  // If the submission is done by the user, show a check icon, else show an icon based on the type
  icon: currentParticipant.submissions.map(s => s.requestId).includes(submission.id) ? "i-lucide-check" : submission.type === "text" ? "i-lucide-text" : "i-lucide-file",
})));

const allCompleted = computed<boolean>(() => submissionRequests.value.every((submission) => currentParticipant.submissions.map(s => s.requestId).includes(submission.id)));
const wantToModify = ref(false);

onMounted(() => {
  const nextActive = submissionRequests.value.findIndex((submission) => !currentParticipant.submissions.map(s => s.requestId).includes(submission.id));
  if (nextActive !== -1) {
    active.value = nextActive;
  }
});

const onSubmit = (status: boolean) => {
  if (status) {
    wantToModify.value = false;
    if (active.value < submissionRequests.value.length - 1) {
      active.value += 1;
    }
  }
};
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Soumission de documents"/>
    </template>
    <template #body>
      <UContainer>
        <UCard>
          <template v-if="!allCompleted || wantToModify">
            <UStepper :items="stepperItems" v-model="active" :linear="false"/>
            <div class="relative min-h-56">
              <Transition name="slide-left" mode="out-in">
                <ParticipantSubmissionForm
                    :key="active"
                    :submission="submissionRequests[active]!"
                    @close="toast.add({ title: 'Soumission réussie', description: 'Votre document a été soumis avec succès.', color: 'success' })"
                    @submit="onSubmit"
                    class="min-h-56"
                />
              </Transition>
            </div>
          </template>
          <template v-else>
            <UPageSection
                title="Toutes les soumissions sont terminées"
                description="Vous avez soumis tous les documents requis. Merci !"
                icon="i-lucide-check-circle"
                :links="[{label: 'Modifier mes soumissions', color: 'warning', onClick: () => {  wantToModify = true }}]"
            />
          </template>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.slide-left-enter-from {
  transform: translateX(24px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

* {
  --ui-container: 60rem;
}
</style>
