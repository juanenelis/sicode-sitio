import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC24V2-SC3wgB2NQalge7M75Ta850BKoIM",
  authDomain: "sicode-981d4.firebaseapp.com",
  projectId: "sicode-981d4",
  storageBucket: "sicode-981d4.firebasestorage.app",
  messagingSenderId: "719896786811",
  appId: "1:719896786811:web:839866bbfdc53a47396fde",
  measurementId: "G-B888NRNTN8",
};

export const app = initializeApp(firebaseConfig);
// Forzamos long-polling: evita que la conexión se quede "colgada" en redes
// que bloquean el tipo de conexión que Firestore usa por defecto.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
