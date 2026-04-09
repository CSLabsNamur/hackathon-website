<script setup lang="ts">
definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Soumission de documents",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["submissionRequests.read", "submissions.read.own"],
});

const {data: submissionsRequests} = await useSubmissionsRequests({lazy: false});
// TODO: Why not use useSubmissions instead?
const {data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();
const {can} = useAbility(currentParticipant);
const canUpdateSubmission = computed(() => can("updateOwn", "Submission"));
const canDeleteSubmission = computed(() => can("deleteOwn", "Submission"));

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
const modifySubmissionLinks = computed(() => [{
  label: "Modifier mes soumissions",
  color: "warning" as const,
  disabled: !canUpdateSubmission.value,
  onClick: () => {
    if (!canUpdateSubmission.value) return;
    wantToModify.value = true;
  },
}]);

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
  <UContainer>
    <UCard>
      <template v-if="!allCompleted || wantToModify">
        <UStepper v-model="active" :items="stepperItems" :linear="false"/>
        <div class="relative min-h-56">
          <Transition name="slide-left" mode="out-in">
            <ParticipantSubmissionFormText
                v-if="submissionsRequests![active]!.type === 'TEXT'"
                :key="active"
                :participant="currentParticipant!"
                :submission-request="submissionsRequests![active]!"
                :can-submit="canUpdateSubmission"
                class="min-h-56"
                @submit="onSubmit"
            />
            <ParticipantSubmissionFormFiles
                v-else
                :key="active"
                :participant="currentParticipant!"
                :submission-request="submissionsRequests![active]!"
                :can-submit="canUpdateSubmission"
                :can-delete="canDeleteSubmission"
                class="min-h-56"
                @delete-file="refreshCurrentParticipant"
                @submit="onSubmit"
            />
          </Transition>
        </div>
      </template>
      <template v-else>
        <UPageSection
            title="Toutes les soumissions sont terminées"
            description="Vous avez soumis tous les documents requis. Merci !"
            icon="i-lucide-check-circle"
            :links="modifySubmissionLinks"
        />
      </template>
    </UCard>
  </UContainer>
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
