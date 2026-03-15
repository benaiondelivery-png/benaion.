// ========================================
// BENAION DELIVERY - PAINEL DO ENTREGADOR
// ========================================

// Verificar autenticação
Auth.requireAuth(['entregador']);

const currentUser = Auth.getCurrentUser();
let pedidosDisponiveis = [];
let minhasEntregas = [];
let historico = [];

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  // Mostrar nome do entregador
  document.getElementById('entregadorNome').textContent = currentUser.name.split(' ')[0];
  
  // Verificar e atualizar status
  await verificarStatus();
  
  // Carregar dados
  await carregarEstatisticas();
  await carregarPedidos();
  
  // Atualizar a cada 15 segundos
  setInterval(async () => {
    await carregarPedidos();
  }, 15000);
  
  // Solicitar permissão para notificações
  await Utils.requestNotificationPermission();
});

// ========================================
// STATUS ONLINE/OFFLINE
// ========================================

async function verificarStatus() {
  const user = await API.getUser(currentUser.id);
  atualizarUIStatus(user.online);
}

function atualizarUIStatus(online) {
  const btnStatus = document.getElementById('btnStatus');
  const navStatus = document.getElementById('navStatus');
  
  if (online) {
    btnStatus.style.color = '#4CAF50';
    btnStatus.querySelector('i').style.animation = 'pulse 2s infinite';
    navStatus.classList.add('active');
    navStatus.innerHTML = '<i class="fas fa-circle"></i><span>Online</span>';
  } else {
    btnStatus.style.color = '#999';
    btnStatus.querySelector('i').style.animation = 'none';
    navStatus.classList.remove('active');
    navStatus.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
  }
  
  currentUser.online = online;
}

async function toggleStatus() {
  try {
    const novoStatus = !currentUser.online;
    
    await API.updateUser(currentUser.id, { online: novoStatus });
    
    atualizarUIStatus(novoStatus);
    
    if (novoStatus) {
      Utils.showToast('Você está online! 🟢', 'success');
      Utils.vibrate([200, 100, 200]);
      await carregarPedidos();
    } else {
      Utils.showToast('Você está offline ⚫', 'info');
    }
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    Utils.showToast('Erro ao alterar status', 'error');
  }
}

// ========================================
// ESTATÍSTICAS
// ========================================

