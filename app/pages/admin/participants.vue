<script setup lang="ts">
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
// TODO: uniformize import paths throughout modals
import {
  AdminParticipantCautionModal,
  AdminParticipantsRemoveModal,
  ParticipantEditModal,
  UBadge,
  UButton,
  UCheckbox,
  UDropdownMenu,
} from "#components";
import { CautionStatus } from "#shared/utils/types";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
  requiredPermissions: ["participants.read"],
});

const {status, data: participants, refresh} = await useParticipants({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {renderParticipantBadge} = useParticipantsActions();
const {can} = useAbility(currentAdmin);
const canReadSensitiveParticipants = computed(() => can("readSensitive", "Participant"));

const supabase = useSupabaseClient();
const toast = useToast();
const dayjs = useDayjs();
const overlay = useOverlay();

const cautionModal = overlay.create(AdminParticipantCautionModal);
const editModal = overlay.create(ParticipantEditModal);
const removeModal = overlay.create(AdminParticipantsRemoveModal);

const downloadCV = async (participant: AdminParticipant) => {
  if (!participant.curriculumVitae) {
    return;
  }
  const blob = await supabase.storage.from("cvs").download(participant.curriculumVitae);

  if (blob.error || !blob.data) {
    toast.add({
      title: "Erreur",
      description: "Impossible de télécharger le CV.",
      color: "error",
    });
    return;
  }

  downloadBlob(blob.data, participant.curriculumVitae.split("/").pop() || "cv.pdf");
};

const globalFilter = useSearchQuery();
const cautionItems = Object.values(CautionStatus).map((status) => ({
  label: cautionStatusTranslateMap[status],
  value: status,
}));

const allColumns: NamedTableColumn<AdminParticipant>[] = [
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
    meta: getWrappingColumnMeta(),
  },
  {
    id: "email",
    name: "Email",
    header: "Email",
    accessorFn: (row) => row.user.email,
  },
  {
    id: "caution",
    name: "Caution",
    header: ({column}) => getSingleSelectFilterHeader(column, "Caution", cautionItems),
    accessorKey: "caution",
    filterFn: "equalsString",
    enableGlobalFilter: false,
    cell: ({row}) => {
      const val = row.getValue("caution") as CautionStatus;
      let color: BadgeProps["color"] = "neutral";

      if (val === CautionStatus.PAID) color = "success";
      else if (val === CautionStatus.NOT_PAID) color = "error";
      else if (val === CautionStatus.REFUNDED) color = "neutral";
      else if (val === CautionStatus.WAIVED) color = "warning";

      return h(UBadge, {
            variant: "subtle",
            color,
          }, () => cautionStatusTranslateMap[val],
      );
    },
  },
  {
    id: "team",
    name: "Équipe",
    header: ({column}) => getStrSortedHeader(column, "Équipe"),
    accessorFn: (row) => row.team?.name,
    meta: getWrappingColumnMeta(),
  },
  {
    id: "networks",
    name: "Réseaux",
    header: "Réseaux",
    enableGlobalFilter: false,
    meta: {
      class: {
        td: "text-center",
      },
    },
    cell: ({row}) => {
      const github = row.original.githubAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-github",
        external: true,
        to: `https://github.com/${row.original.githubAccount.split("/").pop()}`,
      }) : null;
      const linkedIn = row.original.linkedInAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-linkedin",
        external: true,
        to: `https://linkedin.com/in/${row.original.linkedInAccount.split("/").pop()}`,
      }) : null;
      return h("div", {}, [github, linkedIn]);
    },
  },
  {
    id: "curriculumVitae",
    name: "CV",
    header: "CV",
    accessorKey: "curriculumVitae",
    enableGlobalFilter: false,
    cell: ({row}) => {
      const cvLink = row.getValue("curriculumVitae") as string | null;
      if (cvLink) {
        return h(UButton, {
          variant: "link",
          size: "sm",
          icon: "i-lucide-download",
          onClick: () => downloadCV(row.original),
        });
      }
    },
  },
  {
    id: "school",
    name: "École",
    header: "École",
    accessorKey: "school",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "diet",
    name: "Régime alimentaire",
    header: "Régime alimentaire",
    accessorKey: "diet",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "needs",
    name: "Besoins spéciaux",
    header: "Besoins spéciaux",
    accessorKey: "needs",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "agreements",
    name: "Accords",
    header: "Accords",
    enableGlobalFilter: false,
    cell: ({row}) => {
      const newsletter = h(UCheckbox, {
        label: "Newsletter",
        modelValue: row.original.newsletter ? true : "indeterminate",
        color: row.original.newsletter ? "success" : "error",
        indeterminateIcon: "i-lucide-x",
        disabled: true,
        ui: {base: "cursor-default", label: "cursor-default"},
      });
      const imageAgreement = h(UCheckbox, {
        label: "Droit à l'image",
        modelValue: row.original.imageAgreement ? true : "indeterminate",
        color: row.original.imageAgreement ? "success" : "error",
        indeterminateIcon: "i-lucide-x",
        disabled: true,
        ui: {base: "cursor-default", label: "cursor-default"},
      });
      return h("div", {class: "flex flex-col space-y-2"}, [newsletter, imageAgreement]);
    },
  },
  {
    id: "actions",
    name: "Actions",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => {
      return h(
          "div",
          {class: "text-right"},
          h(
              UDropdownMenu,
              {
                content: {align: "end"},
                items: getRowItems(row),
                "aria-label": `Actions pour l'utilisateur ${row.original.user.firstName} ${row.original.user.lastName}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'utilisateur ${row.original.user.firstName} ${row.original.user.lastName}`,
              }),
          ),
      );
    },
  },
  //{
  //  header: "Inscrit le",
  //  accessorKey: "createdAt",
  //  cell: ({row}) => {
  //    const date = new Date(row.getValue("createdAt") as string);
  //    return date.toLocaleDateString();
  //  },
  //}
];

