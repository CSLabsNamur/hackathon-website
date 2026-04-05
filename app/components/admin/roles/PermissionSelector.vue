<script setup lang="ts">
const model = defineModel<string[]>({required: true});

const props = defineProps<{
  permissions: PermissionDb[];
  disabled?: boolean;
}>();

const groupedPermissions = computed(() => {
  return props.permissions.reduce<Record<string, PermissionDb[]>>((groups, permission) => {
    if (!groups[permission.group]) {
      groups[permission.group] = [];
    }

    groups[permission.group]!.push(permission);
    return groups;
  }, {});
});

function setPermissionEnabled(permissionKey: string, enabled: boolean) {
  const selectedKeys = new Set(model.value);

  if (enabled) {
    selectedKeys.add(permissionKey);
  } else {
    selectedKeys.delete(permissionKey);
  }

  model.value = Array.from(selectedKeys).sort();
}

const selectAllCheckboxModel = computed(() => (groupPermissions: PermissionDb[]) => {
  const selectedCount = groupPermissions.filter(permission => model.value.includes(permission.key)).length;
  if (selectedCount === 0) {
    return false;
  } else if (selectedCount === groupPermissions.length) {
    return true;
  } else {
    return "indeterminate";
  }
});

function setPermissionEnabledForGroup(group: string, enabled: boolean) {
  const groupPermissions = groupedPermissions.value[group] || [];
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
                   :disabled="disabled" label="Tout sélectionner"
                   @update:model-value="setPermissionEnabledForGroup(group, $event as boolean)"/>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <UCheckbox v-for="permission in groupPermissions" :id="`permission-${permission.id}`"
                   :key="permission.id" :model-value="model.includes(permission.key)"
                   :disabled="disabled" :label="permission.name" :description="permission.key"
                   @update:model-value="setPermissionEnabled(permission.key, $event as boolean)"/>
      </div>
    </div>
  </div>
</template>
