import { CodingChallenge } from './coding-challenge.model';

export interface Candidature {
    id: number;
    nom: string;
    email: string;
    statut: 'EN ATTENTE' | 'ACCEPTÉ' | 'REJETÉ';
    cv: string;
    coverLetter: string;
    telephone: string;
    portfolioURL: string; linkedInProfile: string;
    experience: string;
    scoreCV: number;
    remarquesRH: string;
    decisionFinale: string;
    creePar: string;

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

export interface CandidatureDTO {
    id: number;
    nom: string;
    email: string;
    telephone: string;
    experience: string;
    linkedInProfile: string;
    portfolioURL: string;
    statut: string;
    cv: string;
    coverLetter: string;
    scoreCV: number;
    remarquesRH: string;
    decisionFinale: string;
   
    scoreDefi: number;
    statutDefi: 'AUCUN' | 'ENVOYE' | 'TERMINE' | 'EVALUE';
  
    offreEmploiId: number;
    offreEmploiTitre: string;
    //defiId: number;
    //defiTitre: string; 
    //defiEnvoyeLe: string;
    //defiTermineLe: string; 

    defi: CodingChallenge;
  }
  