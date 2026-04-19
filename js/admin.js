// ========================================
// BENAION DELIVERY - PAINEL ADMINISTRATIVO (V1.6.0)
// ========================================

/**
 * Tabela Oficial de Taxas (TOT) integrada para conferência do Admin
 */
const TOT_BENAION = {
    "Agreste": 5.00, "Nova esperança": 6.00, "Prosperidade": 6.00,
    "Castanheira": 6.00, "Cajari": 7.00, "Rodovia do gogó": 7.00,
    "Buritizal": 7.00, "Sarney": 8.00, "Nazaré mineiro": 10.00,
    "Centro": 6.00, "Mirilandia": 6.00, "Rio branco": 7.00,
    "José cesário": 6.00, "Malvinas": 8.00, "Samaúma": 15.00,
    "Monte dourado": 30.00
};

let todosPedidos = [];
let filtroAtual = 'todos';
let currentUser = null;

// ========================================
// INICIALIZAÇÃO PROFISSIONAL
// ========================================

async function initAdmin() {
    // Garante que Utils, API e Auth existam
    if (!window.Auth || !window.API || !window.Utils) {
        setTimeout(initAdmin, 300);
        return;
    }

    try {
        // Proteção de Rota
        const autenticado = window.Auth.requireAuth(['admin']);
        if (!autenticado) return;

        currentUser = window.Auth.getCurrentUser();
        
        // Dashboard Inicial
        actualizarInterfaceAdmin();
        await refreshDados();
        
        // Loop de Atualização Inteligente (A cada 20 segundos)
        setInterval(refreshDados, 20000);

    } catch (error) {
        console.error('Falha crítica na inicialização:', error);
        window.Utils.showToast('Erro ao carregar sistema', 'error');
    }
}

async function refreshDados() {
    console.log('🔄 Benaion Admin: Atualizando dados...');
    await Promise.all([
        carregarEstatisticas(),
        carregarPedidos(),
        carregarParceirosSelect()
    ]);
}

document.addEventListener('DOMContentLoaded', initAdmin);

// ========================================
// DASHBOARD & ESTATÍSTICAS
// ========================================

async function carregarEstatisticas() {
    try {
        const stats = await window.API.getEstatisticas();
        
        // Elementos de contagem com animação
        updateStat('statPedidosHoje', stats.pedidosHoje || 0);
        updateStat('statPedidosAtivos', stats.pedidosAtivos || 0);
        updateStat('statEntregadoresOnline', stats.entregadoresOnline || 0);
        updateStat('statPedidosMes', stats.pedidosMes || 0);
        
    } catch (error) {
        console.error('Erro estatísticas:', error);
    }
}

function updateStat(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

// ========================================
// GESTÃO DE PEDIDOS (CORE)
// ========================================

async function carregarPedidos() {
    try {
        const result = await window.API.getPedidos(1, 1000);
        todosPedidos = result.data || [];
        filtrarPedidos(filtroAtual);
    } catch (error
