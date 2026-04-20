<script setup lang="ts">
import { ParticipantCreateTeamModal, ParticipantEditModal, ParticipantJoinTeamModal } from "#components";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Accueil",
    },
  },
  middleware: "participant-auth",
});

const [
  {status: participantStatus, data: currentParticipant, refresh: refreshCurrentParticipant},
  {data: settings},
  {data: schedule},
  {data: submissionRequests},
] = await Promise.all([
  useCurrentParticipant(),
  useSettings(),
  useSchedule({lazy: false}),
  useSubmissionsRequests({lazy: false}),
]);

const {can} = useAbility(currentParticipant);
const overlay = useOverlay();
const dayjs = useDayjs();
const {copyWithToast} = useCopyWithToast();

const createTeamModal = overlay.create(ParticipantCreateTeamModal);
const joinTeamModal = overlay.create(ParticipantJoinTeamModal);
const editProfileModal = overlay.create(ParticipantEditModal);

const canCreateTeam = computed(() => can("createOwn", "Team"));
const canJoinTeam = computed(() => can("join", "Team"));
const canUpdateProfile = computed(() => can("updateOwn", "Participant"));
//const canReadTeams = computed(() => can("read", "Team"));

const discordLink = computed(() => settings.value?.socialLinks.find((link) => link.type === "DISCORD"));

const listFormatter = new Intl.ListFormat("fr", {style: "long", type: "conjunction"});
const formatList = (items: string[]) => listFormatter.format(items);

const openCreateTeamModal = async () => {
  if (!canCreateTeam.value) return;

  const result = await createTeamModal.open();
  if (result) await refreshCurrentParticipant();
};
const openJoinTeamModal = async () => {
  if (!canJoinTeam.value) return;

  const result = await joinTeamModal.open();
  if (result) await refreshCurrentParticipant();
};
const openEditProfileModal = async () => {
  if (!currentParticipant.value || !canUpdateProfile.value) return;

  const result = await editProfileModal.open({participant: currentParticipant.value});
  if (result) await refreshCurrentParticipant();
};

const copyAddress = () => {
  const event = settings.value?.event;
  if (!event) return;

  copyWithToast(
      [event.locationName, event.locationAddress].join(", "),
      {
        title: "Adresse copiée",
        description: "L'adresse de l'événement a été copiée dans le presse-papier.",
      },
  );
};
const copyTeamToken = () => {
  if (!currentParticipant.value?.team) return;

  copyWithToast(
      currentParticipant.value.team.token,
      {
        title: "Code d'invitation copié",
        description: "Le code d'invitation de l'équipe a été copié dans le presse-papier.",
      },
  );
};

const eventDateLabel = computed(() => {
  const event = settings.value?.event;
  if (!event) return null;

  return formatDateRange(event.startDate, event.endDate, false);
});
const eventPhase = computed<DashboardEventPhase>(() => {
  const event = settings.value?.event;
  if (!event) {
    return {
      label: "Tableau de bord participant",
      description: "Retrouvez ici les informations utiles pour préparer votre participation.",
      color: "neutral",
      icon: "i-lucide-layout-dashboard",
    };
  }

  const start = dayjs(event.startDate);
  const end = dayjs(event.endDate);
  const now = dayjs();

  if (now.isBefore(start)) {
    const daysUntilStart = start.startOf("day").diff(now.startOf("day"), "day");

    if (daysUntilStart <= 0) {
      return {
        label: "Ouverture aujourd'hui",
        description: `Le hackathon démarre aujourd'hui à ${start.format("H[h]mm")}.`,
        color: "warning",
        icon: "i-lucide-rocket",
      };
    }

    if (daysUntilStart === 1) {
      return {
        label: "Ouverture demain",
        description: `Rendez-vous demain à ${start.format("H[h]mm")} pour le lancement.`,
        color: "warning",
        icon: "i-lucide-hourglass",
      };
    }

    return {
      label: `J-${daysUntilStart}`,
      description: `Le hackathon démarre le ${start.format("DD MMMM")} à ${start.format("H[h]mm")}.`,
      color: "primary",
      icon: "i-lucide-calendar-range",
    };
  }

  if (now.isBefore(end)) {
    return {
      label: "Événement en cours",
      description: `Le hackathon se termine le ${end.format("DD MMMM")} à ${end.format("H[h]mm")}.`,
      color: "success",
      icon: "i-lucide-zap",
    };
  }

  return {
    label: "Édition terminée",
    description: `Merci d'avoir participé à ${event.title}.`,
    color: "neutral",
    icon: "i-lucide-flag",
  };
});

