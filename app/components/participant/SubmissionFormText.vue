<script setup lang="ts">
import type { FormErrorEvent } from "#ui/types";
import schema, { type SubmitTextSchema } from "#shared/schemas/submissions/submitText";

const props = defineProps<{
  participant: Participant;
  submissionRequest: SubmissionRequest;
}>();
const emit = defineEmits<{ submit: [boolean] }>();

const toast = useToast();
const actions = useSubmissionsActions();

const participantSubmission = computed(() => props.participant.submissions.find(s => s.requestId === props.submissionRequest.id));

const state = reactive<SubmitTextSchema>({
  skipped: participantSubmission.value?.skipped ?? false,
  content: participantSubmission.value?.content ?? "",
});

const isSubmitting = ref(false);

async function onSubmit() {
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
    <UFormField :label="submissionRequest.title" :description="submissionRequest.description || undefined"
                name="content" :required="submissionRequest.required">
      <UTextarea v-model="state.content" :disabled="isSubmitting" placeholder="Votre réponse..." :rows="6"
                 class="w-full" :required="submissionRequest.required"/>
    </UFormField>

    <div class="flex gap-1.5 place-self-end">
      <UButton v-if="!submissionRequest.required" variant="subtle" color="secondary" :disabled="isSubmitting"
               @click="onSkip">
        Passer
      </UButton>
      <UButton type="submit" :loading="isSubmitting">
        Soumettre
      </UButton>
    </div>
  </UForm>
</template>
