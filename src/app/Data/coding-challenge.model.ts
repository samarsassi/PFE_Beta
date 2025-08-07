export interface CodingChallenge {
  id?: number;
  titre: string
  description: string
  languageId: number
  languageName: string
  difficulte: "Facile" | "Moyen" | "Difficile"
  tempslimite: number // en minutes
  memoirelimite: number // en KB
  testCases: TestCase[]
  codeDepart?: string
  statut: "Brouillon" | "Actif" | "Archive"
  creeLe?: Date
  creePar?: number
}

export interface TestCase {
  id?: number
  entree: string
  sortieAttendue: string
  estCache: boolean
  points: number
  creeLe?: Date

}

// Extension de votre interface Candidature existante pour les défis
// export interface CandidatureAvecDefi {
//   // Propriétés de votre Candidature existante
//   id: number
//   nom: string
//   email: string
//   statut: "EN ATTENTE" | "ACCEPTÉ" | "REFUSEE"
//   cv: string
//   coverLetter: string
//   telephone: string
//   portfolioURL: string
//   linkedInProfile: string
//   experience: string
//   scoreCV: number
//   remarquesRH: string
//   decisionFinale: string

//   // Nouvelles propriétés pour les défis de code
//   defiId?: string
//   defiEnvoyeLe?: Date
//   defiTermineLe?: Date
//   scoreDefi?: number
//   statutDefi?: "AUCUN" | "ENVOYE" | "TERMINE" | "EVALUE"
// }

export interface SoumissionDefi {
  id: string
  defiId: string
  candidatureId: number // Utilise l'ID de votre Candidature
  code: string
  langage: string
  soumisLe: Date
  resultatsExecution: any[]
  score: number
  pointsTotal: number
  statut: "Soumis" | "En évaluation" | "Terminé"
}
