<script setup lang="ts">

definePageMeta({
  layout: "user-dashboard",
  middleware: "participant-auth",
});

const {data: submissionsRequests} = await useSubmissionsRequests({lazy: false});
const {data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();

const active = ref(0);

const submittedRequestIds = computed(() => new Set((currentParticipant.value?.submissions ?? []).map(s => s.requestId)));

const stepperItems = computed(() => (submissionsRequests.value ?? []).map((submission) => ({
  title: submission.title,
  icon: submittedRequestIds.value.has(submission.id)
      ? "i-lucide-check"
      : submission.type === "TEXT"
          ? "i-lucide-text"
          : "i-lucide-file",
})));

const allCompleted = computed(() =>
    (submissionsRequests.value ?? []).every((submission) => submittedRequestIds.value.has(submission.id)),
);

const wantToModify = ref(false);

onMounted(async () => {
  const nextActive = (submissionsRequests.value ?? []).findIndex((submission) => !submittedRequestIds.value.has(submission.id));
  if (nextActive !== -1) {
    active.value = nextActive;
  }
});

const onSubmit = async (status: boolean) => {
  if (status) {
    await refreshCurrentParticipant();

    wantToModify.value = false;
    if (active.value < submissionsRequests.value!.length - 1) {
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
                    :participant="currentParticipant!"
                    :submission-request="submissionsRequests![active]!"
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
