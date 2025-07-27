import { CodingChallenge } from './coding-challenge.model';
import { Entretien } from './Entretien';

export interface Candidature {
    id: number;
    nom: string;
    email: string;
    statut: 'EN ATTENTE' | 'ACCEPTÉ' | 'REJETÉ';
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
    entretien?: Entretien | null;

    // Nouvelles propriétés pour les défis de code
    defiId?: number
    defiEnvoyeLe?: Date
    defiTermineLe?: Date
    scoreDefi?: number
    statutDefi?: "AUCUN" | "ENVOYE" | "TERMINE" | "EVALUE"

    dateCreation?: Date;
    dateModification?: Date;
    offreEmploi?: import('./OffreEmploi').OffreEmploi;

    defi: CodingChallenge;
}

  