async function carregarEstatisticas() {
  try {
    const stats = await API.getEstatisticasEntregador(currentUser.id);
    
    document.getElementById('statHoje').textContent = stats.hoje;
    document.getElementById('statSemana').textContent = stats.semana;
    document.getElementById('statMes').textContent = stats.mes;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// ========================================
// PEDIDOS
// ========================================

async function carregarPedidos() {
  try {
    // Pedidos disponíveis (aguardando entregador)
    pedidosDisponiveis = await API.getPedidosDisponiveis();
    
    // Minhas entregas (aceito, em_coleta, em_entrega)
    const todosPedidos = await API.getPedidosByUser(currentUser.id, 'entregador');
    minhasEntregas = todosPedidos.filter(p => 
      ['aceito', 'em_coleta', 'em_entrega'].includes(p.status)
    );
    
    // Histórico (finalizados e cancelados)
    historico = todosPedidos.filter(p => 
      ['finalizado', 'cancelado'].includes(p.status)
    );
    
    // Renderizar aba atual
    const abaAtiva = document.querySelector('.nav-item.active');
    if (abaAtiva) {
      const texto = abaAtiva.textContent.toLowerCase();
      if (texto.includes('disponíveis')) {
        renderizarPedidosDisponiveis();
      } else if (texto.includes('minhas')) {
        renderizarMinhasEntregas();
      } else if (texto.includes('histórico')) {
        renderizarHistorico();
      }
    }
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
}

function renderizarPedidosDisponiveis() {
  const container = document.getElementById('listaPedidosDisponiveis');
  
  if (!currentUser.online) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚫</div>
        <h3 class="empty-title">Você está Offline</h3>
        <p class="empty-text">Fique online para receber pedidos</p>
        <button class="btn btn-primary" onclick="toggleStatus()">
          <i class="fas fa-power-off"></i> Ficar Online
        </button>
      </div>
    `;
    return;
  }
  
  if (pedidosDisponiveis.length === 0) {
    Utils.showEmptyState(
      container,
      '📦',
      'Nenhum pedido disponível',
      'Novos pedidos aparecerão aqui automaticamente'
    );
    return;
  }
  
  container.innerHTML = pedidosDisponiveis.map(pedido => `
    <div class="pedido-card" style="border-left: 4px solid var(--primary-yellow);">
      <div class="pedido-header">
        <div class="pedido-numero">#${pedido.id.substring(0, 8)}</div>
        <span class="status-badge status-${pedido.status}">
          ${Utils.getStatusIcon(pedido.status)} NOVO
        </span>
      </div>
      
      <div class="pedido-valor" style="margin: 16px 0;">${Utils.formatCurrency(pedido.valor)}</div>
      
      <div class="pedido-info">
        <div class="info-row">
          <span class="info-label">🏪 Retirar em:</span>
          <span class="info-value">${pedido.enderecoRetirada}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 Entregar em:</span>
          <span class="info-value">${pedido.enderecoEntrega}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🎯 Bairro:</span>
          <span class="info-value">${pedido.bairro}</span>
        </div>
        <div class="info-row">
          <span class="info-label">💳 Pagamento:</span>
          <span class="info-value">${pedido.formaPagamento.toUpperCase()}</span>
        </div>
      </div>
      
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="btn btn-success" style="flex: 1;" onclick="aceitarPedido('${pedido.id}')">
          <i class="fas fa-check"></i> ACEITAR
        </button>
        <button class="btn btn-outline" onclick="verDetalhesPedido('${pedido.id}')">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderizarMinhasEntregas() {
  const container = document.getElementById('listaMinhasEntregas');
  
  if (minhasEntregas.length === 0) {
    Utils.showEmptyState(
      container,
      '🛵',
      'Nenhuma entrega em andamento',
      'Aceite pedidos disponíveis para começar'
    );
    return;
  }
  
  // Ordenar por status (em_entrega, em_coleta, aceito)
  const ordem = { 'em_entrega': 0, 'em_coleta': 1, 'aceito': 2 };
  minhasEntregas.sort((a, b) => ordem[a.status] - ordem[b.status]);
  
  container.innerHTML = minhasEntregas.map(pedido => {
    const acoes = getAcoesPorStatus(pedido.status, pedido.id);
    
    return `
      <div class="pedido-card" style="border-left: 4px solid var(--primary-red);">
        <div class="pedido-header">
          <div class="pedido-numero">#${pedido.id.substring(0, 8)}</div>
          <span class="status-badge status-${pedido.status}">
            ${Utils.getStatusIcon(pedido.status)} ${Utils.getStatusText(pedido.status).toUpperCase()}
          </span>
        </div>
        
        <div class="pedido-valor" style="margin: 16px 0;">${Utils.formatCurrency(pedido.valor)}</div>
        
        <div class="pedido-info">
          <div class="info-row">
            <span class="info-label">👤 Cliente:</span>
            <span class="info-value">${pedido.clienteNome}</span>
          </div>
          <div class="info-row">
            <span class="info-label">🏪 Retirar:</span>
            <span class="info-value">${pedido.enderecoRetirada}</span>
          </div>
          <div class="info-row">
            <span class="info-label">📍 Entregar:</span>
            <span class="info-value">${pedido.enderecoEntrega}</span>
          </div>
          <div class="info-row">
            <span class="info-label">📦 Produto:</span>
            <span class="info-value">${pedido.produto}</span>
          </div>
          <div class="info-row">
            <span class="info-label">💳 Pagamento:</span>
            <span class="info-value">${pedido.formaPagamento.toUpperCase()} ${pedido.troco > 0 ? `(Troco: ${Utils.formatCurrency(pedido.troco)})` : ''}</span>
          </div>
        </div>
        
        <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${acoes}
          <button class="btn btn-outline btn-small" onclick="Utils.openGoogleMaps('${pedido.enderecoRetirada}', '${pedido.enderecoEntrega}')">
            <i class="fas fa-map-marked-alt"></i> Abrir Rota
          </button>
          <button class="btn btn-outline btn-small" onclick="verDetalhesPedido('${pedido.id}')">
            <i class="fas fa-eye"></i> Detalhes
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderizarHistorico() {
  const container = document.getElementById('listaHistorico');
  
  if (historico.length === 0) {
    Utils.showEmptyState(
      container,
      '📋',
      'Nenhuma entrega no histórico',
      'Suas entregas finalizadas aparecerão aqui'
    );
    return;
  }
  
  // Ordenar por data (mais recentes primeiro)
  historico.sort((a, b) => b.updated_at - a.updated_at);
  
  container.innerHTML = historico.map(pedido => `
    <div class="pedido-card" style="opacity: 0.8;">
      <div class="pedido-header">
        <div class="pedido-numero">#${pedido.id.substring(0, 8)}</div>
        <span class="status-badge status-${pedido.status}">
          ${Utils.getStatusIcon(pedido.status)} ${Utils.getStatusText(pedido.status)}
        </span>
      </div>
      
      <div class="pedido-info" style="margin-top: 12px;">
        <div class="info-row">
          <span class="info-label">📍 Entrega:</span>
          <span class="info-value">${pedido.enderecoEntrega}</span>
        </div>
        <div class="info-row">
          <span class="info-label">💰 Valor:</span>
          <span class="info-value">${Utils.formatCurrency(pedido.valor)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Data:</span>
          <span class="info-value">${Utils.formatDateTime(pedido.updated_at)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function getAcoesPorStatus(status, pedidoId) {
  if (status === 'aceito') {
    return `
      <button class="btn btn-primary" style="flex: 1;" onclick="atualizarStatus('${pedidoId}', 'em_coleta')">
        <i class="fas fa-box"></i> IR PARA RETIRADA
      </button>
    `;
  } else if (status === 'em_coleta') {
    return `
      <button class="btn btn-primary" style="flex: 1;" onclick="atualizarStatus('${pedidoId}', 'em_entrega')">
        <i class="fas fa-shipping-fast"></i> INICIAR ENTREGA
      </button>
    `;
  } else if (status === 'em_entrega') {
    return `
      <button class="btn btn-success" style="flex: 1;" onclick="atualizarStatus('${pedidoId}', 'finalizado')">
        <i class="fas fa-check-circle"></i> FINALIZAR ENTREGA
      </button>
    `;
  }
  return '';
}

// ========================================
// AÇÕES DO ENTREGADOR
// ========================================

async function aceitarPedido(pedidoId) {
  try {
    await API.aceitarPedido(pedidoId, currentUser.id, currentUser.name);
    
    Utils.showToast('Pedido aceito! 🎉', 'success');
    Utils.vibrate([200, 100, 200]);
    Utils.playNotificationSound();
    
    await carregarPedidos();
    await carregarEstatisticas();
    
    // Mudar para aba "Minhas Entregas"
    mostrarAba('minhas');
  } catch (error) {
    console.error('Erro ao aceitar pedido:', error);
    Utils.showToast('Erro ao aceitar pedido', 'error');
  }
}

async function atualizarStatus(pedidoId, novoStatus) {
  try {
    await API.atualizarStatusPedido(pedidoId, novoStatus);
    
    const mensagens = {
      'em_coleta': 'Indo buscar o pedido! 🏪',
      'em_entrega': 'Entrega iniciada! 🛵',
      'finalizado': 'Entrega finalizada! ✅'
    };
    
    Utils.showToast(mensagens[novoStatus], 'success');
    Utils.vibrate([200]);
    
    await carregarPedidos();
    await carregarEstatisticas();
    
    // Se finalizou, incrementar total de entregas
    if (novoStatus === 'finalizado') {
      await API.updateUser(currentUser.id, {
        totalDeliveries: (currentUser.totalDeliveries || 0) + 1
      });
      currentUser.totalDeliveries = (currentUser.totalDeliveries || 0) + 1;
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    Utils.showToast('Erro ao atualizar status', 'error');
  }
}

async function verDetalhesPedido(pedidoId) {
  try {
    const pedido = await API.getPedido(pedidoId);
    
    const content = document.getElementById('detalhesEntregaContent');
    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div class="pedido-numero" style="font-size: 24px; margin-bottom: 8px;">
          #${pedido.id.substring(0, 8)}
        </div>
        <span class="status-badge status-${pedido.status}" style="font-size: 14px;">
          ${Utils.getStatusIcon(pedido.status)} ${Utils.getStatusText(pedido.status)}
        </span>
      </div>

      <div style="background: var(--light-gray); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <div class="pedido-valor" style="text-align: center; margin-bottom: 20px;">
          ${Utils.formatCurrency(pedido.valor)}
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <strong style="color: var(--primary-red);">👤 Cliente</strong><br>
            ${pedido.clienteNome}
          </div>
          
          <div>
            <strong style="color: var(--primary-red);">🏪 Endereço de Retirada</strong><br>
            ${pedido.enderecoRetirada}
            <button class="btn btn-small btn-outline mt-1" onclick="window.open('${Utils.getAddressLink(pedido.enderecoRetirada)}', '_blank')">
              <i class="fas fa-map-marker-alt"></i> Ver no Mapa
            </button>
          </div>
          
          <div>
            <strong style="color: var(--primary-red);">📦 Produto</strong><br>
            ${pedido.produto}
          </div>
          
          <div>
            <strong style="color: var(--primary-red);">📍 Endereço de Entrega</strong><br>
            ${pedido.enderecoEntrega}<br>
            <small style="color: var(--gray);">Bairro: ${pedido.bairro}</small>
            <button class="btn btn-small btn-outline mt-1" onclick="window.open('${Utils.getAddressLink(pedido.enderecoEntrega)}', '_blank')">
              <i class="fas fa-map-marker-alt"></i> Ver no Mapa
            </button>
          </div>
          
          <div>
            <strong style="color: var(--primary-red);">💳 Pagamento</strong><br>
            ${pedido.formaPagamento.toUpperCase()}
            ${pedido.troco > 0 ? `<br><span style="color: var(--warning); font-weight: 600;">⚠️ Cliente precisa de troco para ${Utils.formatCurrency(pedido.troco)}</span>` : ''}
          </div>
          
          ${pedido.observacoes ? `
            <div>
              <strong style="color: var(--primary-red);">📝 Observações</strong><br>
              ${pedido.observacoes}
            </div>
          ` : ''}
        </div>
      </div>

      <button class="btn btn-primary" onclick="Utils.openGoogleMaps('${pedido.enderecoRetirada}', '${pedido.enderecoEntrega}')">
        <i class="fas fa-route"></i> Abrir Rota Completa
      </button>
    `;
    
    Utils.showModal('detalhesEntregaModal');
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
    Utils.showToast('Erro ao carregar detalhes', 'error');
  }
}

// ========================================
// NAVEGAÇÃO
// ========================================

function mostrarAba(aba) {
  // Esconder todas as abas
  document.getElementById('abaDisponiveis').classList.add('hidden');
  document.getElementById('abaMinhas').classList.add('hidden');
  document.getElementById('abaHistorico').classList.add('hidden');
  
  // Mostrar aba selecionada e renderizar
  if (aba === 'disponiveis') {
    document.getElementById('abaDisponiveis').classList.remove('hidden');
    renderizarPedidosDisponiveis();
  } else if (aba === 'minhas') {
    document.getElementById('abaMinhas').classList.remove('hidden');
    renderizarMinhasEntregas();
  } else if (aba === 'historico') {
    document.getElementById('abaHistorico').classList.remove('hidden');
    renderizarHistorico();
  }
  
  // Atualizar navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Marcar item ativo (exceto o de status)
  const itemAtivo = Array.from(document.querySelectorAll('.nav-item')).find(item => {
    const texto = item.textContent.toLowerCase();
    return (aba === 'disponiveis' && texto.includes('disponíveis')) ||
           (aba === 'minhas' && texto.includes('minhas')) ||
           (aba === 'historico' && texto.includes('histórico'));
  });
  
  if (itemAtivo) {
    itemAtivo.classList.add('active');
  }
  
  // Manter o status ativo se estiver online
  if (currentUser.online) {
    document.getElementById('navStatus').classList.add('active');
  }
}

// Animação de pulse para o botão online
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

// Fechar modal ao clicar fora
document.getElementById('detalhesEntregaModal').addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    Utils.hideModal('detalhesEntregaModal');
  }
});
