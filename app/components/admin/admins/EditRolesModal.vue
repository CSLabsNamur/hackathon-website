<script setup lang="ts">
import type * as v from "valibot";
import type { FormErrorEvent, FormSubmitEvent, SelectMenuItem } from "#ui/types";
import schema from "#shared/schemas/admins/updateRoles";

const props = defineProps<{
  admin: Admin;
  roles: Role[];
}>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateAdminRoles} = useAdminsActions();

type Schema = v.InferOutput<typeof schema>

const availableRoles = computed(() => props.roles.filter((role) => role.key !== "participant"));
const roleOptions = computed<SelectMenuItem[]>(() => availableRoles.value.map((role) => ({
  label: role.name,
  value: role.id,
})));

const state = reactive<Schema>({
  roleIds: props.admin.user.roleAssignments
      .filter((assignment) => assignment.role.key !== "participant")
      .map((assignment) => assignment.roleId),
});

const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    isSubmitting.value = true;

    await updateAdminRoles(props.admin.id, event.data);

    toast.add({
      title: "Rôles mis à jour",
      description: "Les rôles de l'administrateur ont été mis à jour.",
      color: "success",
      duration: 2000,
    });

    emit("close", true);
  } catch {
    toast.add({
      title: "Erreur",
      description: "Erreur lors de la mise à jour des rôles.",
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
  <UModal title="Gérer les rôles"
          :description="`Mettez à jour les rôles de ${admin.user.firstName} ${admin.user.lastName}.`"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <UForm id="admin-roles-form" :schema :state :disabled="isSubmitting" class="grid grid-cols-1 gap-6"
               @submit="onSubmit" @error="onError">
          <UFormField label="Rôles" name="roleIds" required>
            <USelectMenu v-model="state.roleIds" :items="roleOptions" value-key="value" multiple class="w-full"
                         placeholder="Sélectionnez un ou plusieurs rôles"/>
          </UFormField>
        </UForm>
      </UContainer>
    </template>

    <template #footer="{close}">
      <UButton type="submit" form="admin-roles-form" :loading="isSubmitting">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
