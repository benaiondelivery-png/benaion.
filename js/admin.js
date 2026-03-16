// ========================================
// BENAION DELIVERY - PAINEL ADMINISTRATIVO
// ========================================

// Verificar autenticação
Auth.requireAuth(['admin']);

const currentUser = Auth.getCurrentUser();
let todosPedidos = [];
let todosEntregadores = [];
let todosParceiros = [];
let filtroAtual = 'todos';

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  await carregarEstatisticas();
  await carregarPedidos();
  await carregarParceirosSelect();
  
  // Atualizar a cada 30 segundos
  setInterval(async () => {
    await carregarEstatisticas();
    await carregarPedidos();
  }, 30000);
});

// ========================================
// ESTATÍSTICAS
// ========================================

async function carregarEstatisticas() {
  try {
    const stats = await API.getEstatisticas();
    
    document.getElementById('statPedidosHoje').textContent = stats.pedidosHoje;
    document.getElementById('statPedidosAtivos').textContent = stats.pedidosAtivos;
    document.getElementById('statEntregadoresOnline').textContent = stats.entregadoresOnline;
    document.getElementById('statPedidosMes').textContent = stats.pedidosMes;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// ========================================
// PEDIDOS
// ========================================

async function carregarPedidos() {
  try {
    const result = await API.getPedidos(1, 1000);
    todosPedidos = result.data;
    filtrarPedidos(filtroAtual);
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    Utils.showToast('Erro ao carregar pedidos', 'error');
  }
}

function filtrarPedidos(status) {
  filtroAtual = status;
  
  // Atualizar botões
  document.querySelectorAll('#abaPedidos .btn').forEach(btn => {
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-outline');
  });
  event?.target?.classList?.remove('btn-outline');
  event?.target?.classList?.add('btn-secondary');
  
  // Filtrar pedidos
  let pedidosFiltrados = todosPedidos;
  if (status !== 'todos') {
    pedidosFiltrados = todosPedidos.filter(p => p.status === status);
  }
  
  renderizarPedidos(pedidosFiltrados);
}

function renderizarPedidos(pedidos) {
  const container = document.getElementById('listaPedidos');
  
  if (pedidos.length === 0) {
    Utils.showEmptyState(
      container,
      '📦',
      'Nenhum pedido encontrado',
      'Não há pedidos nesta categoria no momento'
    );
    return;
  }
  
  // Ordenar por data (mais recentes primeiro)
  pedidos.sort((a, b) => b.created_at - a.created_at);
  
  container.innerHTML = pedidos.map(pedido => `
    <div class="pedido-card" onclick="abrirDetalhesPedido('${pedido.id}')">
      <div class="pedido-header">
        <div class="pedido-numero">#${pedido.id.substring(0, 8)}</div>
        <span class="status-badge status-${pedido.status}">
          ${Utils.getStatusIcon(pedido.status)} ${Utils.getStatusText(pedido.status)}
        </span>
      </div>
      
      <div class="pedido-info">
        <div class="info-row">
          <span class="info-label">👤 Cliente:</span>
          <span class="info-value">${pedido.clienteNome || 'Não informado'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 Entrega:</span>
          <span class="info-value">${pedido.enderecoEntrega}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🏪 Retirada:</span>
          <span class="info-value">${pedido.enderecoRetirada}</span>
        </div>
        ${pedido.entregadorNome ? `
          <div class="info-row">
            <span class="info-label">🛵 Entregador:</span>
            <span class="info-value">${pedido.entregadorNome}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="pedido-valor">${Utils.formatCurrency(pedido.valor)}</div>
      
      <div style="display: flex; gap: 8px; font-size: 12px; color: var(--gray);">
        <span><i class="fas fa-clock"></i> ${Utils.timeAgo(pedido.created_at)}</span>
        <span><i class="fas fa-credit-card"></i> ${pedido.formaPagamento.toUpperCase()}</span>
      </div>
    </div>
  `).join('');
}

async function abrirDetalhesPedido(pedidoId) {
  try {
    const pedido = await API.getPedido(pedidoId);
    
    const content = document.getElementById('detalhesPedidoContent');
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
        <h4 style="margin-bottom: 16px; color: var(--primary-red);">📋 COMANDA BENAION DELIVERY</h4>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <strong>Nome:</strong><br>${pedido.clienteNome || 'Não informado'}
          </div>
          <div>
            <strong>Endereço Retirada:</strong><br>${pedido.enderecoRetirada}
          </div>
          <div>
            <strong>Produto:</strong><br>${pedido.produto}
          </div>
          <div>
            <strong>Valor:</strong><br><span style="font-size: 24px; color: var(--primary-red);">${Utils.formatCurrency(pedido.valor)}</span>
          </div>
          <div>
            <strong>Endereço Entrega:</strong><br>${pedido.enderecoEntrega}
          </div>
          <div>
            <strong>Bairro:</strong><br>${pedido.bairro}
          </div>
          <div>
            <strong>Forma de Pagamento:</strong><br>${pedido.formaPagamento.toUpperCase()}
          </div>
          ${pedido.troco > 0 ? `
            <div>
              <strong>Troco para:</strong><br>${Utils.formatCurrency(pedido.troco)}
            </div>
          ` : ''}
          ${pedido.agendarPara ? `
            <div>
              <strong>Agendar para:</strong><br>${Utils.formatDateTime(pedido.agendarPara)}
            </div>
          ` : ''}
          ${pedido.observacoes ? `
            <div>
              <strong>Observações:</strong><br>${pedido.observacoes}
            </div>
          ` : ''}
          ${pedido.entregadorNome ? `
            <div>
              <strong>🛵 Entregador:</strong><br>${pedido.entregadorNome}
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed var(--border); text-align: center; color: var(--gray); font-size: 13px;">
          <p>Aceitamos Pix, cartão e dinheiro 💳💰</p>
          <p style="margin-top: 8px;">O bom atendimento começa com você,<br>o restante deixa com a gente 😊</p>
        </div>
      </div>

      ${pedido.status === 'recebido' || pedido.status === 'aguardando_entregador' ? `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-success" onclick="atribuirEntregador('${pedido.id}')">
            <i class="fas fa-user-plus"></i> Atribuir Entregador
          </button>
          <button class="btn btn-outline" onclick="editarPedido('${pedido.id}')">
            <i class="fas fa-edit"></i> Editar Pedido
          </button>
          <button class="btn btn-primary" style="background-color: var(--gray);" onclick="cancelarPedido('${pedido.id}')">
            <i class="fas fa-times"></i> Cancelar Pedido
          </button>
        </div>
      ` : ''}

      ${pedido.status !== 'cancelado' && pedido.status !== 'finalizado' ? `
        <div style="margin-top: 16px;">
          <label class="form-label">Atualizar Status:</label>
          <select class="form-control" onchange="atualizarStatusPedidoAdmin('${pedido.id}', this.value)">
            <option value="">Selecione...</option>
            <option value="recebido">Recebido</option>
            <option value="aguardando_entregador">Aguardando Entregador</option>
            <option value="aceito">Aceito</option>
            <option value="em_coleta">Em Coleta</option>
            <option value="em_entrega">Em Entrega</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
      ` : ''}

      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="btn btn-outline" onclick="Utils.openGoogleMaps('${pedido.enderecoRetirada}', '${pedido.enderecoEntrega}')">
          <i class="fas fa-map-marked-alt"></i> Ver Rota
        </button>
        <button class="btn btn-outline" onclick="compartilharPedido('${pedido.id}')">
          <i class="fas fa-share"></i> Compartilhar
        </button>
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 12px; color: var(--gray);">
        Criado em: ${Utils.formatDateTime(pedido.created_at)}
      </div>
    `;
    
    Utils.showModal('detalhesPedidoModal');
  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
    Utils.showToast('Erro ao carregar detalhes do pedido', 'error');
  }
}

async function criarNovoPedido(event) {
  event.preventDefault();
  
  const btn = event.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
  
  try {
    const parceiroId = document.getElementById('pedidoParceiro').value;
    let parceiroNome = '';
    
    if (parceiroId) {
      const parceiro = await API.getParceiro(parceiroId);
      parceiroNome = parceiro.nomeComercio;
    }
    
    const pedido = {
      clienteNome: document.getElementById('pedidoNome').value,
      enderecoRetirada: document.getElementById('pedidoRetirada').value,
      produto: document.getElementById('pedidoProduto').value,
      valor: parseFloat(document.getElementById('pedidoValor').value),
      enderecoEntrega: document.getElementById('pedidoEntrega').value,
      bairro: document.getElementById('pedidoBairro').value,
      formaPagamento: document.getElementById('pedidoPagamento').value,
      troco: parseFloat(document.getElementById('pedidoTroco').value) || 0,
      agendarPara: document.getElementById('pedidoAgendar').value || null,
      observacoes: document.getElementById('pedidoObs').value,
      parceiroId: parceiroId || null,
      parceiroNome: parceiroNome,
      status: 'aguardando_entregador'
    };
    
    await API.createPedido(pedido);
    
    Utils.showToast('Pedido criado com sucesso!', 'success');
    Utils.hideModal('novoPedidoModal');
    event.target.reset();
    await carregarPedidos();
    await carregarEstatisticas();
    
    // Notificar entregadores
    await notificarEntregadores(pedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    Utils.showToast('Erro ao criar pedido', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Criar Pedido';
  }
}

async function atribuirEntregador(pedidoId) {
  try {
    // Buscar entregadores disponíveis
    const entregadores = await API.getEntregadoresOnline();
    
    if (entregadores.length === 0) {
      Utils.showToast('Nenhum entregador online no momento', 'warning');
      return;
    }
    
    // Criar lista de opções
    const opcoes = entregadores.map(e => 
      `<option value="${e.id}">${e.name} - ${e.totalDeliveries} entregas</option>`
    ).join('');
    
    const content = document.getElementById('detalhesPedidoContent');
    content.innerHTML = `
      <h4 style="margin-bottom: 16px;">Selecione um Entregador:</h4>
      <div class="form-group">
        <select class="form-control" id="selectEntregador">
          <option value="">Escolha...</option>
          ${opcoes}
        </select>
      </div>
      <button class="btn btn-primary" onclick="confirmarAtribuicao('${pedidoId}')">
        <i class="fas fa-check"></i> Confirmar
      </button>
      <button class="btn btn-outline" onclick="abrirDetalhesPedido('${pedidoId}')">
        <i class="fas fa-arrow-left"></i> Voltar
      </button>
    `;
  } catch (error) {
    console.error('Erro ao atribuir entregador:', error);
    Utils.showToast('Erro ao atribuir entregador', 'error');
  }
}

async function confirmarAtribuicao(pedidoId) {
  const entregadorId = document.getElementById('selectEntregador').value;
  
  if (!entregadorId) {
    Utils.showToast('Selecione um entregador', 'warning');
    return;
  }
  
  try {
    const entregador = await API.getUser(entregadorId);
    
    await API.updatePedido(pedidoId, {
      entregadorId: entregador.id,
      entregadorNome: entregador.name,
      status: 'aceito'
    });
    
    // Criar notificação para o entregador
    await API.createNotificacao({
      userId: entregador.id,
      pedidoId: pedidoId,
      tipo: 'pedido_aceito',
      mensagem: `Novo pedido atribuído! #${pedidoId.substring(0, 8)}`
    });
    
    Utils.showToast('Entregador atribuído com sucesso!', 'success');
    Utils.hideModal('detalhesPedidoModal');
    await carregarPedidos();
  } catch (error) {
    console.error('Erro ao confirmar atribuição:', error);
    Utils.showToast('Erro ao atribuir entregador', 'error');
  }
}

