import { Candidature } from "./Candidature";
import { User } from "./User";

export interface Evaluation {
    id?: number;
    note: number;
    feedback: string;
    dateEvaluation: Date;
    candidature: Candidature;
    //manager: User;
}
