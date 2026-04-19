// cliente.js
let pedidosCliente = [];

async function initCliente() {
  if (window.Auth && window.API) {
    window.Auth.requireAuth(['cliente']); // Garante que só clientes acessam
    const user = window.Auth.getCurrentUser();
    document.getElementById('nomeUsuario').textContent = user.name;
    
    await carregarMeusPedidos();
  } else {
    setTimeout(initCliente, 500);
  }
}

async function carregarMeusPedidos() {
  const user = window.Auth.getCurrentUser();
  // Busca pedidos onde o clienteId é o do usuário logado
  const todos = await window.API.getPedidos(); 
  pedidosCliente = todos.data.filter(p => p.clienteId === user.id);
  renderizarInterface();
}

function renderizarInterface() {
  // Lógica de manipulação de DOM (innerHTML) para mostrar os pedidos
}

document.addEventListener('DOMContentLoaded', initCliente);

