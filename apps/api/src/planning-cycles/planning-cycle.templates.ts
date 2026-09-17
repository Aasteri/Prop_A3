import { PlanningCycleKind } from '@prisma/client';

export type ChecklistTemplateItem = { item: string; done: boolean; notes: string };

export const PLANNING_CYCLE_TEMPLATES: Record<
  PlanningCycleKind,
  {
    kind: PlanningCycleKind;
    title: string;
    focus: string;
    objective: string;
    slogan: string;
    checklist: ChecklistTemplateItem[];
  }
> = {
  DAILY: {
    kind: PlanningCycleKind.DAILY,
    title: 'Daily planning',
    focus: "Today's work execution",
    objective: 'Ensure daily tasks are completed safely, on time, and with quality.',
    slogan: 'Plan Your Work, Work Your Plan',
    checklist: [
      { item: 'Review daily work targets with the team', done: false, notes: '' },
      {
        item: 'Check manpower, materials, tools & equipment availability',
        done: false,
        notes: '',
      },
      { item: 'Discuss site constraints & solutions', done: false, notes: '' },
      { item: 'Ensure safety briefing (TBT) is done', done: false, notes: '' },
      { item: 'Monitor work progress throughout the day', done: false, notes: '' },
      { item: 'Record progress, issues & rectifications', done: false, notes: '' },
      { item: 'Daily clean-up & housekeeping', done: false, notes: '' },
    ],
  },
  WEEKLY: {
    kind: PlanningCycleKind.WEEKLY,
    title: 'Weekly planning',
    focus: 'Short term coordination',
    objective: 'Coordinate resources and activities to meet weekly targets.',
    slogan: 'Coordinate Today, Complete On Time',
    checklist: [
      { item: 'Review and update lookahead plan (2–6 weeks)', done: false, notes: '' },
      { item: 'Break down weekly targets into daily activities', done: false, notes: '' },
      { item: 'Check material requirement and indents', done: false, notes: '' },
      { item: 'Review manpower deployment & productivity', done: false, notes: '' },
      { item: 'Coordinate with subcontractors & consultants', done: false, notes: '' },
      { item: 'Review drawings, approvals & inspections', done: false, notes: '' },
      { item: 'Identify risks and plan mitigation', done: false, notes: '' },
    ],
  },
  MONTHLY: {
    kind: PlanningCycleKind.MONTHLY,
    title: 'Monthly planning',
    focus: 'Long term control & forecasting',
    objective: 'Plan ahead for resources, budgets, and milestones.',
    slogan: 'Plan Ahead, Stay Ahead',
    checklist: [
      { item: 'Review overall project schedule & milestones', done: false, notes: '' },
      { item: 'Prepare/Update Monthly Work Plan', done: false, notes: '' },
      {
        item: 'Estimate material, manpower & equipment for the month',
        done: false,
        notes: '',
      },
      { item: 'Review budget, cash flow & commitments', done: false, notes: '' },
      {
        item: 'Monitor progress vs plan & take corrective actions',
        done: false,
        notes: '',
      },
      { item: 'Review risks, approvals & dependencies', done: false, notes: '' },
      { item: 'Management review meeting & reporting', done: false, notes: '' },
    ],
  },
};

export function defaultChecklistFor(kind: PlanningCycleKind): ChecklistTemplateItem[] {
  return PLANNING_CYCLE_TEMPLATES[kind].checklist.map((c) => ({ ...c }));
}
