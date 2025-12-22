<script setup lang="ts">
import type * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import schema from "#shared/schemas/admins/invite";

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const actions = useAdminsActions();

type Schema = v.InferOutput<typeof schema>

const state = reactive<Schema>({
  firstName: "",
  lastName: "",
  email: "",
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await actions.inviteAdmin(event.data);

    toast.add({
      title: "Administrateur ajouté",
      description: "L'administrateur a été ajouté avec succès.",
      color: "success",
      duration: 2000,
    });

    emit("close", true);
  } catch {
    toast.add({
      title: "Erreur",
      description: "Erreur lors de l'ajout de l'administrateur.",
      color: "error",
    });
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
  <UModal title="Ajouter un admin"
          description="Entrez l'adresse email CSLabs de la personne à ajouter comme administrateur."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="admin-invite-form" :schema :state :disabled="isSubmitting" class="grid grid-cols-1 gap-6"
               @submit="onSubmit" @error="onError">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="Prénom" name="firstName" required>
              <UInput v-model="state.firstName" icon="i-lucide-user" type="text" class="w-full" placeholder="Prénom"/>
            </UFormField>
            <UFormField label="Nom" name="lastName" required>
              <UInput v-model="state.lastName" icon="i-lucide-user" type="text" class="w-full" placeholder="Nom"/>
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
      <UButton type="submit" form="admin-invite-form" :loading="isSubmitting">Ajouter</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
