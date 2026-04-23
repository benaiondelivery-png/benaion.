// ========================================
// BENAION DELIVERY - JS DO PARCEIRO (V2.0)
// ========================================
import { db } from './api.js';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let userLoja = null;
let todosPedidos = [];

// 1. INICIALIZAÇÃO
async function init() {
    if (!window.Auth || !window.API) {
        setTimeout(init, 300);
        return;
    }

    userLoja = window.Auth.getCurrentUser();
    
    // Verificação de Segurança
    if (!userLoja || userLoja.userType !== 'parceiro') {
        window.location.href = 'index.html';
        return;
    }

    // Atualiza Nome na Interface
    const displayNome = document.getElementById('lojaNome');
    if (displayNome) displayNome.textContent = userLoja.storeName || userLoja.name;

    // Iniciar Escutas do Firebase
    escutarPedidos();
    carregarProdutos();
}

// 2. ESCUTA DE PEDIDOS EM TEMPO REAL
function escutarPedidos() {
    const q = query(
        collection(db, "pedidos"), 
        where("lojaId", "==", userLoja.id)
    );

    onSnapshot(q, (snapshot) => {
        todosPedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderizarPainel();
    });
}

function renderizarPainel() {
    const container = document.getElementById('listaPedidos');
    const ativos = todosPedidos.filter(p => ['pendente', 'preparando', 'pronto'].includes(p.status));
    
    // Atualizar Contadores do Topo
    document.getElementById('pedidosAtivos').textContent = ativos.length;
    
    const hoje = new Date().toLocaleDateString();
    const concluidosHoje = todosPedidos.filter(p => 
        p.status === 'finalizado' && new Date(p.created_at).toLocaleDateString() === hoje
    );
    
    const faturamento = concluidosHoje.reduce((acc, p) => acc + (p.valorProdutos || 0), 0);
    document.getElementById('vendasHoje').textContent = concluidosHoje.length;
    document.getElementById('faturamentoHoje').textContent = window.Utils.formatCurrency(faturamento);

    if (ativos.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:#999;">Nenhum pedido ativo no momento.</div>`;
        return;
    }

    container.innerHTML = ativos.map(p => `
        <div class="card pedido-card ${p.status}">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <span style="font-size:12px; color:#666;">#${p.id.substring(0,6)}</span>
                    <h4 style="margin:5px 0;">${p.clienteNome || 'Cliente App'}</h4>
                </div>
                <span class="badge-status status-${p.status === 'pendente' ? 'closed' : 'open'}">
                    ${window.Utils.getStatusText(p.status).toUpperCase()}
                </span>
            </div>
            
            <div style="margin:10px 0; font-size:14px; border-top:1px solid #eee; padding-top:10px;">
                ${p.itens ? p.itens.map(i => `<p>• ${i.qtd}x ${i.nome}</p>`).join('') : '<i>Pedido Personalizado</i>'}
            </div>

            <div class="valor-retirada-destaque">
                <small>Valor das Mercadorias:</small><br>
                <strong style="font-size:18px; color:var(--primary-red);">${window.Utils.formatCurrency(p.valorProdutos)}</strong>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                ${p.status === 'pendente' ? 
                    `<button class="btn btn-primary" onclick="alterarStatus('${p.id}', 'preparando')">ACEITAR</button>` :
                    p.status === 'preparando' ?
                    `<button class="btn btn-primary" onclick="alterarStatus('${p.id}', 'pronto')" style="background:#3498db;">PRONTO</button>` :
                    `<button class="btn btn-small" disabled style="background:#eee; color:#999;">AGUARDANDO COLETA</button>`
                }
                <button class="btn btn-small" onclick="window.Utils.openWhatsApp('${p.clienteTel || ''}', 'Olá, sou da loja ${userLoja.storeName}. Sobre seu pedido...')">
                    <i class="fab fa-whatsapp"></i> CONTATO
                </button>
            </div>
        </div>
    `).join('');
}

// 3. GESTÃO DE PRODUTOS (CATÁLOGO)
async function carregarProdutos() {
    const q = query(collection(db, "produtos"), where("lojaId", "==", userLoja.id));
    const snap = await getDocs(q);
    const grid = document.getElementById('gridProdutos');
    
    grid.innerHTML = snap.docs.map(d => {
        const p = d.data();
        return `
            <div class="product-card">
                <h4>${p.nome}</h4>
                <p>${window.Utils.formatCurrency(p.preco)}</p>
                <small>${p.descricao || ''}</small>
            </div>
        `;
    }).join('');
}

document.getElementById('formAddProduto').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const data = {
        lojaId: userLoja.id,
        nome: document.getElementById('pNome').value,
        preco: parseFloat(document.getElementById('pPreco').value),
        descricao: document.getElementById('pDesc').value,
        disponivel: true,
        created_at: Date.now()
    };

    try {
        await addDoc(collection(db, "produtos"), data);
        window.Utils.showToast("Produto adicionado ao catálogo!", "success");
        window.Utils.hideModal('modalProduto');
        e.target.reset();
        carregarProdutos();
    } catch (err) {
        window.Utils.showToast("Erro ao salvar produto", "error");
    } finally { btn.disabled = false; }
};

// 4. FUNÇÕES GLOBAIS (STATUS E ABAS)
window.alterarStatus = async (id, status) => {
    const ref = doc(db, "pedidos", id);
    await updateDoc(ref, { status: status });
    window.Utils.vibrate();
    window.Utils.showToast(`Pedido marcado como ${status}`);
};

window.switchTab = (tab) => {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`aba-${tab}`).classList.remove('hidden');
    document.getElementById(`nav-${tab}`).classList.add('active');
};

// 5. CHAMAR ENTREGADOR (PEDIDO MANUAL)
window.abrirModalChamarEntregador = () => {
    // Aqui você pode usar o modal de pedido manual que já tem
    window.Utils.showModal('modalPedidoManual'); // Certifique-se de ter esse modal
};

document.addEventListener('DOMContentLoaded', init);