const profileStatus = computed<DashboardProfileStatus>(() => {
  const signals = [
    {
      label: "un profil technique",
      done: !!(currentParticipant.value!.githubAccount || currentParticipant.value!.linkedInAccount),
    },
    {
      label: "votre établissement",
      done: !!currentParticipant.value!.school,
    },
    {
      label: "votre CV",
      done: !!currentParticipant.value!.curriculumVitae,
    },
  ];

  const missingSignals = signals
      .filter((signal) => !signal.done)
      .map((signal) => signal.label);

  return {
    missingSignals,
    progress: signals.length
        ? Math.round(signals.filter((signal) => signal.done).length / signals.length * 100)
        : 100,
  };
});

const teamStatus = computed<DashboardTeamStatus>(() => {
  const team = currentParticipant.value?.team;
  if (!team) {
    return {
      hasTeam: false,
      value: "Solo",
      progress: 0,
      summary: `Créez ou rejoignez une équipe. Le minimum requis est de ${TEAM_MINIMUM_MEMBERS} membres.`,
      validation: null,
    };
  }

  const validation = getTeamValidationResult(team, submissionRequests.value);

  return {
    hasTeam: true,
    value: `${team.members.length} membre${team.members.length > 1 ? "s" : ""}`,
    progress: validation.isValid ? 100 : 60,
    summary: validation.issues.length
        ? validation.issues[0]!.message
        : "Votre équipe remplit actuellement les conditions de validation.",
    validation,
  };
});

const schedulePreview = computed<DashboardSchedulePreview>(() => {
  const now = dayjs();

  const sortedItems = sortScheduleItems(schedule.value);
  const spotlight = findLiveScheduleItem(sortedItems, now.toDate()) ??
      sortedItems.find((item) => dayjs(item.startTime).isAfter(now)) ??
      null;
  const secondaryItems = sortedItems
      .filter((item) => dayjs(item.endTime).isSameOrAfter(now))
      .filter((item) => item.id !== spotlight?.id)
      .slice(0, 3);

  return {
    spotlight,
    secondaryItems,
  };
});

const submissionStatus = computed<DashboardSubmissionStatus>(() => {
  const participant = currentParticipant.value;

  const now = dayjs();
  const entries: DashboardSubmissionEntry[] = (submissionRequests.value ?? []).map((request) => {
    const completed = request.teamRequest
        ? Boolean(
            participant?.team?.members.some((member) =>
                member.submissions.some((submission) => submission.requestId === request.id),
            ),
        )
        : Boolean(participant?.submissions.some((submission) => submission.requestId === request.id));

    return {
      request,
      completed,
      overdue: !completed && dayjs(request.deadline).isBefore(now),
    };
  });

  const completedCount = entries.filter((entry) => entry.completed).length;
  const incompleteEntries = entries.filter((entry) => !entry.completed);
  const overdueCount = incompleteEntries.filter((entry) => entry.overdue).length;
  const nextDeadline = [...incompleteEntries]
      .sort((left, right) => dayjs(left.request.deadline).valueOf() - dayjs(right.request.deadline).valueOf())[0] ?? null;

  return {
    entries,
    completedCount,
    incompleteEntries,
    overdueCount,
    nextDeadline,
    progress: entries.length
        ? Math.round(completedCount / entries.length * 100)
        : 100,
  };
});

