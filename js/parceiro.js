// ========================================
// BENAION DELIVERY - PAINEL DO PARCEIRO
// ========================================

let currentUser = null;
let parceiroDados = null;
let meusPedidos = [];

// ========================================
// INICIALIZAÇÃO SEGURA
// ========================================

async function initParceiro() {
  if (window.Auth && window.API) {
    try {
      // 1. Verificar se é um parceiro
      window.Auth.requireAuth(['parceiro']);
      currentUser = window.Auth.getCurrentUser();

      // 2. Buscar dados da loja vinculada a este usuário
      // Nota: Assume-se que o ID do usuário é o mesmo ou está vinculado ao parceiro
      const result = await window.API.getParceiros(1, 1000);
      parceiroDados = result.data.find(p => p.userId === currentUser.id);

      if (!parceiroDados) {
        Utils.showToast("Loja não encontrada para este perfil.", "error");
        return;
      }

      // 3. Atualizar Interface
      document.getElementById('parceiroNome').textContent = parceiroDados.nomeComercio;
      
      // 4. Carga de Dados
      await carregarDados();
      
      // Atualização automática (30s)
      setInterval(carregarDados, 30000);

    } catch (error) {
      console.error("Erro ao inicializar painel do parceiro:", error);
    }
  } else {
    setTimeout(initParceiro, 500);
  }
}

document.addEventListener('DOMContentLoaded', initParceiro);

// ========================================
// CARREGAMENTO E FILTRAGEM
// ========================================

async function carregarDados() {
  try {
    const result = await window.API.getPedidos(1, 1000);
    
    // Filtrar apenas os pedidos desta loja
    meusPedidos = result.data.filter(p => p.parceiroId === parceiroDados.id);
    
    renderizarEstatisticas();
    renderizarPedidos();
  } catch (error) {
    console.error("Erro ao carregar pedidos da loja:", error);
  }
}

function renderizarEstatisticas() {
  const hoje = new Date().toLocaleDateString();
  const pedidosHoje = meusPedidos.filter(p => 
    new Date(p.created_at).toLocaleDateString() === hoje
  ).length;

  document.getElementById('statPedidosHoje').textContent = pedidosHoje;
  document.getElementById('statPedidosTotal').textContent = meusPedidos.length;
}

function renderizarPedidos() {
  const container = document.getElementById('listaPedidos');
  
  if (meusPedidos.length === 0) {
    Utils.showEmptyState(container, '🏪', 'Sem pedidos ainda', 'Seus pedidos aparecerão aqui.');
    return;
  }

  // Ordenar por mais recentes
  meusPedidos.sort((a, b) => b.created_at - a.created_at);

  container.innerHTML = meusPedidos.map(pedido => `
    <div class="pedido-card">
      <div class="pedido-header">
        <div class="pedido-numero">#${pedido.id.substring(0, 8)}</div>
        <span class="status-badge status-${pedido.status}">
          ${Utils.getStatusText(pedido.status)}
        </span>
      </div>
      <div class="pedido-info">
        <div class="info-row"><strong>Cliente:</strong> ${pedido.clienteNome}</div>
        <div class="info-row"><strong>Produto:</strong> ${pedido.produto}</div>
        <div class="info-row"><strong>Valor:</strong> ${Utils.formatCurrency(pedido.valor)}</div>
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: var(--gray);">
        ${Utils.timeAgo(pedido.created_at)}
      </div>
    </div>
  `).join('');
}

// ========================================
// CRIAÇÃO DE PEDIDO PELA LOJA
// ========================================

async function criarNovoPedido(event) {
  event.preventDefault();
  
  const btn = event.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  try {
    const novoPedido = {
      parceiroId: parceiroDados.id,
      parceiroNome: parceiroDados.nomeComercio,
      enderecoRetirada: parceiroDados.endereco, // A retirada é na própria loja
      clienteNome: document.getElementById('pedidoNome').value,
      produto: document.getElementById('pedidoProduto').value,
      valor: parseFloat(document.getElementById('pedidoValor').value),
      enderecoEntrega: document.getElementById('pedidoEntrega').value,
      bairro: document.getElementById('pedidoBairro').value,
      formaPagamento: document.getElementById('pedidoPagamento').value,
      status: 'aguardando_entregador',
      created_at: Date.now()
    };

    await window.API.createPedido(novoPedido);
    
    Utils.showToast("Pedido enviado para a central!", "success");
    Utils.hideModal('novoPedidoModal');
    event.target.reset();
    await carregarDados();

  } catch (error) {
    Utils.showToast("Erro ao criar pedido", "error");
  } finally {
    btn.disabled = false;
  }
}

// Utilitário para o Select de Bairros (Toggle de Troco)
function toggleTroco() {
  const pag = document.getElementById('pedidoPagamento').value;
  const campo = document.getElementById('trocoGroup');
  if(campo) campo.style.display = pag === 'dinheiro' ? 'block' : 'none';
}

