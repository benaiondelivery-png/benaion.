// ========================================
// BENAION DELIVERY - API CLIENT
// ========================================

const API = {
  // Base URL para as APIs da tabela
  baseURL: 'tables',

  // ========================================
  // MÉTODOS GENÉRICOS
  // ========================================

  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // DELETE retorna 204 sem conteúdo
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  },

  // ========================================
  // USUÁRIOS
  // ========================================

  async getUsers(page = 1, limit = 100) {
    return await this.request(`${this.baseURL}/users?page=${page}&limit=${limit}`);
  },

  async getUser(id) {
    return await this.request(`${this.baseURL}/users/${id}`);
  },

  async createUser(data) {
    return await this.request(`${this.baseURL}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateUser(id, data) {
    return await this.request(`${this.baseURL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteUser(id) {
    return await this.request(`${this.baseURL}/users/${id}`, {
      method: 'DELETE'
    });
  },

  async getUserByEmail(email) {
    const result = await this.request(`${this.baseURL}/users?search=${email}&limit=1`);
    return result.data && result.data.length > 0 ? result.data[0] : null;
  },

  async getEntregadoresOnline() {
    const result = await this.getUsers(1, 100);
    return result.data.filter(user => user.userType === 'entregador' && user.online && user.status === 'ativo');
  },

  // ========================================
  // PEDIDOS
  // ========================================

  async getPedidos(page = 1, limit = 100, status = null) {
    let url = `${this.baseURL}/pedidos?page=${page}&limit=${limit}&sort=-created_at`;
    if (status) {
      url += `&search=${status}`;
    }
    return await this.request(url);
  },

  async getPedido(id) {
    return await this.request(`${this.baseURL}/pedidos/${id}`);
  },

  async createPedido(data) {
    return await this.request(`${this.baseURL}/pedidos`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'recebido'
      })
    });
  },

  async updatePedido(id, data) {
    return await this.request(`${this.baseURL}/pedidos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deletePedido(id) {
    return await this.request(`${this.baseURL}/pedidos/${id}`, {
      method: 'DELETE'
    });
  },

  async getPedidosByUser(userId, userType) {
    const result = await this.getPedidos(1, 100);
    
    if (userType === 'cliente') {
      return result.data.filter(p => p.clienteId === userId);
    } else if (userType === 'entregador') {
      return result.data.filter(p => p.entregadorId === userId);
    } else if (userType === 'parceiro') {
      return result.data.filter(p => p.parceiroId === userId);
    }
    
    return result.data;
  },

  async getPedidosDisponiveis() {
    const result = await this.getPedidos(1, 100);
    return result.data.filter(p => p.status === 'aguardando_entregador');
  },

  async aceitarPedido(pedidoId, entregadorId, entregadorNome) {
    return await this.updatePedido(pedidoId, {
      entregadorId,
      entregadorNome,
      status: 'aceito'
    });
  },

  async atualizarStatusPedido(pedidoId, status) {
    return await this.updatePedido(pedidoId, { status });
  },

  // ========================================
  // PARCEIROS
  // ========================================

  async getParceiros(page = 1, limit = 100) {
    return await this.request(`${this.baseURL}/parceiros?page=${page}&limit=${limit}`);
  },

  async getParceiro(id) {
    return await this.request(`${this.baseURL}/parceiros/${id}`);
  },

  async createParceiro(data) {
    return await this.request(`${this.baseURL}/parceiros`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateParceiro(id, data) {
    return await this.request(`${this.baseURL}/parceiros/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteParceiro(id) {
    return await this.request(`${this.baseURL}/parceiros/${id}`, {
      method: 'DELETE'
    });
  },

  async getParceiroByUserId(userId) {
    const result = await this.getParceiros(1, 100);
    return result.data.find(p => p.userId === userId);
  },

  // ========================================
  // ENDEREÇOS
  // ========================================

  async getEnderecos(userId) {
    const result = await this.request(`${this.baseURL}/enderecos?search=${userId}&limit=100`);
    return result.data.filter(e => e.userId === userId);
  },

  async createEndereco(data) {
    return await this.request(`${this.baseURL}/enderecos`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEndereco(id, data) {
    return await this.request(`${this.baseURL}/enderecos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async deleteEndereco(id) {
    return await this.request(`${this.baseURL}/enderecos/${id}`, {
      method: 'DELETE'
    });
  },

  // ========================================
  // NOTIFICAÇÕES
  // ========================================

  async getNotificacoes(userId) {
    const result = await this.request(`${this.baseURL}/notificacoes?search=${userId}&limit=100&sort=-created_at`);
    return result.data.filter(n => n.userId === userId);
  },

  async createNotificacao(data) {
    return await this.request(`${this.baseURL}/notificacoes`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        lida: false
      })
    });
  },

  async marcarNotificacaoLida(id) {
    return await this.request(`${this.baseURL}/notificacoes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ lida: true })
    });
  },

  async marcarTodasLidas(userId) {
    const notificacoes = await this.getNotificacoes(userId);
    const naoLidas = notificacoes.filter(n => !n.lida);
    
    await Promise.all(
      naoLidas.map(n => this.marcarNotificacaoLida(n.id))
    );
  },

  // ========================================
  // ESTATÍSTICAS
  // ========================================

  async getEstatisticas() {
    const [pedidosResult, usersResult] = await Promise.all([
      this.getPedidos(1, 1000),
      this.getUsers(1, 1000)
    ]);

    const pedidos = pedidosResult.data;
    const users = usersResult.data;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    return {
      pedidosHoje: pedidos.filter(p => new Date(p.created_at) >= hoje).length,
      pedidosSemana: pedidos.filter(p => new Date(p.created_at) >= inicioSemana).length,
      pedidosMes: pedidos.filter(p => new Date(p.created_at) >= inicioMes).length,
      pedidosTotal: pedidos.length,
      pedidosAtivos: pedidos.filter(p => !['finalizado', 'cancelado'].includes(p.status)).length,
      entregadoresOnline: users.filter(u => u.userType === 'entregador' && u.online).length,
      entregadoresTotal: users.filter(u => u.userType === 'entregador').length,
      clientesTotal: users.filter(u => u.userType === 'cliente').length,
      parceirosTotal: users.filter(u => u.userType === 'parceiro').length
    };
  },

  async getEstatisticasEntregador(entregadorId) {
    const result = await this.getPedidos(1, 1000);
    const pedidos = result.data.filter(p => p.entregadorId === entregadorId && p.status === 'finalizado');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    return {
      hoje: pedidos.filter(p => new Date(p.created_at) >= hoje).length,
      semana: pedidos.filter(p => new Date(p.created_at) >= inicioSemana).length,
      mes: pedidos.filter(p => new Date(p.created_at) >= inicioMes).length,
      total: pedidos.length
    };
  }
};

// Exportar para uso global
window.API = API;
