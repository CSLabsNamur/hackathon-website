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
</script>

<template>
  <div class="space-y-4">
    <div v-for="(groupPermissions, group) in groupedPermissions" :key="group"
         class="rounded-lg border border-default p-4 space-y-3">
      <p class="text-sm font-semibold uppercase text-muted">
        {{ group }}
      </p>

      <div class="grid gap-3 md:grid-cols-2">
        <UCheckbox v-for="permission in groupPermissions" :key="permission.key"
                   :model-value="model.includes(permission.key)" :disabled="disabled" :label="permission.name"
                   :description="permission.key"
                   @update:model-value="setPermissionEnabled(permission.key, $event as boolean)"/>
      </div>
    </div>
  </div>
</template>