async function atualizarStatusPedidoAdmin(pedidoId, novoStatus) {
  if (!novoStatus) return;
  
  try {
    await API.atualizarStatusPedido(pedidoId, novoStatus);
    Utils.showToast('Status atualizado!', 'success');
    await abrirDetalhesPedido(pedidoId);
    await carregarPedidos();
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    Utils.showToast('Erro ao atualizar status', 'error');
  }
}

async function cancelarPedido(pedidoId) {
  if (!confirm('Tem certeza que deseja cancelar este pedido?')) {
    return;
  }
  
  try {
    await API.updatePedido(pedidoId, { status: 'cancelado' });
    Utils.showToast('Pedido cancelado', 'success');
    Utils.hideModal('detalhesPedidoModal');
    await carregarPedidos();
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    Utils.showToast('Erro ao cancelar pedido', 'error');
  }
}

// ========================================
// ENTREGADORES
// ========================================

async function carregarEntregadores() {
  try {
    const result = await API.getUsers(1, 1000);
    todosEntregadores = result.data.filter(u => u.userType === 'entregador');
    renderizarEntregadores();
  } catch (error) {
    console.error('Erro ao carregar entregadores:', error);
  }
}

function renderizarEntregadores() {
  const container = document.getElementById('listaEntregadores');
  
  if (todosEntregadores.length === 0) {
    Utils.showEmptyState(
      container,
      '🛵',
      'Nenhum entregador cadastrado',
      'Cadastre entregadores para começar a fazer entregas'
    );
    return;
  }
  
  container.innerHTML = todosEntregadores.map(entregador => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${entregador.name}</div>
          <div style="font-size: 13px; color: var(--gray);">
            ${entregador.email}
          </div>
        </div>
        <div style="text-align: right;">
          <span class="status-badge ${entregador.online ? 'status-aceito' : 'status-cancelado'}">
            ${entregador.online ? '🟢 Online' : '⚫ Offline'}
          </span>
        </div>
      </div>
      <div class="card-body">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>📱 ${entregador.phone || 'Não informado'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>🏆 Total de Entregas:</span>
          <strong style="color: var(--primary-red);">${entregador.totalDeliveries || 0}</strong>
        </div>
      </div>
    </div>
  `).join('');
}

// ========================================
// PARCEIROS
// ========================================

async function carregarParceiros() {
  try {
    const result = await API.getParceiros(1, 1000);
    todosParceiros = result.data;
    renderizarParceiros();
  } catch (error) {
    console.error('Erro ao carregar parceiros:', error);
  }
}

async function carregarParceirosSelect() {
  try {
    const result = await API.getParceiros(1, 1000);
    const select = document.getElementById('pedidoParceiro');
    
    select.innerHTML = '<option value="">Sem parceiro</option>' +
      result.data.map(p => 
        `<option value="${p.id}">${p.nomeComercio} (${p.tipoComercio})</option>`
      ).join('');
  } catch (error) {
    console.error('Erro ao carregar parceiros:', error);
  }
}

function renderizarParceiros() {
  const container = document.getElementById('listaParceiros');
  
  if (todosParceiros.length === 0) {
    Utils.showEmptyState(
      container,
      '🏪',
      'Nenhum parceiro cadastrado',
      'Cadastre parceiros para expandir seu negócio'
    );
    return;
  }
  
  // Ordenar: premium primeiro
  todosParceiros.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));
  
  container.innerHTML = todosParceiros.map(parceiro => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">
            ${parceiro.nomeComercio}
            ${parceiro.premium ? '<span style="background: gold; color: #000; padding: 2px 8px; border-radius: 8px; font-size: 11px; margin-left: 8px;">⭐ PREMIUM</span>' : ''}
          </div>
          <div style="font-size: 13px; color: var(--gray);">
            ${parceiro.tipoComercio}
          </div>
        </div>
      </div>
      <div class="card-body">
        <div style="font-size: 14px; margin-bottom: 8px;">
          📍 ${parceiro.endereco}
        </div>
        <div style="font-size: 14px;">
          📱 ${parceiro.telefone}
        </div>
      </div>
    </div>
  `).join('');
}

async function criarNovoParceiro(event) {
  event.preventDefault();
  
  const btn = event.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
  
  try {
    const parceiro = {
      nomeComercio: document.getElementById('parceiroNome').value,
      tipoComercio: document.getElementById('parceiroTipo').value,
      endereco: document.getElementById('parceiroEndereco').value,
      telefone: document.getElementById('parceiroTelefone').value,
      logo: '',
      premium: document.getElementById('parceiroPremium').checked,
      status: 'ativo',
      userId: Utils.generateId()
    };
    
    await API.createParceiro(parceiro);
    
    Utils.showToast('Parceiro cadastrado com sucesso!', 'success');
    Utils.hideModal('novoParceiroModal');
    event.target.reset();
    await carregarParceiros();
    await carregarParceirosSelect();
  } catch (error) {
    console.error('Erro ao criar parceiro:', error);
    Utils.showToast('Erro ao cadastrar parceiro', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Cadastrar Parceiro';
  }
}

// ========================================
// NOTIFICAÇÕES
// ========================================

async function notificarEntregadores(pedido) {
  try {
    const entregadores = await API.getEntregadoresOnline();
    
    await Promise.all(
      entregadores.map(e => 
        API.createNotificacao({
          userId: e.id,
          pedidoId: pedido.id,
          tipo: 'novo_pedido',
          mensagem: `Novo pedido disponível! ${Utils.formatCurrency(pedido.valor)}`
        })
      )
    );
    
    Utils.playNotificationSound();
  } catch (error) {
    console.error('Erro ao notificar entregadores:', error);
  }
}

// ========================================
// UTILITÁRIOS
// ========================================

function toggleTroco() {
  const pagamento = document.getElementById('pedidoPagamento').value;
  const trocoGroup = document.getElementById('trocoGroup');
  
  if (pagamento === 'dinheiro') {
    trocoGroup.style.display = 'block';
  } else {
    trocoGroup.style.display = 'none';
    document.getElementById('pedidoTroco').value = '';
  }
}

async function compartilharPedido(pedidoId) {
  const pedido = await API.getPedido(pedidoId);
  const texto = `
PEDIDO BENAION DELIVERY
#${pedidoId.substring(0, 8)}

Cliente: ${pedido.clienteNome}
Produto: ${pedido.produto}
Valor: ${Utils.formatCurrency(pedido.valor)}
Entrega: ${pedido.enderecoEntrega}
Status: ${Utils.getStatusText(pedido.status)}
  `.trim();
  
  await Utils.share('Pedido Benaion', texto, window.location.href);
}

function mostrarAba(aba) {
  // Esconder todas as abas
  document.getElementById('abaPedidos').classList.add('hidden');
  document.getElementById('abaEntregadores').classList.add('hidden');
  document.getElementById('abaParceiros').classList.add('hidden');
  
  // Mostrar aba selecionada
  if (aba === 'pedidos') {
    document.getElementById('abaPedidos').classList.remove('hidden');
    carregarPedidos();
  } else if (aba === 'entregadores') {
    document.getElementById('abaEntregadores').classList.remove('hidden');
    carregarEntregadores();
  } else if (aba === 'parceiros') {
    document.getElementById('abaParceiros').classList.remove('hidden');
    carregarParceiros();
  }
  
  // Atualizar navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event?.target?.closest('.nav-item')?.classList?.add('active');
}

// Fechar modais ao clicar fora
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      Utils.hideModal(modal.id);
    }
  });
});
