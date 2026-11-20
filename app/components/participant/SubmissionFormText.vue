<script setup lang="ts">
import schema from "#shared/schemas/submissions/submitText";

const draft = defineModel<SubmissionDraft>({required: true});
const props = defineProps<{
  canSkip: boolean;
  disabled: boolean;
  busy: boolean;
}>();
const emit = defineEmits<{
  submit: [];
  skip: [];
}>();

const formState = computed(() => ({content: draft.value.content, skipped: false}));
const canSubmit = computed(() => !props.disabled && !props.busy && Boolean(draft.value.content.trim()));
</script>

<template>
  <UForm :schema :state="formState" :disabled="busy" class="grid gap-5" @submit="canSubmit && emit('submit')">
    <UFormField label="Votre réponse" name="content" required>
      <UTextarea v-model="draft.content" placeholder="Votre réponse…" :rows="8" autoresize class="w-full"
                 :readonly="disabled" :disabled="busy"/>
    </UFormField>
    <div class="flex flex-wrap justify-end gap-2">
      <UButton v-if="canSkip" color="neutral" variant="soft" :disabled="disabled || busy"
               @click="emit('skip')">
        Ne pas remettre
      </UButton>
      <UButton type="submit" :loading="busy" :disabled="!canSubmit">Enregistrer</UButton>
    </div>
  </UForm>
</template>
