<script setup lang="ts">
const organizers: Partner[] = [
  {
    name: 'CSLabs',
    logo: '/images/logo-cslabs.png',
    url: 'https://cslabs.be'
  },
  {
    name: 'UNamur',
    logo: '/images/partenaires/unamur.png',
    url: 'https://unamur.be'
  }
];
</script>

<template>
  <div class="mt-64">
    <PageHero title="Bienvenue au Hackathon" subtitle="Organisé par le CSLabs" content="Notez la date !" :images="organizers"/>
  </div>
</template>
