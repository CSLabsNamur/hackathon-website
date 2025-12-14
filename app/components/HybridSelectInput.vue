<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string;
  name: string;
  required?: boolean;
  options: string[];
  icon?: string;
  placeholder?: string;
  customLabel?: string;
}>(), {
  required: false,
  placeholder: "Précisez...",
  customLabel: "Autre",
});

const modelValue = defineModel<string | undefined>();

const selectedOption = ref<string | undefined>(modelValue.value);
const customValue = ref<string>("");
const isCustom = computed(() => {
  return selectedOption.value === props.customLabel || customValue.value !== "";
});

// Watch for external changes to modelValue
watch(modelValue, (newValue) => {
  if (newValue === props.customLabel) {
    customValue.value = "";
  } else if (newValue && !props.options.includes(newValue)) {
    customValue.value = newValue;
  } else {
    selectedOption.value = newValue;
  }
}, {immediate: true});

// Watch for changes in the internal state
watch([selectedOption, customValue, isCustom], () => {
  if (isCustom.value) {
    modelValue.value = customValue.value || props.customLabel;
  } else {
    modelValue.value = selectedOption.value;
  }
}, {deep: true});

function handleSelectChange(value: string) {
  if (value === props.customLabel) {
    selectedOption.value = props.customLabel;
  } else {
    selectedOption.value = value;
  }
}

function handleCustomInput(value: string) {
  customValue.value = value;
}

function clearSelection() {
  selectedOption.value = undefined;
  customValue.value = "";
  modelValue.value = undefined;
}
</script>

<template>
  <UFormField :label :name :required>
    <template #label="{label}">
      <label :class="{'after:content-[\'*\'] after:ms-0.5 after:text-error': required}" class="flex gap-1 items-center">
        {{ label }}
        <Transition>
          <span v-if="isCustom" class="text-xs text-muted">
            &gt; {{ customLabel }}
          </span>
        </Transition>
      </label>
    </template>

    <template v-if="!isCustom">
      <USelect v-model="selectedOption" class="w-full" :items="options" :icon="icon"
               @update:model-value="handleSelectChange">
        <template #trailing>
          <UButton v-if="selectedOption" aria-label="Effacer la sélection" icon="i-lucide-x" color="neutral" size="xs"
                   variant="ghost" class="text-muted" @pointerdown.stop.prevent
                   @keydown.enter.stop.prevent="clearSelection" @keydown.space.stop.prevent="clearSelection"
                   @click.stop="clearSelection"/>
        </template>
      </USelect>
    </template>

    <template v-else>
      <UInput v-model="customValue" class="w-full" :icon="icon"
              :placeholder="placeholder" @update:model-value="handleCustomInput">
        <template #trailing>
          <UButton aria-label="Effacer la sélection" icon="i-lucide-x" color="neutral" size="xs" variant="ghost"
                   class="text-muted" @pointerdown.stop.prevent @keydown.enter.stop.prevent="clearSelection"
                   @keydown.space.stop.prevent="clearSelection" @click.stop="clearSelection"/>
        </template>
      </UInput>
    </template>
  </UFormField>
</template>

<style scoped>
.v-enter-active, .v-leave-active {
  transition: all 0.2s;
  transform: translateY(0);
}

.v-enter-from, .v-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>