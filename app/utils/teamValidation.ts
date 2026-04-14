import type { CurrentParticipantTeam, ReadableTeam, ReadableTeamMember, SubmissionRequest } from "#shared/utils/types";
import { CautionStatus } from "#shared/utils/types";

export const TEAM_MINIMUM_MEMBERS = 2;

export const teamValidationSeverityOrder = {
  info: 0,
  warning: 1,
  error: 2,
} as const;

export type TeamValidationSeverity = keyof typeof teamValidationSeverityOrder;

export type TeamValidationIssueCode =
  | "minimum_members"
  | "uncleared_caution"
  | "missing_required_submissions";

export type TeamValidationIssue = {
  code: TeamValidationIssueCode;
  severity: TeamValidationSeverity;
  message: string;
  description?: string;
};

type TeamValidationContext = {
  team: ReadableTeam;
  submissionRequests?: SubmissionRequest[] | null;
  addIssue: (issue: TeamValidationIssue) => void;
};

type TeamValidationCheck = (context: TeamValidationContext) => void;

export type TeamValidationResult = {
  issues: TeamValidationIssue[];
  highestSeverity: TeamValidationSeverity;
  isValid: boolean;
};

const isCurrentParticipantTeam = (team: ReadableTeam): team is CurrentParticipantTeam => {
  const firstMember = team.members[0];
  return !firstMember || "submissions" in firstMember;
};

const formatMemberNames = (members: ReadableTeamMember[]) => {
  const names = members.map((member) => `${member.user.firstName} ${member.user.lastName}`);

  if (names.length <= 3) {
    return names.join(", ");
  }

  return `${names.slice(0, 3).join(", ")} et ${names.length - 3} autre(s)`;
};

export const isTeamRefunded = (team: ReadableTeam) => {
  return team.members.length > 0 && team.members.every((member) =>
    member.caution === CautionStatus.REFUNDED || member.caution === CautionStatus.WAIVED,
  );
};

const validateTeamCaution: TeamValidationCheck = ({team, addIssue}) => {
  if (team.members.length > 0 && team.members.every((member) => member.caution !== CautionStatus.NOT_PAID)) {
    return;
  }

  addIssue({
    code: "uncleared_caution",
    severity: "error",
    message: "Tous les membres n'ont pas encore réglé leur caution.",
    description: "Votre équipe ne sera validée que lorsque chaque membre aura une caution réglée.",
  });
};

const validateTeamMinimumMembers: TeamValidationCheck = ({team, addIssue}) => {
  if (team.members.length >= TEAM_MINIMUM_MEMBERS) {
    return;
  }

  const missingMembers = TEAM_MINIMUM_MEMBERS - team.members.length;

  addIssue({
    code: "minimum_members",
    severity: "error",
    message: "Votre équipe n'a pas encore atteint le minimum requis.",
    description: `Il manque ${missingMembers} membre(s) pour atteindre le minimum de ${TEAM_MINIMUM_MEMBERS} membres.`,
  });
};

const validateTeamRequiredSubmissions: TeamValidationCheck = ({team, submissionRequests, addIssue}) => {
  if (!submissionRequests?.length || !isCurrentParticipantTeam(team)) {
    return;
  }

  const requiredSubmissionRequests = submissionRequests.filter((request) => request.required);
  if (!requiredSubmissionRequests.length) {
    return;
  }

  // TODO: Add a "team submission request" to avoid every member having to submit the same deliverable, and to simplify this check
  const membersMissingRequiredSubmissions = team.members.filter((member) => {
    const submissionRequestIds = new Set(member.submissions.map((submission) => submission.requestId));
    return requiredSubmissionRequests.some((request) => !submissionRequestIds.has(request.id));
  });

  if (!membersMissingRequiredSubmissions.length) {
    return;
  }

  addIssue({
    code: "missing_required_submissions",
    severity: "warning",
    message: "Certains membres n'ont pas encore soumis tous les livrables requis.",
    description: `Membres concernés : ${formatMemberNames(membersMissingRequiredSubmissions)}.`,
  });
};

const teamValidationChecks: TeamValidationCheck[] = [
  validateTeamCaution,
  validateTeamMinimumMembers,
  validateTeamRequiredSubmissions,
];

export const getTeamValidationIssues = (team: ReadableTeam, submissionRequests?: SubmissionRequest[] | null) => {
  const issues: TeamValidationIssue[] = [];

  const context: TeamValidationContext = {
    team,
    submissionRequests,
    addIssue: (issue) => {
      issues.push(issue);
    },
  };

  for (const check of teamValidationChecks) {
    check(context);
  }

  return issues;
};

export const getHighestTeamValidationSeverity = (issues: TeamValidationIssue[]): TeamValidationSeverity => {
  return issues.reduce<TeamValidationSeverity>((highest, issue) => {
    return teamValidationSeverityOrder[issue.severity] > teamValidationSeverityOrder[highest] ? issue.severity : highest;
  }, "info");
};

export const getTeamValidationResult = (team: ReadableTeam, submissionRequests?: SubmissionRequest[] | null): TeamValidationResult => {
  const issues = getTeamValidationIssues(team, submissionRequests);

  return {
    issues,
    highestSeverity: getHighestTeamValidationSeverity(issues),
    isValid: !issues.some((issue) => issue.severity === "error"),
  };
};

export const isTeamValid = (team: ReadableTeam) => {
  return getTeamValidationResult(team).isValid;
};
