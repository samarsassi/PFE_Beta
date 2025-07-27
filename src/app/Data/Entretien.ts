
  export interface Entretien {
    id?: number;
    dateEntretien: string;  
    commentaireRH: string;
    resultat: ResultatEntretien;
    lien: string; 
    candidatureId?: number;     
  }
  
export enum ResultatEntretien {
    ACCEPTE = 'ACCEPTE',
    REJETE = 'REJETE',
    EN_ATTENTE = 'EN_ATTENTE',
  }
  