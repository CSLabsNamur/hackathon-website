<script setup lang="ts">
import * as v from "valibot";
import type { Reactive } from "vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/submissions/create";

const props = defineProps<{
  participant: ParticipantWithSubmissions;
  submission: SubmissionRequest;
}>();
const emit = defineEmits<{ submit: [boolean] }>();

const dayjs = useDayjs();
const toast = useToast();

const participantSubmission = props.participant.submissions.find(s => s.requestId === props.submission.id);

type Schema = v.InferOutput<typeof schema>

const state: Reactive<Schema> = reactive(participantSubmission && !participantSubmission.skipped ? {
  content: participantSubmission.content,
} : {
  content: props.submission.type === SubmissionType.TEXT ? "" : undefined,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    // Simulate form submission
    //await new Promise((resolve) => setTimeout(resolve, 1000));
    //
    //currentParticipant.submissions.push({
    //  requestId: props.submission.id,
    //  submittedAt: dayjs().valueOf(),
    //  content: event.data.answer!,
    //  skipped: false,
    //});

    toast.add({
      title: `Formulaire ${props.submission.id} soumis`,
      description: "Votre réponse a bien été soumise.",
      color: "success",
    });

    console.log(event.data);
    emit("submit", true);
  } finally {
    isSubmitting.value = false;
  }
}

function onSkip() {
  //currentParticipant.submissions.push({
  //  requestId: props.submission.id,
  //  submittedAt: dayjs().valueOf(),
  //  skipped: true,
  //});
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
    <UFormField :label="submission.title" :description="submission.description || undefined" name="answer"
                :required="submission.required">
      <template v-if="submission.type === SubmissionType.TEXT">
        <UTextarea v-model="state.content as string" :disabled="isSubmitting" placeholder="Votre réponse..." :rows="6"
                   class="w-full" :required="submission.required"/>
      </template>
      <template v-else>
        <UFileUpload v-model="state.content as File" :disabled="isSubmitting" description="Choisir un fichier..."
                     :accept="submission.acceptedFormats ?? '.pdf,.doc,.docx,.png,.jpg,.jpeg'"
                     :required="submission.required" class="w-full" :multiple="submission.multiple || undefined"/>
      </template>
    </UFormField>

    <div class="flex gap-1.5 place-self-end">
      <UButton v-if="!submission.required" variant="subtle" color="secondary" :loading="isSubmitting"
               @click="onSkip">
        Passer
      </UButton>
      <UButton type="submit" :loading="isSubmitting">
        Soumettre
      </UButton>
    </div>
  </UForm>
</template>
