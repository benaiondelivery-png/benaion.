import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração atualizada com as suas chaves novas
const firebaseConfig = {
  apiKey: "AIzaSyBHokOvVml6hxvzJYVJX9ppx1Wr1mDn11g",
  authDomain: "benaion-delivery.firebaseapp.com",
  projectId: "benaion-delivery",
  storageBucket: "benaion-delivery.firebasestorage.app",
  messagingSenderId: "309927409217",
  appId: "1:309927409217:web:10e7e2b951fa4ad0b1b8c0",
  measurementId: "G-FJRTLQBELJ"
};

// Inicializa o Firebase e o Banco de Dados
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Objeto API para gerenciar o banco
const API = {
  async createUser(data) {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        ...data,
        status: 'ativo',
        created_at: new Date().toISOString()
      });
      return { id: docRef.id, ...data };
    } catch (e) {
      console.error("Erro ao salvar no Firebase:", e);
      throw new Error("Erro de conexão com o banco de dados.");
    }
  },
  async getUserByEmail(email) {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  }
};

// Objeto Auth para o Login/Registro
const Auth = {
  async loginWithEmail(email, password) {
    const user = await API.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('Email ou senha incorretos');
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
    if (user) window.location.href = `${user.userType}.html`;
  }
};

// Torna tudo visível para o seu site
window.API = API;
window.Auth = Auth;
