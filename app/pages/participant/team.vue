<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { ButtonProps } from "#ui/components/Button.vue";
import { AdminTeamsEditModal } from "#components";
//import { RemoveTeamMemberModal } from "#components";

definePageMeta({
  layout: "user-dashboard",
  middleware: "participant-auth",
});

const {data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();

const UButton = resolveComponent("UButton");
//const UDropdownMenu = resolveComponent("UDropdownMenu");

const overlay = useOverlay();
const editTeamModal = overlay.create(AdminTeamsEditModal);

const toast = useToast();
const {copy} = useClipboard();

//const removeMemberModal = overlay.create(RemoveTeamMemberModal);

const columns: TableColumn<ParticipantWithoutRelations>[] = [
  {
    id: "name",
    header: "Nom",
    accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
  },
  {
    header: "Réseaux",
    cell: ({row}) => {
      const github = row.original.githubAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-github",
        external: true,
        to: `https://github.com/${row.original.githubAccount}`,
      }) : null;
      const linkedIn = row.original.linkedInAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-linkedin",
        external: true,
        to: `https://github.com/${row.original.linkedInAccount}`,
      }) : null;
      return h("div", {class: "flex space-x-2"}, [github, linkedIn]);
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
  //{
  //  header: "Profil",
  //  cell: ({row}) => {
  //    return h(UButton, {
  //      variant: "ghost",
  //      size: "sm",
  //      icon: "i-lucide-user",
  //      //onClick: () => editModal.open({participant: row.original}),
  //    });
  //  },
  //},
  //{
  //  id: "actions",
  //  cell: ({row}) => {
  //    return h(
  //        "div",
  //        {class: "text-right"},
  //        h(
  //            UDropdownMenu,
  //            {
  //              content: {align: "end"},
  //              items: getRowItems(row),
  //              "aria-label": `Actions pour l'utilisateur ${row.original.user.firstName} ${row.original.user.lastName}`,
  //            },
  //            () => h(UButton, {
  //              icon: "i-lucide-ellipsis-vertical",
  //              color: "neutral",
  //              variant: "ghost",
  //              class: "ml-auto",
  //              "aria-label": `Ouvrir le menu des actions pour l'utilisateur ${row.original.user.firstName} ${row.original.user.lastName}`,
  //            }),
  //        ),
  //    );
  //  },
  //},
];

// TODO: Do we allow participants to remove others from their team?
//function getRowItems(row: Row<ParticipantWithoutRelations>): Array<DropdownMenuItem> {
//  return [
//    {
//      label: "Retirer de l'équipe",
//      icon: "i-lucide-user-minus",
//      onClick: () => {
//        removeMemberModal.open({participant: row.original});
//      },
//    },
//  ];
//}

const noMembersLinks: ButtonProps[] = [
  {
    label: "Inviter des membres",
    icon: "i-lucide-user-plus",
    onClick: () => copyToken(),
  },
];

const copyToken = () => {
  if (!currentParticipant.value?.team) return;

  copy(currentParticipant.value.team.token);
  toast.add({
    title: "Code d'invitation copié",
    description: "Le code d'invitation de l'équipe a été copié dans le presse-papiers. Partagez-le avec vos amis pour les inviter dans votre équipe !",
    color: "success",
  });
};

const openEditTeamModal = async () => {
  if (!currentParticipant.value?.team) return;
  const result = await editTeamModal.open({team: currentParticipant.value.team as unknown as Team});
  if (result) await refreshCurrentParticipant();
};
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Mon équipe">
        <template #right>
          <UButton v-if="currentParticipant?.team"
                   icon="i-lucide-edit-2"
                   @click="openEditTeamModal">
            Modifier
          </UButton>
        </template>
      </DashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <UCard v-if="!currentParticipant">
          <template #default>
            <USkeleton class="h-20 w-40"/>
          </template>
        </UCard>

        <ParticipantNoTeamCTA v-else-if="!currentParticipant!.team"/>

        <UPageGrid v-else>
          <UCard class="col-span-2 row-span-2" variant="subtle">
            <div class="grid gap-6">
              <p class="text-3xl font-semibold text-center">{{ currentParticipant.team.name }}</p>
              <div class="grid grid-cols-3 gap-3">
                <UPageCard variant="subtle" title="Description" icon="i-lucide-text">
                  {{ currentParticipant.team.description || "Aucune description fournie." }}
                </UPageCard>
                <UPageCard variant="subtle" title="Idée" icon="i-lucide-lightbulb">
                  {{ currentParticipant.team.idea || "Aucune idée fournie." }}
                </UPageCard>
                <UPageCard variant="subtle" title="Code d'invitation" icon="i-lucide-key">
                  <div class="flex items-center gap-2">
                    <p class="font-mono text-lg truncate w-1/4" :title="currentParticipant.team.token">
                      {{ currentParticipant.team.token }}
                    </p>
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
            <ParticipantTeamStatusCard :participant="currentParticipant"/>
            <ParticipantScheduleCard/>
          </div>
          <UTable :columns :data="currentParticipant.team.members" class="col-span-full">
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
