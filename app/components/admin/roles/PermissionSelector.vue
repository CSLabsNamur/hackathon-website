<script setup lang="ts">
const model = defineModel<string[]>({required: true});

const props = defineProps<{
  permissions: PermissionDb[];
  disabled?: boolean;
}>();

const {data: currentAdmin} = await useCurrentAdmin();

const groupedPermissions = computed(() => {
  return props.permissions.reduce<Record<string, PermissionDb[]>>((groups, permission) => {
    if (!groups[permission.group]) {
      groups[permission.group] = [];
    }

    groups[permission.group]!.push(permission);
    return groups;
  }, {});
});

function isPermissionDelegable(permissionKey: string) {
  return canDelegatePermissionKeys(currentAdmin, [permissionKey]);
}

function isPermissionDisabled(permissionKey: string) {
  return props.disabled || !isPermissionDelegable(permissionKey);
}

function getDelegablePermissions(permissions: PermissionDb[]) {
  return permissions.filter((permission) => isPermissionDelegable(permission.key));
}

function setPermissionEnabled(permissionKey: string, enabled: boolean) {
  if (isPermissionDisabled(permissionKey)) return;

  const selectedKeys = new Set(model.value);

  if (enabled) {
    selectedKeys.add(permissionKey);
  } else {
    selectedKeys.delete(permissionKey);
  }

  model.value = Array.from(selectedKeys).sort();
}

const selectAllCheckboxModel = computed(() => (groupPermissions: PermissionDb[]) => {
  const delegablePermissions = getDelegablePermissions(groupPermissions);
  const selectedCount = delegablePermissions.filter(permission => model.value.includes(permission.key)).length;
  if (selectedCount === 0) {
    return false;
  } else if (selectedCount === delegablePermissions.length) {
    return true;
  } else {
    return "indeterminate";
  }
});

function setPermissionEnabledForGroup(group: string, enabled: boolean) {
  const groupPermissions = getDelegablePermissions(groupedPermissions.value[group] || []);
  const selectedKeys = new Set(model.value);

  groupPermissions.forEach(permission => {
    if (enabled) {
      selectedKeys.add(permission.key);
    } else {
      selectedKeys.delete(permission.key);
    }
  });

  model.value = Array.from(selectedKeys).sort();
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="(groupPermissions, group) in groupedPermissions" :key="group"
         class="rounded-lg border border-default p-4 space-y-3">
      <div class="flex justify-between">
        <p class="text-sm font-semibold uppercase text-muted">
          {{ group }}
        </p>

        <UCheckbox :id="`select-all-${group}`" :model-value="selectAllCheckboxModel(groupPermissions)"
                   :disabled="disabled || getDelegablePermissions(groupPermissions).length === 0" label="Tout sélectionner"
                   @update:model-value="setPermissionEnabledForGroup(group, $event as boolean)"/>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <UCheckbox v-for="permission in groupPermissions" :id="`permission-${permission.id}`"
                   :key="permission.id" :model-value="model.includes(permission.key)"
                   :disabled="isPermissionDisabled(permission.key)" :label="permission.name" :description="permission.key"
                   @update:model-value="setPermissionEnabled(permission.key, $event as boolean)"/>
      </div>
    </div>
  </div>
</template>
