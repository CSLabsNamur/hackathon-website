<script setup lang="ts">

</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Informations" subtitle="Les informations nécessaires !"/>
  </UPageHero>

  <div class="flex flex-col gap-2 px-4 *:mx-auto *:w-full md:*:max-w-xl">
    <UPageCard title="Lieu" icon="i-lucide-map-pinned">
      <template #description>
        <div>
          <p>Faculté d'informatique de l'Université de Namur</p>
          <p>Rue Grandgagnage 21, 5000 Namur, Belgique</p>
        </div>
      </template>
    </UPageCard>

    <UPageCard title="Date" icon="i-lucide-calendar">
      <template #description>
        <div>
          <!-- TODO: get date from database or env variable -->
          <p>Du vendredi 27 mars 2026 à 18h00</p>
          <p>Au dimanche 29 mars 2026 à 18h00</p>
        </div>
      </template>
    </UPageCard>

    <UPageCard title="Contacts" icon="i-lucide-mail">
      <template #description>
        <div>
          <p>N'hésite pas à nous contacter pour toute question !</p>
          <div class="mt-2 break-words">
            <p>Facebook : <a href="https://www.facebook.com/ComputerScienceLabs/">Page Facebook</a></p>
            <p>Mail : <a href="mailto:event@cslabs.be">event@cslabs.be</a></p>
            <p>Serveur Discord : <a href="https://discord.gg/Jf2Dht8">https://discord.gg/Jf2Dht8</a></p>
          </div>
        </div>
      </template>
    </UPageCard>

    <UPageCard title="Commodités" icon="i-lucide-coffee">
      <template #description>
        <div>
          <ul class="space-y-2">
            <li>Repos : <span class="font-semibold">Une salle pour dormir sera mise à disposition au sein de l'Université*</span>
            </li>
            <li>Repas : <span class="font-semibold">Repas fournis</span></li>
            <li>Sanitaires : <span class="font-semibold">Installations de l'Université</span></li>
          </ul>
          <div class="mt-2 font-light italic">
            *Nous vous demandons de prévoir un matelas/lit de camp que vous pourrez installer dans cette salle.
            Quelques lits de camp seront prévus pour dépanner, mais il n'y en aura pas assez pour tout le monde.
          </div>
        </div>
      </template>
    </UPageCard>
  </div>
</template>
