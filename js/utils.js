// ========================================
// BENAION DELIVERY - UTILITÁRIOS (V1.7.0)
// ========================================

const Utils = {
  // ========================================
  // TOAST NOTIFICATIONS (Alertas rápidos)
  // ========================================
  showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Ícones FontAwesome para combinar com seu novo HTML
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
      <i class="fas ${icons[type] || icons.info}" style="font-size: 18px;"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
      setTimeout(() => {
        toast.remove();
        if (container.children && container.children.length === 0) container.remove();
      }, 300);
    }, duration);
  },

  // ========================================
  // MODAIS (Abertura e Fechamento)
  // ========================================
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden'); // Compatível com seu HTML novo
      modal.style.display = 'flex'; 
      setTimeout(() => modal.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    }
  },

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }
  },

  // ========================================
  // GOOGLE MAPS (CORRIGIDO)
  // ========================================
  openGoogleMaps(origin, destination) {
    // URL universal para navegação GPS
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=motorcycle`;
    window.open(url, '_blank');
  },

  getAddressLink(address) {
    // URL para busca direta de endereço
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  },

  // ========================================
  // LÓGICA BENAION (Tempo e Dinheiro)
  // ========================================
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  },

  // Regra dos 30 centavos após 3 minutos no mercado
  calcularAdicionalTempo(dataInicio) {
    if (!dataInicio) return 0;
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diffMs = agora - inicio;
    const diffMinutos = Math.floor(diffMs / 60000);

    if (diffMinutos > 3) {
      return (diffMinutos - 3) * 0.30;
    }
    return 0;
  },

  // ========================================
  // STATUS E COMUNICAÇÃO
  // ========================================
  getStatusText(status) {
    const statusMap = {
      'pendente': 'Aguardando Loja',
      'preparando': 'Loja Separando Itens',
      'pronto': 'Pronto para Coleta',
      'aceito': 'Entregador a caminho',
      'em_entrega': 'Em Rota de Entrega',
      'finalizado': 'Entregue ✅',
      'cancelado': 'Cancelado ✕'
    };
    return statusMap[status] || status;
  },

  openWhatsApp(tel, mensagem) {
    const link = `https://wa.me/55${tel.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
  },

  vibrate(pattern = [200]) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }
};

window.Utils = Utils;
