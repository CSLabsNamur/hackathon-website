<script setup lang="ts">
import type { FormErrorEvent } from "#ui/types";
import schema, { type SubmitTextSchema } from "#shared/schemas/submissions/submitText";

const props = defineProps<{
  participant: CurrentParticipant;
  submissionRequest: SubmissionRequest;
  canSubmit?: boolean;
}>();
const emit = defineEmits<{ submit: [boolean] }>();

const toast = useToast();
const actions = useSubmissionsActions();

const participantSubmission = computed(() => props.participant.submissions.find(s => s.requestId === props.submissionRequest.id));

const canSubmitThisRequest = computed(() => Boolean(props.canSubmit));

const scopeDescription = computed(() => {
  if (!props.submissionRequest.teamRequest) {
    return "Chaque participant doit répondre individuellement.";
  }

  const user = participantSubmission.value?.participant.user;
  return user
      ? `Une seule réponse est attendue pour toute l'équipe. La version actuelle a été soumise par ${user.firstName} ${user.lastName}.`
      : "Une seule réponse est attendue pour toute l'équipe.";
});

const state = reactive<SubmitTextSchema>({
  skipped: participantSubmission.value?.skipped ?? false,
  content: participantSubmission.value?.content ?? "",
});

watch(participantSubmission, (submission) => {
  state.skipped = submission?.skipped ?? false;
  state.content = submission?.content ?? "";
}, {immediate: true});

const isSubmitting = ref(false);

async function onSubmit() {
  if (!canSubmitThisRequest.value) return;

  try {
    isSubmitting.value = true;
    await actions.submitText(props.submissionRequest.id, {content: state.content, skipped: false});
    toast.add({title: "Soumission réussie", description: "Votre document a été soumis avec succès.", color: "success"});
    emit("submit", true);
  } finally {
    isSubmitting.value = false;
  }
}

async function onSkip() {
  if (!canSubmitThisRequest.value) return;

  await actions.submitText(props.submissionRequest.id, {content: undefined, skipped: true});
  emit("submit", true);
}

async function onError(event: FormErrorEvent) {
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({behavior: "smooth", block: "center"});
  }
}
</script>

<template>
  <UForm :schema="schema" :state class="grid gap-6" @submit="onSubmit" @error="onError">
    <UAlert
        :title="submissionRequest.teamRequest ? 'Soumission d’équipe' : 'Soumission individuelle'"
        :description="scopeDescription"
        color="info"
        variant="soft"
        :icon="submissionRequest.teamRequest ? 'i-lucide-users' : 'i-lucide-user'"
    />

    <UFormField :label="submissionRequest.title" :description="submissionRequest.description || undefined"
                name="content" :required="submissionRequest.required">
      <UTextarea v-model="state.content" :disabled="isSubmitting || !canSubmitThisRequest"
                 placeholder="Votre réponse..." :rows="6"
                 class="w-full" :required="submissionRequest.required"/>
    </UFormField>

    <div class="flex gap-1.5 place-self-end">
      <UButton v-if="!submissionRequest.required" variant="subtle" color="secondary"
               :disabled="isSubmitting || !canSubmitThisRequest"
               @click="onSkip">
        Passer
      </UButton>
      <UButton type="submit" :loading="isSubmitting" :disabled="!canSubmitThisRequest">
        Soumettre
      </UButton>
    </div>
  </UForm>
</template>
