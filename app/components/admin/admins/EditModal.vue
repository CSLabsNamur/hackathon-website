<script setup lang="ts">
import type * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/admins/edit";

const props = defineProps<{ admin: Admin }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateAdmin} = useAdminsActions();

type Schema = v.InferOutput<typeof schema>;

const state = reactive<Schema>({
  firstName: props.admin.user.firstName,
  lastName: props.admin.user.lastName,
  email: props.admin.user.email,
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await updateAdmin(props.admin.id, event.data);

    toast.add({
      title: "Administrateur modifié",
      description: "L'administrateur a été modifié avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
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
  <UModal title="Modifier l'administrateur"
          :description="`Modifier les informations de ${admin.user.firstName} ${admin.user.lastName}`"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="admin-edit-form" :schema :state :disabled="isSubmitting" class="grid grid-cols-1 gap-6"
               @submit="onSubmit" @error="onError">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="Prénom" name="firstName" required>
              <UInput v-model="state.firstName" icon="i-lucide-user" class="w-full"/>
            </UFormField>

            <UFormField label="Nom" name="lastName" required>
              <UInput v-model="state.lastName" icon="i-lucide-user" class="w-full"/>
            </UFormField>
          </div>

          <UFormField label="Email" name="email" required description="Doit se terminer par @cslabs.be">
            <UInput v-model="state.email" icon="i-lucide-mail" type="email" class="w-full"
                    placeholder="...@cslabs.be"/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>

    <template #footer="{close}">
      <UButton type="submit" form="admin-edit-form" :loading="isSubmitting">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
