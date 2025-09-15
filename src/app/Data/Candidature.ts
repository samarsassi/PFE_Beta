import { CodingChallenge } from './coding-challenge.model';
import { Entretien } from './Entretien';

export interface Candidature {
    id: number;
    nom: string;
    email: string;
    statut: 'EN ATTENTE' | 'ACCEPTÉ' | 'REFUSEE';
    cv: string;
    cvUrl: string; //lien l supabase
    coverLetter: string;
    telephone: string;
    portfolioURL: string; linkedInProfile: string;
    experience: string;
    scoreCV: number;
    remarquesRH: string;
    decisionFinale: string;
    creePar: string;
    scoringComment: string;
    //entretien
    entretien?: Entretien | null;
    statutEntretien?: "AUCUN" | "ENVOYE" | "TERMINE"
    entretienId?: number
    entretienEnvoyeLe?: Date
    entretienTermineLe?: Date

    // Nouvelles propriétés pour les défis de code
    defiId?: number
    defiEnvoyeLe?: Date
    defiTermineLe?: Date
    scoreDefi?: number
    statutDefi: "AUCUN" | "ENVOYE" | "TERMINE" | "EVALUE" | "EXPIRE"

    dateCreation?: Date;
    dateModification?: Date;
    offreEmploi?: import('./OffreEmploi').OffreEmploi;

    defi: CodingChallenge;
}

  