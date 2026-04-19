// ========================================
// BENAION DELIVERY - PAINEL DO ENTREGADOR
// ========================================

let currentUser = null;
let pedidosDisponiveis = [];
let minhasEntregas = [];
let historico = [];

// ========================================
// INICIALIZAÇÃO SEGURA (Aguarda o Firebase)
// ========================================

async function initEntregador() {
  // Verifica se os módulos globais já foram carregados pelo api.js
  if (window.Auth && window.API) {
    try {
      // Verificar autenticação
      window.Auth.requireAuth(['entregador']);
      currentUser = window.Auth.getCurrentUser();

      // Mostrar nome do entregador
      document.getElementById('entregadorNome').textContent = currentUser.name.split(' ')[0];
      
      // Verificar e atualizar status
      await verificarStatus();
      
      // Carregar dados iniciais
      await carregarEstatisticas();
      await carregarPedidos();
      
      // Ciclo de atualização
      setInterval(async () => {
        await carregarPedidos();
      }, 15000);
      
      await Utils.requestNotificationPermission();
    } catch (error) {
      console.error('Erro na inicialização:', error);
    }
  } else {
    // Tenta novamente em 500ms se o api.js ainda estiver carregando
    setTimeout(initEntregador, 500);
  }
}

document.addEventListener('DOMContentLoaded', initEntregador);

// ========================================
// STATUS ONLINE/OFFLINE
// ========================================

async function verificarStatus() {
  const user = await window.API.getUser(currentUser.id);
  atualizarUIStatus(user.online);
}

function atualizarUIStatus(online) {
  const btnStatus = document.getElementById('btnStatus');
  const navStatus = document.getElementById('navStatus');
  
  if (online) {
    btnStatus.style.color = '#4CAF50';
    navStatus.classList.add('active');
    navStatus.innerHTML = '<i class="fas fa-circle"></i><span>Online</span>';
  } else {
    btnStatus.style.color = '#999';
    navStatus.classList.remove('active');
    navStatus.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
  }
  
  currentUser.online = online;
}

async function toggleStatus() {
  try {
    const novoStatus = !currentUser.online;
    await window.API.updateUser(currentUser.id, { online: novoStatus });
    atualizarUIStatus(novoStatus);
    
    if (novoStatus) {
      Utils.showToast('Você está online! 🟢', 'success');
      await carregarPedidos();
    } else {
      Utils.showToast('Você está offline ⚫', 'info');
    }
  } catch (error) {
    Utils.showToast('Erro ao alterar status', 'error');
  }
}

// ========================================
// PEDIDOS E LOGÍSTICA
// ========================================

async function carregarPedidos() {
  try {
    pedidosDisponiveis = await window.API.getPedidosDisponiveis();
    const todosPedidos = await window.API.getPedidosByUser(currentUser.id, 'entregador');
    
    minhasEntregas = todosPedidos.filter(p => ['aceito', 'em_coleta', 'em_entrega'].includes(p.status));
    historico = todosPedidos.filter(p => ['finalizado', 'cancelado'].includes(p.status));
    
    // Renderização automática baseada na aba ativa
    const abaAtiva = document.querySelector('.nav-item.active span')?.textContent.toLowerCase();
    if (abaAtiva?.includes('disponíveis')) renderizarPedidosDisponiveis();
    else if (abaAtiva?.includes('minhas')) renderizarMinhasEntregas();
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
}

async function aceitarPedido(pedidoId) {
  try {
    await window.API.aceitarPedido(pedidoId, currentUser.id, currentUser.name);
    Utils.showToast('Pedido aceito! 🎉', 'success');
    await carregarPedidos();
    mostrarAba('minhas');
  } catch (error) {
    Utils.showToast('Erro ao aceitar pedido', 'error');
  }
}

async function atualizarStatus(pedidoId, novoStatus) {
  try {
    await window.API.atualizarStatusPedido(pedidoId, novoStatus);
    Utils.showToast('Status atualizado!', 'success');
    
    if (novoStatus === 'finalizado') {
      const total = (currentUser.totalDeliveries || 0) + 1;
      await window.API.updateUser(currentUser.id, { totalDeliveries: total });
      currentUser.totalDeliveries = total;
    }
    await carregarPedidos();
  } catch (error) {
    Utils.showToast('Erro ao atualizar status', 'error');
  }
}

// ========================================
// INTERFACE E NAVEGAÇÃO
// ========================================

function mostrarAba(aba) {
  const abas = ['abaDisponiveis', 'abaMinhas', 'abaHistorico'];
  abas.forEach(id => document.getElementById(id).classList.add('hidden'));
  
  const idAtivo = 'aba' + aba.charAt(0).toUpperCase() + aba.slice(1);
  document.getElementById(idAtivo).classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  // Lógica para marcar o botão da navegação inferior como ativo
}

async function carregarEstatisticas() {
  try {
    const stats = await window.API.getEstatisticasEntregador(currentUser.id);
    document.getElementById('statHoje').textContent = stats.hoje || 0;
    document.getElementById('statSemana').textContent = stats.semana || 0;
    document.getElementById('statMes').textContent = stats.mes || 0;
  } catch (error) {
    console.error('Erro nas estatísticas:', error);
  }
}