const cautionStatus = computed<DashboardCautionStatus>(() => {
  const caution = currentParticipant.value?.caution;
  if (!caution) {
    return {
      value: "Indisponible",
      summary: "Statut indisponible.",
      progress: 0,
      tone: "neutral",
      isPending: false,
    };
  }

  if (caution === CautionStatus.NOT_PAID) {
    return {
      value: cautionStatusTranslateMap[caution],
      summary: settings.value?.event.cautionAmount
          ? `Caution en attente: ${settings.value.event.cautionAmount}€ à régler.`
          : "Votre caution n'a pas encore été réglée.",
      progress: 10,
      tone: "error",
      isPending: true,
    };
  }

  if (caution === CautionStatus.REFUNDED) {
    return {
      value: cautionStatusTranslateMap[caution],
      summary: "La caution a déjà été remboursée.",
      progress: 100,
      tone: "success",
      isPending: false,
    };
  }

  if (caution === CautionStatus.WAIVED) {
    return {
      value: cautionStatusTranslateMap[caution],
      summary: "Vous êtes exonéré de caution.",
      progress: 100,
      tone: "success",
      isPending: false,
    };
  }

  return {
    value: cautionStatusTranslateMap[caution],
    summary: "Votre caution est bien enregistrée.",
    progress: 100,
    tone: "success",
    isPending: false,
  };
});

const dashboardMetrics = computed<DashboardMetric[]>(() => [
  {
    title: "Profil",
    value: `${profileStatus.value.progress}%`,
    description: profileStatus.value.missingSignals.length
        ? `Il manque ${formatList(profileStatus.value.missingSignals)}.`
        : "Les informations utiles sont déjà renseignées.",
    icon: "i-lucide-user-round-check",
    progress: profileStatus.value.progress,
    ...getDashboardMetricToneClasses("primary"),
  },
  {
    title: "Équipe",
    value: teamStatus.value.value,
    description: teamStatus.value.summary,
    icon: "i-lucide-users",
    progress: teamStatus.value.progress,
    ...getDashboardMetricToneClasses(teamStatus.value.hasTeam ? "primary" : "neutral"),
  },
  {
    title: "Livrables",
    value: submissionStatus.value.entries.length
        ? `${submissionStatus.value.completedCount}/${submissionStatus.value.entries.length}`
        : "Aucun",
    description: submissionStatus.value.entries.length === 0
        ? "Aucun livrable n'est demandé pour l'instant."
        : submissionStatus.value.overdueCount
            ? `${submissionStatus.value.overdueCount} livrable(s) en retard.`
            : submissionStatus.value.nextDeadline
                ? `Prochaine échéance: ${submissionStatus.value.nextDeadline.request.title}.`
                : "Tous les livrables visibles sont transmis.",
    icon: "i-lucide-files",
    progress: submissionStatus.value.progress,
    ...getDashboardMetricToneClasses(submissionStatus.value.progress === 100 ? "primary" : "warning"),
  },
  {
    title: "Caution",
    value: cautionStatus.value.value,
    description: cautionStatus.value.summary,
    icon: "i-lucide-wallet",
    progress: cautionStatus.value.progress,
    ...getDashboardMetricToneClasses(cautionStatus.value.tone),
  },
]);

