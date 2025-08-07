import { Candidature } from "./Candidature";

    export interface Entretien {
      id?: number;
      dateEntretien: string;  
      commentaireRH: string | null;  
      resultat: ResultatEntretien;
      lien: string; 
      candidatureId?: number;     
      candidature?: Candidature;
    }
    
  export enum ResultatEntretien {
      ACCEPTE = 'ACCEPTE',
      REFUSEE = 'REFUSEE',
      EN_ATTENTE = 'EN_ATTENTE',
    }
    