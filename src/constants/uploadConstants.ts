export interface CategoryOption {
  id: string;
  value: string;
  label: string;
}

export type LevelKey = "L1" | "L2" | "L3" | "M1" | "M2";

export interface YearOption {
  id: number;
  value: LevelKey;
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
    icon: "📗",
  },
  {
    id: "td",
    value: "td",
    label: "TD/EXAMEN",
    icon: "📝",
  },
  {
    id: "documentation",
    value: "doc",
    label: "Documentation",
    icon: "📄",
  },
];

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
    { value: "THP", label: "Théorie de Projet" },
    { value: "HCA", label: "Histoire Critique d'Architecture" },
    { value: "GE", label: "Géométrie de l’Espace" },
    { value: "TMC", label: "Technologie des Matériaux de Construction" },
    { value: "Maths", label: "Mathématiques" },
  ],
  L2: [
    { value: "ASC", label: "Analyse spatiale et cartographie" },
    { value: "HA", label: "Histoire Critique d'Architecture" },
    { value: "RDM", label: "Résistance des Matériaux" },
    { value: "CONST", label: "Construction" },
    { value: "DAO", label: "Dessin Assisté par Ordinateur" },
    { value: "SAE", label: "Sociologie et anthropologie de l’espace" },
    { value: "THP", label: "Théorie de Projet" },
  ],
  L3: [
    { value: "STR", label: "Structure" },
    { value: "SP", label: "Stage Pratique" },
    { value: "EQ", label: "Equipement" },
    { value: "M.S", label: "Modelisation et Simulation" },
    { value: "THP", label: "Théorie de Projet" },
    { value: "HCA", label: "Histoire Critique d'Architecture" },
    { value: "GUH", label: "Géographie urbaine et de l’habitat" },
    { value: "UD", label: "Urban Design" },
  ],
  M1: [
    {
      value: "HA",
      label: "Histoire de l'Architecture Algérie XIXe- XXe siècles",
    },
    { value: "STR", label: "Structure" },
    { value: "LOS", label: "Logiciels Open Source" },
    { value: "EQ", label: "Equipement - Acoustique" },
    { value: "MOO", label: "Maitise d'oeuvre maitrise d'ouvrage" },
    { value: "PUA", label: "Programmation urbaine et architecturale" },
  ],
  M2: [
    { value: "HPV", label: "HABITAT ET POLITIQUES DE LA VILLE" },
    { value: "AU", label: "ARCHITECTURE URBAINE" },
    { value: "C. ACTU", label: "Séminaire sur l’actualité architecturale" },
    { value: "AET", label: "ARCHITECTURE ENVIRONNEMENT ET TECHNOLOGIES" },
    { value: "PBAU", label: "PATRIMOINE BÂTI ARCHITECTURAL ET URBAIN" },
  ],
};
