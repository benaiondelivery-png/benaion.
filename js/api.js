import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCl-U9X9qxohjDpgr8y2pdkS3j-qNm19pk",
  authDomain: "benaion-delivery.firebaseapp.com",
  projectId: "benaion-delivery",
  storageBucket: "benaion-delivery.firebasestorage.app",
  messagingSenderId: "309927409217",
  appId: "1:309927409217:web:7a105cb5237b2294b1b8c0",
  measurementId: "G-TK1KNW14WH"
};

// --- INICIALIZAÇÃO ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- SISTEMA DE TAXAS DINÂMICAS ---
let TAXAS_LOCAIS = {
  "Agreste": 6, "Nova esperança": 6, "Prosperidade": 6, "Castanheira": 6,
  "Cajari": 7, "Rodovia do gogó": 8, "buritizal": 7, "Sarney": 8,
  "Nazaré mineiro": 10, "centro": 6, "mirilandia": 6, "Rio branco": 7,
  "José cesário": 6, "Malvinas": 8, "samaúma": 15, "monte dourado": 30
};

// Sincroniza taxas com o Admin Panel em tempo real
function sincronizarTaxas() {
  onSnapshot(doc(db, "configuracoes", "taxas"), (doc) => {
    if (doc.exists()) {
      TAXAS_LOCAIS = doc.data();
      console.log("✅ Taxas atualizadas do Banco de Dados");
    }
  });
}
sincronizarTaxas();

const API = {
  // Lógica de cálculo flexível conforme solicitado
  calcularTaxa(bairroRetirada, bairroEntrega, adicionais = 0) {
    const taxaRet = TAXAS_LOCAIS[bairroRetirada] || 6;
    const taxaEnt = TAXAS_LOCAIS[bairroEntrega] || 6;
    return Math.max(taxaRet, taxaEnt) + adicionais;
  },
  async getUserProfile(uid) {
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },
  async saveUserToFirestore(uid, userData) {
    await setDoc(doc(db, "users", uid), { ...userData, updated_at: new Date().toISOString() }, { merge: true });
  },
  async updateUser(uid, data) {
    await updateDoc(doc(db, "users", uid), data);
  },
  async createPedido(pedidoData) {
    return await addDoc(collection(db, "pedidos"), {
      ...pedidoData,
      status: pedidoData.status || 'aguardando_entregador',
      created_at: new Date().toISOString()
    });
  },
  async updatePedido(pedidoId, data) {
    await updateDoc(doc(db, "pedidos", pedidoId), data);
  },
  escutarTodosPedidos(callback) {
    return onSnapshot(collection(db, "pedidos"), (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }
};

const Auth = {
  async loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    let profile = await API.getUserProfile(result.user.uid);
    if (!profile) {
      profile = { name: result.user.displayName, email: result.user.email, userType: 'cliente', created_at: new Date().toISOString() };
      await API.saveUserToFirestore(result.user.uid, profile);
    }
    localStorage.setItem('benaion_user', JSON.stringify({ id: result.user.uid, ...profile }));
    window.location.href = `${profile.userType}.html`;
  },
  async loginWithEmail(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await API.getUserProfile(userCredential.user.uid);
    localStorage.setItem('benaion_user', JSON.stringify({ id: userCredential.user.uid, ...profile }));
    window.location.href = `${profile.userType}.html`;
  },
  logout() {
    auth.signOut();
    localStorage.removeItem('benaion_user');
    window.location.href = 'index.html';
  },
  getCurrentUser() { return JSON.parse(localStorage.getItem('benaion_user')); },
  requireAuth(allowedTypes = []) {
    const user = this.getCurrentUser();
    if (!user) { window.location.href = 'index.html'; return false; }
    if (allowedTypes.length > 0 && !allowedTypes.includes(user.userType)) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
  }
};

// --- EXPOSIÇÃO GLOBAL (ESSENCIAL PARA FUNCIONAR NO GITHUB PAGES) ---
window.auth = auth;
window.db = db;
window.API = API;
window.Auth = Auth;
window.TAXAS_LOCAIS = TAXAS_LOCAIS;
// Objeto que faltava para corrigir o erro de cadastro do seu print
window.authService = { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup };

console.log("🚀 Benaion API v2.0 - Laranjal do Jari & Monte Dourado Ativa");
