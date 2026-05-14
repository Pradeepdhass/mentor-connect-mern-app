// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCJs2PBFgh7Yi0XnsuqTxQgXJffXyJxQY",
  authDomain: "mentorconnect-345a9.firebaseapp.com",
  projectId: "mentorconnect-345a9",
  storageBucket: "mentorconnect-345a9.firebasestorage.app",
  messagingSenderId: "145236635790",
  appId: "1:145236635790:web:f3ad7395d8868e11da19df",
  measurementId: "G-9D8634J8Y1"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