const priorityItems = computed<DashboardTask[]>(() => {
  const items: DashboardTask[] = [];

  if (!teamStatus.value.hasTeam) {
    items.push({
      id: "team",
      title: "Former une équipe",
      description: `Le minimum requis est de ${TEAM_MINIMUM_MEMBERS} membres. Créez une équipe ou rejoignez-en une pour débloquer la suite.`,
      icon: "i-lucide-users-round",
      color: "error",
      badge: "Bloquant",
      actions: [{
        label: "Créer",
        icon: "i-lucide-plus",
        color: "primary",
        onClick: openCreateTeamModal,
        disabled: !canCreateTeam.value,
      }, {
        label: "Rejoindre",
        icon: "i-lucide-user-plus",
        color: "neutral",
        variant: "soft",
        onClick: openJoinTeamModal,
        disabled: !canJoinTeam.value,
      }],
    });
  } else if (teamStatus.value.validation?.issues.length) {
    items.push({
      id: "team-health",
      title: "Corriger l'état de l'équipe",
      description: teamStatus.value.validation.issues[0]!.description || teamStatus.value.validation.issues[0]!.message,
      icon: "i-lucide-shield-alert",
      color: teamStatus.value.validation.isValid ? "warning" : "error",
      badge: teamStatus.value.validation.isValid ? "À surveiller" : "À corriger",
      actions: [{
        label: "Voir l'équipe",
        icon: "i-lucide-arrow-right",
        color: "primary",
        to: "/participant/team",
      }],
    });
  }

  if (cautionStatus.value.isPending) {
    items.push({
      id: "caution",
      title: "Régler la caution",
      description: settings.value?.event.cautionAmount
          ? `Le montant attendu est de ${settings.value.event.cautionAmount}€. Les informations de paiement sont disponibles sur votre profil.`
          : "Les informations de paiement sont disponibles sur votre profil.",
      icon: "i-lucide-credit-card",
      color: "warning",
      badge: "Prioritaire",
      actions: [{
        label: "Voir le profil",
        icon: "i-lucide-wallet",
        color: "primary",
        to: "/participant/profile",
      }],
    });
  }

  if (profileStatus.value.missingSignals.length) {
    items.push({
      id: "profile",
      title: "Compléter le profil",
      description: `Ajoutez ${formatList(profileStatus.value.missingSignals)} pour rendre votre profil plus utile à l'organisation et aux coéquipiers.`,
      icon: "i-lucide-id-card",
      color: "primary",
      badge: "Recommandé",
      actions: [{
        label: "Modifier",
        icon: "i-lucide-user-pen",
        color: "primary",
        onClick: openEditProfileModal,
        disabled: !canUpdateProfile.value,
      }],
    });
  }

  if (submissionStatus.value.incompleteEntries.length) {
    items.push({
      id: "submissions",
      title: "Finaliser les livrables",
      description: submissionStatus.value.overdueCount
          ? `${submissionStatus.value.overdueCount} livrable(s) sont en retard.`
          : submissionStatus.value.nextDeadline
              ? `Prochaine échéance: ${submissionStatus.value.nextDeadline.request.title} le ${dayjs(submissionStatus.value.nextDeadline.request.deadline).format("DD MMMM à H[h]mm")}.`
              : "Des livrables restent à compléter.",
      icon: "i-lucide-send",
      color: submissionStatus.value.overdueCount ? "error" : "warning",
      badge: submissionStatus.value.overdueCount ? "Urgent" : "À faire",
      actions: [{
        label: "Ouvrir les livrables",
        icon: "i-lucide-arrow-right",
        color: "primary",
        to: "/participant/submit",
      }],
    });
  }

  return items;
});
</script>

