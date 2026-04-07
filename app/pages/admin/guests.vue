<script setup lang="ts">
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { UBadge, UButton, UDropdownMenu } from "#components";
import CreateModal from "~/components/admin/guests/CreateModal.vue";
import EditModal from "~/components/admin/guests/EditModal.vue";
import RemoveModal from "~/components/admin/guests/RemoveModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
  requiredPermissions: ["guests.read"],
});

const {status, data: guests, refresh} = await useGuests({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {renderGuestBadge} = useGuestsActions();
const {can} = useAbility(currentAdmin);

const dayjs = useDayjs();
const overlay = useOverlay();
const toast = useToast();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const globalFilter = useSearchQuery();

const guestTypeItems = Object.values(GuestType).map((type) => ({
  label: translateGuestType(type),
  value: translateGuestType(type),
}));
const companyItems = computed(() => {
  return [...new Set((guests.value ?? []).map((guest) => guest.company || "Aucune"))]
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((company) => ({
        label: company,
        value: company,
      }));
});

const columns: NamedTableColumn<Guest>[] = [
  {
    id: "expand",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => {
      if (!row.original.imageUrl) {
        return null;
      }

      return getRowExpandButton(
          row,
          "Réduire l'image de l'invité",
          "Développer l'image de l'invité",
      );
    },
  },
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorKey: "name",
  },
  {
    id: "type",
    name: "Type",
    header: ({column}) => getSingleSelectFilterHeader(column, "Type", guestTypeItems),
    accessorFn: (row) => translateGuestType(row.type),
    filterFn: "equalsString",
    cell: ({row}) => {
      return h(UBadge, {
        class: "capitalize",
        variant: "subtle",
        color: "neutral",
      }, () => translateGuestType(row.original.type));
    },
  },
  {
    id: "company",
    name: "Entreprise",
    header: ({column}) => getSingleSelectFilterHeader(column, "Entreprise", companyItems.value),
    accessorFn: (row) => row.company || "Aucune",
    filterFn: "equalsString",
    cell: ({row}) => row.original.company || "Aucune",
  },
  {
    id: "quantity",
    name: "Badges",
    header: ({column}) => getStrSortedHeader(column, "Badges"),
    accessorFn: (row) => row.quantity,
    enableGlobalFilter: false,
    cell: ({row}) => h("span", {
      class: row.original.quantity > 1 ? "text-highlighted" : undefined,
    }, row.original.quantity),
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
                "aria-label": `Actions pour l'invité ${row.original.name}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'invité ${row.original.name}`,
              }),
          ),
      );
    },
  },
];

function getRowItems(row: Row<Guest>): Array<DropdownMenuItem> {
  const canUpdateGuest = can("update", "Guest");
  const canDeleteGuest = can("delete", "Guest");
  const canPrintBadge = can("print", "Badge");

  return [
    {
      type: "label",
      label: `Ajouté le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Éditer l'invité",
      icon: "i-lucide-edit-2",
      disabled: !canUpdateGuest,
      onSelect: async () => {
        if (!canUpdateGuest) return;
        const result = await editModal.open({guest: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer l'invité",
      icon: "i-lucide-trash-2",
      disabled: !canDeleteGuest,
      onSelect: async () => {
        if (!canDeleteGuest) return;
        const result = await removeModal.open({guest: row.original});
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
          const badge = await renderGuestBadge(row.original);
          downloadBlob(badge, `badge-${row.original.name}.pdf`);
        } catch {
          toast.add({
            title: "Erreur",
            description: "Impossible de générer le badge.",
            color: "error",
          });
        }
      },
    }];
}

async function openCreateModal() {
  if (!can("create", "Guest")) return;

  const result = await createModal.open();
  if (result) {
    await refresh();
  }
}

const expanded = ref({});
const columnVisibility = usePersistentColumnVisibility("admin-guests-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Invités">
        <template #right>
          <UButton icon="i-lucide-user-plus" :disabled="!can('create', 'Guest')" @click="openCreateModal">Ajouter
          </UButton>
        </template>
      </DashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
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
            <UTable v-model:expanded="expanded" v-model:global-filter="globalFilter"
                    v-model:column-visibility="columnVisibility" :columns="columns" :data="guests" sticky
                    :loading="status === 'pending'" :ui="{tr: 'data-[expanded=true]:bg-elevated/50'}">
              <template #empty>
                <div class="max-w-1/2 mx-auto">
                  <UEmpty title="Aucun invité"
                          description="Aucun invité n'est encore enregistré pour l'événement."
                          icon="i-lucide-circle-slash"/>
                </div>
              </template>
              <template #expanded="{row}">
                <div v-if="row.original.imageUrl" class="flex justify-center p-4">
                  <NuxtImg :src="row.original.imageUrl" :alt="`Image de ${row.original.name}`"
                           class="max-h-80 w-fit object-contain rounded-lg"/>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
