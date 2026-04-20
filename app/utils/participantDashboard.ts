import type { ButtonProps } from "@nuxt/ui";
import type { BadgeProps } from "#ui/components/Badge.vue";

export type DashboardMetricTone = "primary" | "success" | "warning" | "error" | "neutral";

export interface DashboardEventPhase {
  label: string;
  description: string;
  color: BadgeProps["color"];
  icon: string;
}

export interface DashboardProfileStatus {
  missingSignals: string[];
  progress: number;
}

export interface DashboardTeamStatus {
  hasTeam: boolean;
  value: string;
  progress: number;
  summary: string;
  validation: ReturnType<typeof getTeamValidationResult> | null;
}

export interface DashboardSchedulePreview {
  spotlight: ScheduleItem | null;
  secondaryItems: ScheduleItem[];
}

export interface DashboardSubmissionEntry {
  request: SubmissionRequest;
  completed: boolean;
  overdue: boolean;
}

export interface DashboardSubmissionStatus {
  entries: DashboardSubmissionEntry[];
  completedCount: number;
  incompleteEntries: DashboardSubmissionEntry[];
  overdueCount: number;
  nextDeadline: DashboardSubmissionEntry | null;
  progress: number;
}

export interface DashboardCautionStatus {
  value: string;
  summary: string;
  progress: number;
  tone: DashboardMetricTone;
  isPending: boolean;
}

export type DashboardMetric = {
  title: string;
  value: string;
  description: string;
  icon: string;
  progress?: number;
  progressClass: string;
  iconClass: string;
  showProgress?: boolean;
};

export type DashboardTask = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: "primary" | "success" | "warning" | "error" | "neutral";
  badge: string;
  actions: ButtonProps[];
};

const dashboardMetricToneClasses = {
  primary: {
    progressClass: "bg-primary",
    iconClass: "bg-primary/10 text-primary ring ring-inset ring-primary/20",
  },
  success: {
    progressClass: "bg-green-500",
    iconClass: "bg-green-500/10 text-green-600 ring ring-inset ring-green-500/20",
  },
  warning: {
    progressClass: "bg-orange-500",
    iconClass: "bg-orange-500/10 text-orange-600 ring ring-inset ring-orange-500/20",
  },
  error: {
    progressClass: "bg-red-500",
    iconClass: "bg-red-500/10 text-red-600 ring ring-inset ring-red-500/20",
  },
  neutral: {
    progressClass: "bg-neutral-400",
    iconClass: "bg-neutral/10 text-muted ring ring-inset ring-default",
  },
} satisfies Record<DashboardMetricTone, Pick<DashboardMetric, "progressClass" | "iconClass">>;

export function getDashboardMetricToneClasses(tone: DashboardMetricTone): Pick<DashboardMetric, "progressClass" | "iconClass"> {
  return dashboardMetricToneClasses[tone];
}
