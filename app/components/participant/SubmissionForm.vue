<script setup lang="ts">
import * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/submissions/create";

const props = defineProps<{
  participant: Participant;
  submissionRequest: SubmissionRequest;
}>();
const emit = defineEmits<{ submit: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();
const actions = useSubmissionsActions();

const participantSubmission = props.participant.submissions.find(s => s.requestId === props.submissionRequest.id);

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive(participantSubmission && !participantSubmission.skipped ? {
  skipped: participantSubmission.skipped,
  content: participantSubmission.content!,
} : {
  skipped: false,
  //content: props.submission.type === SubmissionType.TEXT ? "" : undefined,
  content: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await actions.submit(props.submissionRequest.id, event.data.content, false);

    toast.add({title: "Soumission réussie", description: "Votre document a été soumis avec succès.", color: "success"});

    console.log(event.data);
    emit("submit", true);
  } finally {
    isSubmitting.value = false;
  }
}

async function onSkip() {
  await actions.submit(props.submissionRequest.id, undefined, true);

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
  <UForm :schema :state @submit="onSubmit" @error="onError" class="grid gap-6">
    <UFormField :label="submissionRequest.title" :description="submissionRequest.description || undefined" name="answer"
                :required="submissionRequest.required">
      <template v-if="submissionRequest.type === SubmissionType.TEXT">
        <UTextarea v-model="state.content as string" :disabled="isSubmitting" placeholder="Votre réponse..." :rows="6"
                   class="w-full" :required="submissionRequest.required"/>
      </template>
      <!--      <template v-else>-->
      <!--        <UFileUpload v-model="state.content as File" :disabled="isSubmitting" description="Choisir un fichier..."-->
      <!--                     :accept="submission.acceptedFormats ?? '.pdf,.doc,.docx,.png,.jpg,.jpeg'"-->
      <!--                     :required="submission.required" class="w-full" :multiple="submission.multiple || undefined"/>-->
      <!--      </template>-->
    </UFormField>

    <div class="flex gap-1.5 place-self-end">
      <UButton v-if="!submissionRequest.required" variant="subtle" color="secondary" :loading="isSubmitting"
               @click="onSkip">
        Passer
      </UButton>
      <UButton type="submit" :loading="isSubmitting">
        Soumettre
      </UButton>
    </div>
  </UForm>
</template>
