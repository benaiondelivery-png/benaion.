import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Suas credenciais do print
const firebaseConfig = {
  apiKey: "AIzaSyCl-U9X9uxohJDugz8y2pdkSrS9Rmc",
  authDomain: "benaion-delivery.firebaseapp.com",
  projectId: "benaion-delivery",
  storageBucket: "benaion-delivery.appspot.com",
  messagingSenderId: "309927489217",
  appId: "1:309927489217:web:7a105cb5237b2294b1b8c0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Objeto API
const API = {
  async createUser(data) {
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

// Objeto Auth integrado para evitar o erro "is not defined"
const Auth = {
  async loginWithEmail(email, password) {
    const user = await API.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Dados incorretos');
    localStorage.setItem('benaion_user', JSON.stringify(user));
    return user;
  },
  async register(data) {
    const user = await API.createUser(data);
    localStorage.setItem('benaion_user', JSON.stringify(user));
    return user;
  },
  redirectToDashboard() {
    const user = JSON.parse(localStorage.getItem('benaion_user'));
    if (user) window.location.href = ${user.userType}.html;
  }
};

// Torna global para o HTML encontrar
window.API = API;
window.Auth = Auth;
