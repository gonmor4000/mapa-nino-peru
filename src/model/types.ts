export type BuildingType = 'ancien' | 'moderne';
export type ReportMode = 'exhaustif' | 'ancien' | 'moderne';

export type Project = {
  id: string;
  name: string;
  address: string;
  file_number: string;
  construction_year: string;
  lot_count: string;
  building_type: BuildingType;
  report_mode: ReportMode;
  visit_dates: string;
  created_at: string;
  updated_at: string;
};

export type Actor = {
  id: string;
  project_id: string;
  role: string;
  name: string;
  company: string;
  contact: string;
};

export type Level = {
  id: string;
  project_id: string;
  name: string;
  position: number;
  /** File name inside the project's folder, or null when no plan is attached yet. */
  plan_file: string | null;
  plan_width: number | null;
  plan_height: number | null;
};

export const ACTOR_ROLES = [
  'Syndic',
  'Conseil syndical',
  'Architecte',
  'BET',
  'Ingénieur thermicien',
  'Autre',
] as const;

export const REPORT_MODES: { value: ReportMode; label: string }[] = [
  { value: 'exhaustif', label: 'Exhaustif (référentiel complet)' },
  { value: 'ancien', label: 'Bâtiment ancien' },
  { value: 'moderne', label: 'Bâtiment moderne' },
];

export const DEFAULT_LEVEL_NAMES = ['Sous-sol', 'RDC', 'R+1', 'R+2', 'R+3', 'Toiture'];