const sensitiveParticipantColumnIds: readonly string[] = ["diet", "needs", "agreements"] as const;
const columns = computed(() => canReadSensitiveParticipants.value
    ? allColumns
    : allColumns.filter(column => !sensitiveParticipantColumnIds.includes(column.id)));

const columnVisibility = usePersistentColumnVisibility("admin-participants-table-column-visibility", {
  caution: false,
  agreements: false,
});
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

function getRowItems(row: Row<AdminParticipant>): Array<DropdownMenuItem> {
  const canUpdateParticipant = can("updateSensitive", "Participant");
  const canUpdateCaution = can("updateCaution", "Participant");
  const canDeleteParticipant = can("delete", "Participant");
  const canPrintBadge = can("print", "Badge");

  return [
    {
      type: "label",
      label: `Inscrit le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    // TODO: View profile?
    // TODO: Send email actions
    //{
    //  type: "label",
    //  label: "Actions",
    //},
    //{
    //  label: "Voir le profil",
    //  icon: "i-lucide-user",
    //},
    //{
    //  label: "Envoyer un email",
    //  icon: "i-lucide-mail",
    //},
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Gérer la caution",
      icon: "i-lucide-wallet",
      disabled: !canUpdateCaution,
      onSelect: async () => {
        if (!canUpdateCaution) return;
        const result = await cautionModal.open({participant: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Éditer l'utilisateur",
      icon: "i-lucide-edit-2",
      disabled: !canUpdateParticipant,
      onSelect: async () => {
        if (!canUpdateParticipant) return;
        const result = await editModal.open({participant: row.original, adminEdit: true});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer l'utilisateur",
      icon: "i-lucide-trash-2",
      disabled: !canDeleteParticipant,
      onSelect: async () => {
        if (!canDeleteParticipant) return;
        const result = await removeModal.open({participant: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Générer le badge",
      icon: "i-lucide-id-card",
      disabled: !canPrintBadge,
      onSelect: async () => {
        if (!canPrintBadge) return;
        try {
          const badge = await renderParticipantBadge(row.original);
          downloadBlob(badge, `badge-${row.original.user.firstName}-${row.original.user.lastName}.pdf`);
        } catch {
          toast.add({
            title: "Erreur",
            description: "Impossible de générer le badge.",
            color: "error",
          });
        }
      },
    },
  ];
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Utilisateurs"/>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <AdminParticipantStats/>
          <div class="flex flex-col gap-1 lg:gap-2">
            <div v-if="status === 'success'" class="flex justify-between">
              <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."/>
              <TourHelperPopover title="Astuce : colonnes personnalisables"
                                 description="Vous pouvez choisir les colonnes à afficher dans le tableau."
                                 status-key="admin-table-column-visibility" placement="top">
                <UDropdownMenu :items="columnVisibilityDropdownItems" content-class="min-w-40" :content="{align: 'end'}"
                               aria-label="Afficher ou masquer les colonnes">
                  <UButton variant="outline" color="neutral" size="sm" label="Colonnes"/>
                </UDropdownMenu>
              </TourHelperPopover>
            </div>
            <UTable v-model:global-filter="globalFilter" v-model:column-visibility="columnVisibility" :columns="columns"
                    :data="participants" sticky :loading="status === 'pending'">
              <template #empty>
                <div class="max-w-1/2 mx-auto">
                  <UEmpty title="Aucun participant"
                          description="Aucun participant ne s'est encore inscrit à l'événement... Mais ça va arriver !"
                          icon="i-lucide-circle-slash"/>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
