// ========================================
// BENAION DELIVERY - SISTEMA DE AUTENTICAÇÃO
// ========================================

const Auth = {
  // Chave para armazenar dados do usuário no localStorage
  storageKey: 'benaion_user',

  // ========================================
  // VERIFICAR SE ESTÁ LOGADO
  // ========================================

  isAuthenticated() {
    return localStorage.getItem(this.storageKey) !== null;
  },

  // ========================================
  // OBTER USUÁRIO ATUAL
  // ========================================

  getCurrentUser() {
    const userData = localStorage.getItem(this.storageKey);
    return userData ? JSON.parse(userData) : null;
  },

  // ========================================
  // SALVAR USUÁRIO
  // ========================================

  setCurrentUser(user) {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  },

  // ========================================
  // LOGOUT
  // ========================================

  logout() {
    // Se for entregador, marcar como offline
    const user = this.getCurrentUser();
    if (user && user.userType === 'entregador') {
      API.updateUser(user.id, { online: false }).catch(console.error);
    }

    localStorage.removeItem(this.storageKey);
    window.location.href = '/';
  },

  // ========================================
  // LOGIN COM EMAIL E SENHA
  // ========================================

  async loginWithEmail(email, password) {
    try {
      // Buscar usuário por email
      const user = await API.getUserByEmail(email);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha (em produção, use hash!)
      if (user.password !== password) {
        throw new Error('Senha incorreta');
      }

      // Verificar se está ativo
      if (user.status !== 'ativo') {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
      }

      // Se for entregador, marcar como online
      if (user.userType === 'entregador') {
        await API.updateUser(user.id, { online: true });
        user.online = true;
      }

      // Salvar usuário logado
      this.setCurrentUser(user);

      return user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  // ========================================
  // LOGIN COM GOOGLE (SIMULADO)
  // ========================================

  async loginWithGoogle() {
    try {
      // Em produção, use a API do Google
      // Aqui vamos simular o login
      
      Utils.showToast('Login com Google não está disponível na versão demo. Use email e senha.', 'warning');
      
      // Código para produção:
      /*
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const googleUser = result.user;
      
      // Verificar se usuário existe
      let user = await API.getUserByEmail(googleUser.email);
      
      if (!user) {
        // Criar novo usuário
        user = await API.createUser({
          name: googleUser.displayName,
          email: googleUser.email,
          phone: googleUser.phoneNumber || '',
          userType: 'cliente',
          status: 'ativo',
          photo: googleUser.photoURL || '',
          online: false,
          totalDeliveries: 0
        });
      }
      
      this.setCurrentUser(user);
      return user;
      */
      
      return null;
    } catch (error) {
      console.error('Erro no login com Google:', error);
      throw error;
    }
  },

  // ========================================
  // REGISTRO DE NOVO USUÁRIO
  // ========================================

  async register(data) {
    try {
      // Verificar se email já existe
      const existingUser = await API.getUserByEmail(data.email);
      
      if (existingUser) {
        throw new Error('Este email já está cadastrado');
      }

      // Criar novo usuário
      const newUser = await API.createUser({
        name: data.name,
        email: data.email,
        password: data.password, // Em produção, use hash!
        phone: data.phone || '',
        userType: data.userType || 'cliente',
        status: 'ativo',
        address: data.address || '',
        photo: '',
        online: false,
        totalDeliveries: 0
      });

      // Fazer login automaticamente
      this.setCurrentUser(newUser);

      return newUser;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  // ========================================
  // VERIFICAR PERMISSÕES
  // ========================================

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.userType === role;
  },

  isAdmin() {
    return this.hasRole('admin');
  },

  isEntregador() {
    return this.hasRole('entregador');
  },

  isParceiro() {
    return this.hasRole('parceiro');
  },

  isCliente() {
    return this.hasRole('cliente');
  },

  // ========================================
  // REDIRECIONAR PARA PÁGINA CORRETA
  // ========================================

  redirectToDashboard() {
    const user = this.getCurrentUser();
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    switch (user.userType) {
      case 'admin':
        window.location.href = '/admin.html';
        break;
      case 'entregador':
        window.location.href = '/entregador.html';
        break;
      case 'parceiro':
        window.location.href = '/parceiro.html';
        break;
      case 'cliente':
        window.location.href = '/cliente.html';
        break;
      default:
        window.location.href = '/';
    }
  },

  // ========================================
  // PROTEGER PÁGINA
  // ========================================

  requireAuth(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      window.location.href = '/';
      return false;
    }

    const user = this.getCurrentUser();
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
      Utils.showToast('Você não tem permissão para acessar esta página', 'error');
      this.redirectToDashboard();
      return false;
    }

    return true;
  }
};

// Exportar para uso global
window.Auth = Auth;
