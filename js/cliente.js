// ========================================
// BENAION DELIVERY - CLIENTE (V2.0)
// ========================================
import { db } from './api.js';
import { collection, query, where, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let meusPedidos = [];
let user = null;

async function initCliente() {
    if (!window.Auth || !window.API || !window.Utils) {
        setTimeout(initCliente, 300);
        return;
    }

    if (!window.Auth.requireAuth(['cliente'])) return;
    user = window.Auth.getCurrentUser();
    
    // UI Inicial (Mantendo seu padrão visual)
    const nomeEl = document.getElementById('nomeUsuario');
    if (nomeEl) nomeEl.textContent = user.name.split(' ')[0];
    
    // Escuta Pedidos em Tempo Real (Adeus loop de 30s!)
    escutarMeusPedidos();
}

// 1. MONITORAMENTO REAL-TIME
function escutarMeusPedidos() {
    const q = query(
        collection(db, "pedidos"), 
        where("clienteId", "==", user.id)
    );

    onSnapshot(q, (snapshot) => {
        meusPedidos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ordena: Mais recentes primeiro
        meusPedidos.sort((a, b) => {
            const da = a.created_at?.seconds ? a.created_at.seconds : a.created_at;
            const db = b.created_at?.seconds ? b.created_at.seconds : b.created_at;
            return db - da;
        });

        renderizarListaPedidos();
        atualizarResumo();
    });
}

// 2. RENDERIZAÇÃO (Preservando Cores e Fontes)
function renderizarListaPedidos() {
    const container = document.getElementById('listaPedidos');
    if (!container) return;

    if (meusPedidos.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#999;">
                <i class="fas fa-shopping-bag fa-3x" style="margin-bottom:15px; opacity:0.3;"></i>
                <p>Você ainda não fez pedidos.<br>Que tal pedir algo agora?</p>
            </div>`;
        return;
    }

    container.innerHTML = meusPedidos.map(p => `
        <div class="card pedido-item animate__animated animate__fadeIn" style="margin-bottom:15px; border-left: 5px solid ${getStatusColor(p.status)}">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <span style="font-size:12px; color:#666;">#${p.id.substring(0,6).toUpperCase()}</span>
                    <h4 style="margin:5px 0; color:#333;">${p.lojaNome || 'Benaion Delivery'}</h4>
                </div>
                <span class="badge" style="background:${getStatusColor(p.status)}; color:white; font-size:10px; padding:4px 8px; border-radius:10px; font-weight:bold;">
                    ${window.Utils.getStatusText(p.status).toUpperCase()}
                </span>
            </div>
            
            <div style="margin:10px 0; font-size:13px; color:#555;">
                <p style="margin:3px 0;"><i class="fas fa-map-marker-alt" style="color:var(--primary-red)"></i> ${p.bairro || p.bairroEntrega}</p>
                <p style="margin:3px 0;"><i class="fas fa-box" style="color:var(--primary-red)"></i> ${p.descricao || 'Itens diversos'}</p>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; margin-top:10px; padding-top:10px;">
                <span style="font-weight:bold; color:#E30613; font-size:16px;">${window.Utils.formatCurrency(p.valorTotal)}</span>
                <button class="btn btn-small btn-outline" onclick="repetirPedido('${p.id}')" style="font-size:11px; border:1px solid #ddd; padding:5px 10px; border-radius:5px;">
                    <i class="fas fa-redo"></i> REPETIR
                </button>
            </div>
        </div>
    `).join('');
}

// 3. CRIAÇÃO DE PEDIDO (Usando as Taxas do Admin)
window.fazerNovoPedido = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    try {
        const bairroEntrega = document.getElementById('entregaBairro').value;
        const bairroLoja = "Centro"; // Ou pegar de um select de lojas
        
        // Busca a taxa configurada dinamicamente no Admin
        const taxaEntrega = window.API.calcularTaxa(bairroLoja, bairroEntrega);
        const valorProdutos = parseFloat(document.getElementById('valorProdutos').value || 0);

        const novoPedido = {
            clienteId: user.id,
            clienteNome: user.name,
            clienteTel: user.telefone || "",
            status: 'pendente',
            bairro: bairroEntrega,
            bairroRetirada: bairroLoja,
            taxaEntrega: taxaEntrega,
            valorProdutos: valorProdutos,
            valorTotal: valorProdutos + taxaEntrega,
            descricao: document.getElementById('pedidoDesc').value,
            created_at: Date.now()
        };

        await addDoc(collection(db, "pedidos"), novoPedido);
        window.Utils.showToast("Pedido enviado! Acompanhe o status.", "success");
        window.Utils.hideModal('modalNovoPedido');
        e.target.reset();
    } catch (error) {
        window.Utils.showToast("Erro ao processar pedido", "error");
    } finally {
        btn.disabled = false;
    }
};

// 4. AUXILIARES E UI
function getStatusColor(status) {
    const cores = {
        'pendente': '#f1c40f',    // Amarelo
        'preparando': '#3498db',  // Azul
        'pronto': '#9b59b6',      // Roxo
        'aceito': '#e67e22',      // Laranja
        'em_entrega': '#e67e22',  // Laranja
        'finalizado': '#2ecc71',  // Verde
        'cancelado': '#e74c3c'    // Vermelho
    };
    return cores[status] || '#95a5a6';
}

function atualizarResumo() {
    const concluidos = meusPedidos.filter(p => p.status === 'finalizado');
    const totalGasto = concluidos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    
    if (document.getElementById('countPedidos')) document.getElementById('countPedidos').textContent = concluidos.length;
    if (document.getElementById('totalGasto')) document.getElementById('totalGasto').textContent = window.Utils.formatCurrency(totalGasto);
}

window.repetirPedido = (id) => {
    const anterior = meusPedidos.find(p => p.id === id);
    if (anterior) {
        const descInput = document.getElementById('pedidoDesc');
        if (descInput) descInput.value = anterior.descricao;
        window.Utils.showModal('modalNovoPedido');
        window.Utils.showToast("Pedido anterior carregado!");
    }
};

document.addEventListener('DOMContentLoaded', initCliente);
