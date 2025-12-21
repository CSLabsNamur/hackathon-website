<script setup lang="ts">
const supabase = useSupabaseClient();

await supabase.auth.signOut();
await navigateTo("/");
</script>

<template>
  <UContainer class="max-w-md">
    <h1 class="text-2xl font-bold">Déconnexion...</h1>
  </UContainer>
</template>
