export interface OffreEmploi {

    id: number;
    titre: string;
    description: string;
    archive: boolean;
    localisation: string;
    dateDebut: Date;
    niveauExperience: string;
    salaire?: number;
    //  rh: User; RH (Human Resources)
}
