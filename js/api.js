// js/api.js - Versão Firebase Firestore
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  orderBy, 
  limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const API = {
  // ========================================
  // USUÁRIOS
  // ========================================

  async createUser(data) {
    try {
      const docRef = await addDoc(collection(window.db, "users"), {
        ...data,
        status: 'ativo',
        online: false,
        created_at: new Date().toISOString()
      });
      return { id: docRef.id, ...data };
    } catch (e) {
      console.error("Erro ao criar usuário:", e);
      throw new Error("Erro ao salvar os dados no banco.");
    }
  },

  async getUserByEmail(email) {
    const q = query(collection(window.db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  },

  async updateUser(id, data) {
    const userRef = doc(window.db, "users", id);
    return await updateDoc(userRef, data);
  },

  // ========================================
  // PEDIDOS
  // ========================================

  async createPedido(data) {
    try {
      const docRef = await addDoc(collection(window.db, "pedidos"), {
        ...data,
        status: 'recebido',
        created_at: new Date().toISOString()
      });
      return { id: docRef.id, ...data };
    } catch (e) {
      console.error("Erro ao criar pedido:", e);
      throw e;
    }
  },

  async getPedidos() {
    const q = query(collection(window.db, "pedidos"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  async getEstatisticas() {
    const pedidos = await this.getPedidos();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return {
      pedidosHoje: pedidos.filter(p => new Date(p.created_at) >= hoje).length,
      pedidosTotal: pedidos.length,
      pedidosAtivos: pedidos.filter(p => !['finalizado', 'cancelado'].includes(p.status)).length
    };
  }

window.API = API;


