import { Candidature } from "./Candidature";
import { User } from "./User";

export interface Entretien {
    id?: number;
    dateEntretien: Date;
    commentaireRH: string;
    resultat: 'ACCEPTÉ' | 'REJETÉ';
    candidature: Candidature;
    // menePar: User; // Led by RH
}
