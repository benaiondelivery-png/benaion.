// ========================================
// BENAION DELIVERY - PAINEL DO ENTREGADOR (V2.0)
// ========================================
import { db } from './api.js';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
let pedidosEscutados = [];

async function initEntregador() {
    if (!window.Auth || !window.API || !window.Utils) {
        setTimeout(initEntregador, 300);
        return;
    }

    if (!window.Auth.requireAuth(['entregador'])) return;
    currentUser = window.Auth.getCurrentUser();

    // UI Inicial
    document.getElementById('entregadorNome').textContent = currentUser.name.split(' ')[0];
    
    // Sincroniza Status Online/Offline
    await sincronizarStatusInicial();
    
    // Inicia Escuta em Tempo Real (O pulo do gato!)
    escutarPedidosSistema();
}

// 1. MONITORAMENTO EM TEMPO REAL
function escutarPedidosSistema() {
    // Escuta TODOS os pedidos que estão aguardando ou que pertencem a este entregador
    const q = query(collection(db, "pedidos"));

    onSnapshot(q, (snapshot) => {
        pedidosEscutados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const disponiveis = pedidosEscutados.filter(p => p.status === 'aguardando_entregador' || p.status === 'pronto');
        const meus = pedidosEscutados.filter(p => p.entregadorId === currentUser.id && !['finalizado', 'cancelado'].includes(p.status));

        renderizarDisponiveis(disponiveis);
        renderizarMinhasEntregas(meus);
        atualizarEstatisticas();
    });
}

// 2. GESTÃO DE ENTREGAS
function renderizarDisponiveis(pedidos) {
    const container = document.getElementById('listaPedidosDisponiveis');
    if (!container) return;

    if (pedidos.length === 0 || !currentUser.online) {
        container.innerHTML = `<div class="text-center py-4">${!currentUser.online ? 'Fique ONLINE para ver pedidos' : 'Buscando pedidos...'}</div>`;
        return;
    }

    container.innerHTML = pedidos.map(p => `
        <div class="card pedido-card animate__animated animate__fadeInUp">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge-loja">${p.lojaNome || 'Benaion Avulso'}</span>
                <span class="valor-taxa" style="color:#2ecc71; font-weight:bold;">${window.Utils.formatCurrency(p.taxaEntrega)}</span>
            </div>
            <div style="margin:10px 0; font-size:14px;">
                <p><i class="fas fa-arrow-up" style="color:var(--primary-red)"></i> <b>Retirada:</b> ${p.bairroRetirada}</p>
                <p><i class="fas fa-arrow-down" style="color:#3498db"></i> <b>Entrega:</b> ${p.bairro}</p>
            </div>
            <button class="btn btn-primary w-100" onclick="aceitarCorrida('${p.id}')">ACEITAR CORRIDA</button>
        </div>
    `).join('');
}

window.aceitarCorrida = async (id) => {
    try {
        const ref = doc(db, "pedidos", id);
        await updateDoc(ref, {
            entregadorId: currentUser.id,
            entregadorNome: currentUser.name,
            status: 'aceito',
            aceito_em: Date.now()
        });
        window.Utils.vibrate([100, 50, 100]);
        window.Utils.showToast("Corrida aceita! Vá até o local.", "success");
    } catch (err) {
        window.Utils.showToast("Erro ao aceitar. Outro entregador pode ter sido mais rápido.", "error");
    }
};

// 3. LOGÍSTICA (MAPAS E ADICIONAL)
function renderizarMinhasEntregas(pedidos) {
    const container = document.getElementById('minhasEntregasAtivas');
    if (!container) return;

    container.innerHTML = pedidos.map(p => {
        const adicional = window.Utils.calcularAdicionalTempo(p.hora_chegada_mercado);
        
        return `
        <div class="card" style="border-left: 5px solid #3498db; margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between;">
                <b>Pedido #${p.id.substring(0,6)}</b>
                <span class="status-badge">${window.Utils.getStatusText(p.status)}</span>
            </div>

            ${p.hora_chegada_mercado ? `
                <div style="background:#fff3cd; padding:5px; border-radius:5px; margin:10px 0; font-size:12px; text-align:center;">
                    <i class="fas fa-clock"></i> Espera no Mercado: <b>${window.Utils.formatCurrency(adicional)}</b>
                </div>
            ` : ''}

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                <button class="btn btn-small btn-outline" onclick="window.Utils.openGoogleMaps('${p.bairroRetirada}', '${p.bairro}')">
                    <i class="fas fa-route"></i> ROTA
                </button>
                <button class="btn btn-small btn-success" onclick="finalizarPedido('${p.id}')">
                    CONCLUIR
                </button>
            </div>
        </div>
    `}).join('');
}

// 4. STATUS E FINANCEIRO
async function sincronizarStatusInicial() {
    const perfil = await window.API.getUserProfile(currentUser.id);
    if (perfil) {
        currentUser.online = perfil.online || false;
        atualizarUIStatus(currentUser.online);
    }
}

window.toggleStatus = async () => {
    const novoStatus = !currentUser.online;
    await window.API.updateUser(currentUser.id, { online: novoStatus });
    currentUser.online = novoStatus;
    atualizarUIStatus(novoStatus);
};

function atualizarUIStatus(online) {
    const btn = document.getElementById('btnStatusHeader');
    const txt = document.getElementById('txtStatus');
    if (online) {
        btn.style.color = "#2ecc71";
        txt.innerHTML = "● Online";
        window.Utils.showToast("Você está no Radar Benaion!");
    } else {
        btn.style.color = "#ccc";
        txt.innerHTML = "○ Offline";
    }
}

function atualizarEstatisticas() {
    const hoje = new Date().toLocaleDateString();
    const concluidosHoje = pedidosEscutados.filter(p => 
        p.entregadorId === currentUser.id && 
        p.status === 'finalizado' &&
        new Date(p.finalizado_em || Date.now()).toLocaleDateString() === hoje
    );

    const saldo = concluidosHoje.reduce((acc, p) => acc + (p.taxaEntrega || 0), 0);
    
    if(document.getElementById('statHoje')) document.getElementById('statHoje').textContent = concluidosHoje.length;
    if(document.getElementById('statSaldo')) document.getElementById('statSaldo').textContent = window.Utils.formatCurrency(saldo);
}

window.finalizarPedido = async (id) => {
    if(confirm("Confirma a entrega para o cliente?")) {
        await updateDoc(doc(db, "pedidos", id), { 
            status: 'finalizado',
            finalizado_em: Date.now()
        });
        window.Utils.showToast("Entrega concluída! Dinheiro no bolso.", "success");
    }
};

document.addEventListener('DOMContentLoaded', initEntregador);
