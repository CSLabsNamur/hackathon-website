<template>
  <UCard :ui="{body: 'p-6 md:p-8'}" class="mx-auto max-w-4xl rounded-xl bg-white/70 dark:bg-gray-900/30 shadow-xl">
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope"/>
    </template>
  </UCard>
</template>
