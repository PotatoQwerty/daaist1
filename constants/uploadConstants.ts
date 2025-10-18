export interface CategoryOption {
  id: string;
  value: string;
  label: string;
}

export interface YearOption {
  id: number;
  value: string;
  label: string;
}

export interface SubjectOption {
  value: string;
  label: string;
}
export const categoryOptions = [
  {
    id: "course",
    value: "course",
    label: "Course",
  },
  {
    id: "td",
    value: "td",
    label: "TD/EXAMEN",
  },
  {
    id: "documentation",
    value: "doc",
    label: "Documentation",
  },
];

export type LevelKey = "L1" | "L2" | "L3" | "M1" | "M2";

export const yearOptions: YearOption[] = [
  { id: 1, value: "L1", label: "1st year (L1)" },
  { id: 2, value: "L2", label: "2nd year (L2)" },
  { id: 3, value: "L3", label: "3rd year (L3)" },
  { id: 4, value: "M1", label: "4th year (M1)" },
  { id: 5, value: "M2", label: "5th year (M2)" },
];
export type SubjectOptions = Record<string, SubjectOption[]>;
export const subjectOptions: Record<
  LevelKey,
  { value: string; label: string }[]
> = {
  L1: [
    { value: "HCA", label: "HCA" },
    { value: "GE", label: "GE" },
    { value: "THP", label: "THP" },
    { value: "TMC", label: "TMC" },
    { value: "TR", label: "TR" },
    { value: "Maths", label: "Maths" },
    { value: "Physics", label: "Physics" },
  ],
  L2: [
    { value: "AH", label: "AH" },
    { value: "AS", label: "AS" },
    { value: "CAO", label: "CAO" },
    { value: "Construction", label: "Construction" },
    { value: "GH", label: "GH" },
    { value: "HCA", label: "HCA" },
    { value: "RDM", label: "RDM" },
    { value: "THP", label: "THP" },
    { value: "TR", label: "TR" },
  ],
  L3: [
    { value: "BIM", label: "BIM" },
    { value: "Equipement", label: "Equipement" },
    { value: "HCA", label: "HCA" },
    { value: "Structure", label: "Structure" },
    { value: "IU", label: "IU" },
    { value: "THP", label: "THP" },
  ],
  M1: [
    { value: "HCA", label: "HCA" },
    { value: "RDM", label: "RDM" },
    { value: "Construction", label: "Construction" },
    { value: "THP", label: "THP" },
    { value: "AS", label: "AS" },
  ],
  M2: [
    { value: "HCA", label: "HCA" },
    { value: "RDM", label: "RDM" },
    { value: "Construction", label: "Construction" },
    { value: "THP", label: "THP" },
    { value: "AS", label: "AS" },
  ],
};
