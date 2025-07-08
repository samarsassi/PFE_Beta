import { Candidature } from "./Candidature";
import { User } from "./User";

export interface Test {
    id?: number;
    lienTest: string;
    testScore: number;
    datePassage: Date;
    candidature: Candidature;
    // rh: User; // Created by RH (Human Resources)
}
