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
}
