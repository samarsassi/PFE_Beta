import { Injectable } from "@angular/core"
import { BehaviorSubject, type Observable, of } from "rxjs"
import { Candidature } from "src/app/Data/Candidature"
import { CodingChallenge } from "src/app/Data/coding-challenge.model"

@Injectable({
  providedIn: "root",
})
export class AdminChallengeService {
  private challenges$ = new BehaviorSubject<CodingChallenge[]>([])
  private candidatures$ = new BehaviorSubject<Candidature[]>([])

  // Données de démonstration
  private mockChallenges: CodingChallenge[] = [
    {
      id: 1,
      titre: "Problème de Somme de Tableau",
      description: "Écrivez une fonction qui calcule la somme de tous les éléments d'un tableau.",
      languageId: 71,
      languageName: "Python (3.8.1)",
      difficulte: "Facile",
      tempslimite: 30,
      memoirelimite: 128000,
      testCases: [
        {
          id: 1,
          entree: "[1, 2, 3, 4, 5]",
          sortieAttendue: "15",
          estCache: false,
          points: 25,
        },
      ],
      codeDepart: "def somme_tableau(arr):\n    # Votre code ici\n    pass",
      statut: "Actif",
    },
  ]

  private mockCandidatures: Candidature[] = [
    {
      id: 1,
      nom: "Jean Dupont",
      email: "jean.dupont@email.com",
      statut: "EN ATTENTE",
      cv: "cv-jean-dupont.pdf",
      coverLetter: "Lettre de motivation pour le poste...",
      telephone: "+33123456789",
      portfolioURL: "https://jeandupont.dev",
      linkedInProfile: "https://linkedin.com/in/jeandupont",
      experience: "3 ans d'expérience en développement web",
      scoreCV: 85,
      remarquesRH: "Profil intéressant, bonnes compétences techniques",
      decisionFinale: "",
      statutDefi: "AUCUN",
    },
    {
      id: 2,
      nom: "Marie Martin",
      email: "marie.martin@email.com",
      statut: "EN ATTENTE",
      cv: "cv-marie-martin.pdf",
      coverLetter: "Lettre de motivation...",
      telephone: "+33987654321",
      portfolioURL: "https://mariemartin.dev",
      linkedInProfile: "https://linkedin.com/in/mariemartin",
      experience: "5 ans d'expérience en développement backend",
      scoreCV: 92,
      remarquesRH: "Excellent profil technique",
      decisionFinale: "",
      defiId: 1,
      defiEnvoyeLe: new Date(Date.now() - 86400000),
      statutDefi: "ENVOYE",
    },
  ]

  constructor() {
    this.challenges$.next(this.mockChallenges)
    this.candidatures$.next(this.mockCandidatures)
  }

  // Gestion des défis
  getChallenges(): Observable<CodingChallenge[]> {
    return this.challenges$.asObservable()
  }

createChallenge(challenge: Omit<CodingChallenge, "id">): Observable<CodingChallenge> {
  const newChallenge: CodingChallenge = {
    ...challenge,
    id: Date.now(), // generates a numeric unique id
    statut: "Brouillon", // optionally set a default
  };

  const currentChallenges = this.challenges$.value;
  this.challenges$.next([...currentChallenges, newChallenge]);

  return of(newChallenge);
}


  updateChallenge(id: number, updates: Partial<CodingChallenge>): Observable<CodingChallenge> {
    const currentChallenges = this.challenges$.value;
    const index = currentChallenges.findIndex((c) => c.id === id);

    if (index !== -1) {
      currentChallenges[index] = { ...currentChallenges[index], ...updates };
      this.challenges$.next([...currentChallenges]);
      return of(currentChallenges[index]);
    }

    throw new Error("Challenge not found");
  }


  deleteChallenge(id: number): Observable<boolean> {
    const currentChallenges = this.challenges$.value
    const filteredChallenges = currentChallenges.filter((c) => c.id !== id)
    this.challenges$.next(filteredChallenges)
    return of(true)
  }

  // Gestion des candidatures
  getCandidatures(): Observable<Candidature[]> {
    return this.candidatures$.asObservable()
  }

  envoyerDefiAuCandidat(candidatureId: number, defiId: number): Observable<boolean> {
    const candidaturesActuelles = this.candidatures$.value
    const index = candidaturesActuelles.findIndex((c) => c.id === candidatureId)

    if (index !== -1) {
      candidaturesActuelles[index] = {
        ...candidaturesActuelles[index],
        statutDefi: "ENVOYE",
        defiId,
        defiEnvoyeLe: new Date(),
      }

      this.candidatures$.next([...candidaturesActuelles])
      console.log(`Défi envoyé à ${candidaturesActuelles[index].email}`)
      return of(true)
    }

    return of(false)
  }

  // Langages disponibles
  getAvailableLanguages() {
    return [
      { id: 50, name: "C (GCC 9.2.0)" },
      { id: 54, name: "C++ (GCC 9.2.0)" },
      { id: 62, name: "Java (OpenJDK 13.0.1)" },
      { id: 71, name: "Python (3.8.1)" },
      { id: 63, name: "JavaScript (Node.js 12.14.0)" },
      { id: 68, name: "PHP (7.4.1)" },
      { id: 51, name: "C# (Mono 6.6.0.161)" },
      { id: 78, name: "Kotlin (1.3.70)" },
      { id: 72, name: "Ruby (2.7.0)" },
      { id: 73, name: "Rust (1.40.0)" },
    ]
  }
}
