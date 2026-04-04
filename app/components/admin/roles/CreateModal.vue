<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type * as v from "valibot";
import schema from "#shared/schemas/roles/create";

defineProps<{
  permissions: PermissionDb[];
}>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {createRole} = useRolesActions();

type Schema = v.InferOutput<typeof schema>;

const state = reactive<Schema>({
  key: "",
  name: "",
  description: "",
  permissionKeys: [],
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    await createRole(event.data);

    toast.add({
      title: "Rôle créé",
      description: "Le rôle a été créé avec succès.",
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
  <UModal title="Créer un rôle" description="Créez un rôle et assignez-lui des permissions."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-4xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="role-create-form" :schema :state :disabled="isSubmitting"
               class="grid grid-cols-1 gap-6" @submit="onSubmit" @error="onError">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="Clé" name="key" required
                        description="Identifiant technique du rôle, par exemple 'logistics' ou 'super_admin'.">
              <UInput v-model="state.key" icon="i-lucide-key-round" class="w-full"/>
            </UFormField>

            <UFormField label="Nom" name="name" required>
              <UInput v-model="state.name" icon="i-lucide-shield" class="w-full"/>
            </UFormField>
          </div>

          <UFormField label="Description" name="description">
            <UTextarea v-model="state.description" :rows="3" class="w-full"/>
          </UFormField>

          <UFormField label="Permissions" name="permissionKeys">
            <AdminRolesPermissionSelector v-model="state.permissionKeys" :permissions :disabled="isSubmitting"/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>

    <template #footer="{ close }">
      <UButton type="submit" form="role-create-form" :loading="isSubmitting">Créer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
