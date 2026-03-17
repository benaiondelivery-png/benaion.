// ========================================
// BENAION DELIVERY - UTILITÁRIOS
// ========================================

const Utils = {
  // ========================================
  // TOAST NOTIFICATIONS
  // ========================================

  showToast(message, type = 'info', duration = 3000) {
    // Criar container se não existir
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Criar toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    
    toast.innerHTML = `
      <span style="font-size: 20px;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remover após duração
    setTimeout(() => {
      toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  },

  // ========================================
  // LOADING
  // ========================================

  showLoading(element, text = 'Carregando...') {
    element.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>${text}</p>
      </div>
    `;
  },

  showEmptyState(element, icon, title, text, buttonText = null, buttonAction = null) {
    element.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-text">${text}</p>
        ${buttonText ? `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>` : ''}
      </div>
    `;
  },

  // ========================================
  // FORMATAÇÃO
  // ========================================

  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
  },

  formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  },

  // ========================================
  // STATUS
  // ========================================

  getStatusText(status) {
    const statusMap = {
      'recebido': 'Recebido',
      'aguardando_entregador': 'Aguardando Entregador',
      'aceito': 'Aceito',
      'em_coleta': 'Em Coleta',
      'em_entrega': 'Em Entrega',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  },

  getStatusIcon(status) {
    const iconMap = {
      'recebido': '📋',
      'aguardando_entregador': '⏳',
      'aceito': '✅',
      'em_coleta': '🏪',
      'em_entrega': '🛵',
      'finalizado': '✓',
      'cancelado': '✕'
    };
    return iconMap[status] || '•';
  },

  // ========================================
  // VALIDAÇÃO
  // ========================================

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  },

  validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  },

  // ========================================
  // MÁSCARAS
  // ========================================

  maskPhone(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    return value;
  },

  maskCPF(value) {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
  },

  maskCurrency(value) {
    value = value.replace(/\D/g, '');
    value = (parseInt(value) / 100).toFixed(2);
    return value;
  },

  // ========================================
  // MODAL
  // ========================================

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // ========================================
  // GOOGLE MAPS
  // ========================================

  openGoogleMaps(origin, destination) {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    window.open(url, '_blank');
  },

  getAddressLink(address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  },

  // ========================================
  // NOTIFICAÇÕES DO NAVEGADOR
  // ========================================

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  },

  showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/images/icon-192.png',
        badge: '/images/icon-192.png',
        ...options
      });
    }
  },

  // ========================================
  // SHARE API
  // ========================================

  async share(title, text, url) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        return false;
      }
    } else {
      // Fallback: copiar link
      this.copyToClipboard(url);
      this.showToast('Link copiado!', 'success');
      return true;
    }
  },

  // ========================================
  // CLIPBOARD
  // ========================================

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  },

  // ========================================
  // GEOLOCALIZAÇÃO
  // ========================================

  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => resolve(position),
          error => reject(error)
        );
      } else {
        reject(new Error('Geolocalização não suportada'));
      }
    });
  },

  // ========================================
  // DEBOUNCE
  // ========================================

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // ========================================
  // GERAR ID ÚNICO
  // ========================================

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // ========================================
  // VIBRAÇÃO
  // ========================================

  vibrate(pattern = [200]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  // ========================================
  // SCROLL SUAVE
  // ========================================

  smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // ========================================
  // PLAY SOUND
  // ========================================

  playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjOG0fPTgjMGHGS67ejBZhIIQJfZ8+CRPwYTYLn');
    audio.play().catch(() => {});
  }
};

// Exportar para uso global
window.Utils = Utils;

// ========================================
// INICIALIZAÇÃO DE MÁSCARAS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Aplicar máscaras automaticamente
  document.querySelectorAll('input[data-mask="phone"]').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = Utils.maskPhone(e.target.value);
    });
  });

  document.querySelectorAll('input[data-mask="cpf"]').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = Utils.maskCPF(e.target.value);
    });
  });

  document.querySelectorAll('input[data-mask="currency"]').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = Utils.maskCurrency(e.target.value);
    });
  });
});
