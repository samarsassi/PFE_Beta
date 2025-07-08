import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvHV0yUAv541brwr5kntZ-bVPA3IcuGn0",
  authDomain: "fitnessapp-71926.firebaseapp.com",
  databaseURL: "https://fitnessapp-71926-default-rtdb.firebaseio.com",
  projectId: "fitnessapp-71926",
  storageBucket: "fitnessapp-71926.appspot.com",
  messagingSenderId: "699441761628",
  appId: "1:699441761628:web:eaab49fbeb6b77cc108599",
  measurementId: "G-YQBRML1GM4"
};
export const environment = {
  production: false,
  firebaseConfig,
  rapidApiKey: '8974954d26msh9bb8f721563f676p1e5b2djsn0358f08cb744',
  judge0ApiKey: "63a5ac99e5mshf97258a4af5e691p175901jsn60b0513c1598",
  judge0BaseUrl: "https://judge0-ce.p.rapidapi.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);