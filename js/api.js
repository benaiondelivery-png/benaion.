import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCl-U9X9qxohjDpgr8y2pdkS3j-qNm19pk",
  authDomain: "benaion-delivery.firebaseapp.com",
  projectId: "benaion-delivery",
  storageBucket: "benaion-delivery.firebasestorage.app",
  messagingSenderId: "309927409217",
  appId: "1:309927409217:web:7a105cb5237b2294b1b8c0",
  measurementId: "G-TK1KNW14WH"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const API = {
  async createUser(data) {
    try {
      if (!data.name || !data.email) throw new Error("Dados incompletos.");

      const docRef = await addDoc(collection(db, "users"), {
        name: data.name,
        email: data.email,
        password: data.password || "", // Google não tem senha no banco
        userType: data.userType || "cliente",
        created_at: new Date().toISOString()
      });

      return { id: docRef.id, ...data };
    } catch (e) {
      console.error("Erro ao criar usuário:", e);
      throw e;
    }
  },
  
  async getUserByEmail(email) {
    try {
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    } catch (e) {
      throw new Error("Erro ao consultar banco de dados.");
    }
  }
};

const Auth = {
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userGoogle = result.user;

      // 1. Verifica se já tem perfil no Firestore
      let userProfile = await API.getUserByEmail(userGoogle.email);

      // 2. Se não existir, cria um perfil automático de CLIENTE
      if (!userProfile) {
        userProfile = await API.createUser({
          name: userGoogle.displayName,
          email: userGoogle.email,
          userType: "cliente",
          password: "login_google"
        });
      }

      localStorage.setItem('benaion_user', JSON.stringify(userProfile));
      window.location.href = "cliente.html";
      return userProfile;
    } catch (error) {
      console.error("Erro Google Auth:", error);
      throw new Error("Falha no login com Google.");
    }
  },

  async loginWithEmail(email, password) {
    const user = await API.getUserByEmail(email);
    if (!user || user.password !== password) throw new Error('E-mail ou senha incorretos');
    localStorage.setItem('benaion_user', JSON.stringify(user));
    return user;
  },
  
  async register(data) {
    if (!data.email || !data.password || !data.name) throw new Error("Preencha tudo!");
    const user = await API.createUser(data);
    localStorage.setItem('benaion_user', JSON.stringify(user));
    return user;
  },

  redirectToDashboard() {
    const user = JSON.parse(localStorage.getItem('benaion_user'));
    if (user && user.userType) {
      window.location.href = `${user.userType}.html`; 
    } else {
      window.location.href = 'index.html';
    }
  }
};

// EXPOSIÇÃO GLOBAL
window.API = API;
window.Auth = Auth;
console.log("Benaion API v1.5 - Google Auth Ativo!");
