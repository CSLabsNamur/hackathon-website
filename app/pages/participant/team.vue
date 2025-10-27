<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { ButtonProps } from "#ui/components/Button.vue";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";
import { RemoveTeamMemberModal } from "#components";

definePageMeta({
  layout: "user-dashboard",
});

const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const overlay = useOverlay();
const toast = useToast();
const {copy} = useClipboard();

const removeMemberModal = overlay.create(RemoveTeamMemberModal);

const columns: TableColumn<Participant>[] = [
  {
    id: "name",
    header: "Nom",
    accessorFn: (row: Participant) => `${row.firstName} ${row.lastName}`,
  },
  {
    header: "Réseaux",
    cell: ({row}) => {
      const github = row.original.githubAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-github",
        to: row.original.githubAccount,
      }) : null;
      const linkedin = row.original.linkedinAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-linkedin",
        to: row.original.linkedinAccount,
      }) : null;
      return h("div", {class: "flex space-x-2"}, [github, linkedin]);
    },
  },
  {
    header: "CV",
    accessorKey: "curriculumVitae",
    cell: ({row}) => {
      const cvLink = row.getValue("curriculumVitae") as string | null;
      if (cvLink) {
        return h(UButton, {
          variant: "link",
          size: "sm",
          icon: "i-lucide-download",
          to: cvLink,
        });
      }
    },
  },
  {
    header: "École",
    accessorKey: "school",
  },
  {
    header: "Régime alimentaire",
    accessorKey: "diet",
  },
  //TODO: Profile button?
  {
    header: "Profil",
    cell: ({row}) => {
      return h(UButton, {
        variant: "ghost",
        size: "sm",
        icon: "i-lucide-user",
        //onClick: () => editModal.open({participant: row.original}),
      });
    },
  },
  {
    id: "actions",
    cell: ({row}) => {
      return h(
          "div",
          {class: "text-right"},
          h(
              UDropdownMenu,
              {
                content: {align: "end"},
                items: getRowItems(row),
                "aria-label": `Actions pour l'utilisateur ${row.original.firstName} ${row.original.lastName}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'utilisateur ${row.original.firstName} ${row.original.lastName}`,
              }),
          ),
      );
    },
  },
];

// TODO: Do we allow participants to remove others from their team?
function getRowItems(row: Row<Participant>): Array<DropdownMenuItem> {
  return [
    {
      label: "Retirer de l'équipe",
      icon: "i-lucide-user-minus",
      onClick: () => {
        removeMemberModal.open({participant: row.original});
      },
    },
  ];
}

const teamMembers = useArrayFilter(toRef(participants), (p) => currentTeam.value?.members.includes(p.id) && p.id !== currentParticipant.id);

const noMembersLinks: ButtonProps[] = [
  {
    label: "Inviter des membres",
    icon: "i-lucide-user-plus",
    //onClick: () => {}
  },
];

const copyToken = () => {
  copy(currentTeam.value!.token);
  toast.add({
    title: "Code d'invitation copié",
    description: "Le code d'invitation de l'équipe a été copié dans le presse-papiers.",
    color: "success",
  });
};
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Mon équipe"/>
    </template>
    <template #body>
      <UContainer>
        <ParticipantNoTeamCTA v-if="!currentTeam"/>

        <UPageGrid v-else>
          <UCard class="col-span-2 row-span-2" variant="subtle">
            <div class="grid gap-6">
              <p class="text-3xl font-semibold text-center">{{ currentTeam.name }}</p>
              <div class="grid grid-cols-3 gap-3">
                <UPageCard variant="subtle" title="Description" icon="i-lucide-text">
                  {{ currentTeam.description || "Aucune description fournie." }}
                </UPageCard>
                <UPageCard variant="subtle" title="Idée" icon="i-lucide-lightbulb">
                  {{ currentTeam.idea || "Aucune idée fournie." }}
                </UPageCard>
                <UPageCard variant="subtle" title="Code d'invitation" icon="i-lucide-key">
                  <div class="flex items-center gap-2">
                    <p class="font-mono text-lg">{{ currentTeam.token }}</p>
                    <UButton variant="soft" color="neutral" icon="i-lucide-copy" size="sm"
                             @click="copyToken">
                      Copier
                    </UButton>
                  </div>
                </UPageCard>
              </div>
            </div>
          </UCard>
          <div class="grid gap-2 row-span-2">
            <ParticipantTeamStatusCard/>
            <ParticipantScheduleCard/>
          </div>
          <UTable :columns :data="teamMembers" class="col-span-full">
            <template #empty>
              <div class="max-w-1/2 mx-auto">
                <UEmpty title="Aucun membre dans l'équipe"
                        description="Ne restez pas solo... Invitez des gens dans votre équipe !"
                        icon="i-lucide-circle-slash"
                        :actions="noMembersLinks"/>
              </div>
            </template>
          </UTable>
        </UPageGrid>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
