import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração que enviaste para o Benaion.D.Lj
const firebaseConfig = {
  apiKey: "AIzaSyCl-U9X9qxohjDpgr8y2pdkS3j-qNm19pk",
  authDomain: "benaion-delivery.firebaseapp.com",
  projectId: "benaion-delivery",
  storageBucket: "benaion-delivery.firebasestorage.app",
  messagingSenderId: "309927409217",
  appId: "1:309927409217:web:7a105cb5237b2294b1b8c0",
  measurementId: "G-TK1KNW14WH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const API = {
  async createUser(data) {
    // Tenta salvar o utilizador no Firestore
    const docRef = await addDoc(collection(db, "users"), {
      ...data,
      created_at: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  },
  async getUserByEmail(email) {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  }
};

const Auth = {
  async loginWithEmail(email, password) {
    const user = await API.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Dados incorretos');
    localStorage.setItem('benaion_user', JSON.stringify(user));
    return user;
  },
  async register(data) { // Adicione o async aqui
  const user = await API.createUser(data); // O await já está aqui
  localStorage.setItem('benaion_user', JSON.stringify(user));
  return user;
},

  redirectToDashboard() {
    const user = JSON.parse(localStorage.getItem('benaion_user'));
    if (user) window.location.href = ${user.userType}.html;
  }
};

window.API = API;
window.Auth = Auth;
