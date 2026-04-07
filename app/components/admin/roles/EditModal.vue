<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import type * as v from "valibot";
import schema from "#shared/schemas/roles/edit";
import type { Permission as PermissionKey } from "#shared/utils/authorization";

const props = defineProps<{
  role: Role;
  permissions: PermissionDb[];
}>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateRole} = useRolesActions();

type Schema = v.InferOutput<typeof schema>;

const state = reactive<Schema>({
  key: props.role.key,
  name: props.role.name,
  description: props.role.description ?? "",
  permissionKeys: props.role.permissions.map((permission) => permission.key as PermissionKey),
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;
    await updateRole(props.role.id, event.data);

    toast.add({
      title: "Rôle modifié",
      description: "Le rôle a été modifié avec succès.",
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
  <UModal title="Modifier le rôle" description="Mettez à jour le rôle et ses permissions."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-4xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="role-edit-form" :schema :state :disabled="isSubmitting"
               class="grid grid-cols-1 gap-6" @submit="onSubmit" @error="onError">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="Clé" name="key" required>
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
      <UButton type="submit" form="role-edit-form" :loading="isSubmitting">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