<template>
  <UContainer class="space-y-6 lg:space-y-8">
    <template v-if="participantStatus !== 'success'">
      <div class="grid gap-6">
        <USkeleton class="h-64 rounded-2xl"/>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <USkeleton v-for="n in 4" :key="`metric-skeleton-${n}`" class="h-40 rounded-2xl"/>
        </div>
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <USkeleton class="h-112 rounded-2xl"/>
          <div class="grid gap-6">
            <USkeleton class="h-80 rounded-2xl"/>
            <USkeleton class="h-72 rounded-2xl"/>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="currentParticipant">
      <UCard variant="subtle" :ui="{body: 'p-6 lg:p-7'}">
        <div class="grid gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge :color="eventPhase.color" variant="solid">
              <UIcon :name="eventPhase.icon" class="mr-1.5 size-3.5"/>
              {{ eventPhase.label }}
            </UBadge>
            <UBadge v-if="eventDateLabel" color="neutral" variant="soft">
              <UIcon name="i-lucide-calendar-days" class="mr-1.5 size-3.5"/>
              {{ eventDateLabel }}
            </UBadge>
          </div>

          <div class="grid gap-2">
            <h1 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
              Bonjour {{ currentParticipant.user.firstName }}
            </h1>
            <p class="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
              {{ eventPhase.description }}
            </p>
          </div>
        </div>
      </UCard>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ParticipantDashboardMetricCard v-for="metric in dashboardMetrics" :key="metric.title" :metric="metric"/>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
        <UCard :ui="{body: 'p-6 lg:p-7'}">
          <div class="grid gap-6">
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-primary/80">À faire maintenant</p>
              <h2 class="text-2xl font-semibold tracking-tight text-highlighted">
                Votre liste de priorités
              </h2>
            </div>

            <div v-if="priorityItems.length" class="grid gap-4">
              <ParticipantDashboardTaskCard v-for="item in priorityItems" :key="item.id" :task="item"/>
            </div>

            <UAlert v-else color="success" variant="soft" icon="i-lucide-circle-check-big"
                    title="Aucun point bloquant"
                    description="Votre espace participant est à jour pour l'instant. Gardez simplement un œil sur le programme."/>
          </div>
        </UCard>

        <div class="grid gap-6 xl:self-start">
          <ParticipantDashboardScheduleCard :spotlight="schedulePreview.spotlight"
                                            :secondary-items="schedulePreview.secondaryItems"/>

          <UCard :ui="{body: 'p-6'}">
            <div class="grid gap-5">
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase tracking-wide text-primary/80">Infos utiles</p>
                <h2 class="text-2xl font-semibold text-highlighted">Raccourcis à garder sous la main</h2>
              </div>

              <div class="grid gap-3">
                <UPageCard title="Lieu" icon="i-lucide-map-pinned" variant="subtle">
                  <template #description>
                    <div class="grid gap-3">
                      <p class="text-sm leading-relaxed text-muted">
                        {{ settings?.event.locationName || "Lieu à confirmer" }}<br>
                        {{ settings?.event.locationAddress || "Adresse non disponible pour le moment." }}
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-copy" @click="copyAddress">
                          Copier l'adresse
                        </UButton>
                        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-map-pinned" to="/infos">
                          Voir les détails
                        </UButton>
                      </div>
                    </div>
                  </template>
                </UPageCard>

                <UPageCard title="Contact organisation" icon="i-lucide-message-circle" variant="subtle">
                  <template #description>
                    <div class="grid gap-3">
                      <p class="text-sm leading-relaxed text-muted">
                        Nous sommes à votre disposition sur le Discord du Hackathon ou par mail.
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <UButton v-if="discordLink"
                                 color="neutral" variant="soft" size="sm"
                                 :icon="discordLink.icon" :to="discordLink.url" target="_blank">
                          {{ discordLink.label }}
                        </UButton>
                        <UButton v-if="settings?.website.contactEmail"
                                 color="neutral" variant="soft" size="sm" icon="i-lucide-at-sign"
                                 :to="`mailto:${settings.website.contactEmail}`">
                          Envoyer un e-mail
                        </UButton>
                      </div>
                    </div>
                  </template>
                </UPageCard>

                <UPageCard title="Équipe" icon="i-lucide-users" variant="subtle">
                  <template #description>
                    <div v-if="currentParticipant.team" class="grid gap-3">
                      <div>
                        <p class="text-base leading-relaxed font-medium">
                          {{ currentParticipant.team.name }}
                        </p>
                        <p class="text-sm leading-relaxed text-muted">
                          Code d'invitation :
                          <span class="font-mono text-highlighted">
                            {{ currentParticipant.team.token }}
                          </span>
                        </p>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-copy" @click="copyTeamToken">
                          Copier le code
                        </UButton>
                        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-user-check"
                                 to="/participant/team">
                          Gérer l'équipe
                        </UButton>
                      </div>
                    </div>

                    <div v-else class="grid gap-3">
                      <p class="text-sm leading-relaxed text-muted">
                        Vous n'avez pas encore d'équipe. C'est le principal point à débloquer pour avancer.
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <UButton icon="i-lucide-plus" size="sm" :disabled="!canCreateTeam" @click="openCreateTeamModal">
                          Créer une équipe
                        </UButton>
                        <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-user-plus"
                                 :disabled="!canJoinTeam" @click="openJoinTeamModal">
                          Rejoindre
                        </UButton>
                      </div>
                    </div>
                  </template>
                </UPageCard>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>
