/**
 * Element Modifier Pro - Background Service Worker
 * Gerencia estados, instalação e comunicação entre componentes
 */

// ============================================
// INSTALAÇÃO E ATUALIZAÇÃO
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Element Modifier Pro] Instalado/Atualizado:', details.reason);

  if (details.reason === 'install') {
    // Primeira instalação - configura valores padrão
    chrome.storage.sync.set({
      rules: getExampleRules(),
      globalEnabled: true,
      debug: false
    }, () => {
      console.log('[Element Modifier Pro] Configurações iniciais salvas');
    });
  }

  if (details.reason === 'update') {
    // Migração de dados se necessário
    migrateDataIfNeeded(details.previousVersion);
  }
});

// ============================================
// REGRAS DE EXEMPLO
// ============================================

function getExampleRules() {
  return [
    {
      id: generateId(),
      name: 'Exemplo - Desativar Autocomplete',
      description: 'Remove autocomplete de todos os inputs de texto',
      selector: 'input[type="text"], input[type="email"], input[type="password"]',
      urlPattern: '*',
      attributes: {
        autocomplete: 'off'
      },
      styles: {},
      properties: {},
      addClass: [],
      removeClass: [],
      enabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: generateId(),
      name: 'Exemplo - Destacar Links',
      description: 'Adiciona destaque visual a todos os links',
      selector: 'a[href]',
      urlPattern: '*',
      attributes: {},
      styles: {
        'text-decoration': 'underline',
        'text-decoration-color': '#0066cc'
      },
      properties: {},
      addClass: [],
      removeClass: [],
      enabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
}

// ============================================
// UTILITÁRIOS
// ============================================

function generateId() {
  return `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function migrateDataIfNeeded(previousVersion) {
  // Implementar migrações futuras aqui se necessário
  console.log('[Element Modifier Pro] Verificando migração de:', previousVersion);
}

// ============================================
// COMUNICAÇÃO
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Element Modifier Pro] Mensagem no background:', message);

  switch (message.action) {
    case 'createRule':
      createRule(message.rule).then(sendResponse);
      return true;

    case 'updateRule':
      updateRule(message.ruleId, message.updates).then(sendResponse);
      return true;

    case 'deleteRule':
      deleteRule(message.ruleId).then(sendResponse);
      return true;

    case 'getRules':
      getRules().then(sendResponse);
      return true;

    case 'exportRules':
      exportRules().then(sendResponse);
      return true;

    case 'importRules':
      importRules(message.rules).then(sendResponse);
      return true;

    case 'generateId':
      sendResponse({ id: generateId() });
      break;

    default:
      sendResponse({ status: 'unknown_action' });
  }
});

// ============================================
// CRUD DE REGRAS
// ============================================

async function getRules() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules'], (data) => {
      resolve({ status: 'ok', rules: data.rules || [] });
    });
  });
}

async function createRule(ruleData) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules'], (data) => {
      const rules = data.rules || [];
      
      const newRule = {
        id: generateId(),
        name: ruleData.name || 'Nova Regra',
        description: ruleData.description || '',
        selector: ruleData.selector || '',
        urlPattern: ruleData.urlPattern || '*',
        attributes: ruleData.attributes || {},
        styles: ruleData.styles || {},
        properties: ruleData.properties || {},
        addClass: ruleData.addClass || [],
        removeClass: ruleData.removeClass || [],
        enabled: ruleData.enabled !== false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      rules.push(newRule);

      chrome.storage.sync.set({ rules }, () => {
        if (chrome.runtime.lastError) {
          resolve({ status: 'error', message: chrome.runtime.lastError.message });
        } else {
          resolve({ status: 'ok', rule: newRule });
        }
      });
    });
  });
}

async function updateRule(ruleId, updates) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules'], (data) => {
      const rules = data.rules || [];
      const index = rules.findIndex(r => r.id === ruleId);

      if (index === -1) {
        resolve({ status: 'error', message: 'Regra não encontrada' });
        return;
      }

      rules[index] = {
        ...rules[index],
        ...updates,
        id: ruleId, // Mantém o ID original
        updatedAt: Date.now()
      };

      chrome.storage.sync.set({ rules }, () => {
        if (chrome.runtime.lastError) {
          resolve({ status: 'error', message: chrome.runtime.lastError.message });
        } else {
          resolve({ status: 'ok', rule: rules[index] });
        }
      });
    });
  });
}

async function deleteRule(ruleId) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules'], (data) => {
      const rules = data.rules || [];
      const filteredRules = rules.filter(r => r.id !== ruleId);

      if (rules.length === filteredRules.length) {
        resolve({ status: 'error', message: 'Regra não encontrada' });
        return;
      }

      chrome.storage.sync.set({ rules: filteredRules }, () => {
        if (chrome.runtime.lastError) {
          resolve({ status: 'error', message: chrome.runtime.lastError.message });
        } else {
          resolve({ status: 'ok' });
        }
      });
    });
  });
}

// ============================================
// IMPORTAÇÃO/EXPORTAÇÃO
// ============================================

async function exportRules() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['rules', 'globalEnabled'], (data) => {
      resolve({
        status: 'ok',
        data: {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          globalEnabled: data.globalEnabled,
          rules: data.rules || []
        }
      });
    });
  });
}

async function importRules(importData) {
  return new Promise((resolve) => {
    try {
      if (!importData || !Array.isArray(importData.rules)) {
        resolve({ status: 'error', message: 'Formato de importação inválido' });
        return;
      }

      // Regenera IDs para evitar conflitos
      const rules = importData.rules.map(rule => ({
        ...rule,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      chrome.storage.sync.get(['rules'], (data) => {
        const existingRules = data.rules || [];
        const mergedRules = [...existingRules, ...rules];

        chrome.storage.sync.set({ rules: mergedRules }, () => {
          if (chrome.runtime.lastError) {
            resolve({ status: 'error', message: chrome.runtime.lastError.message });
          } else {
            resolve({ status: 'ok', imported: rules.length });
          }
        });
      });
    } catch (e) {
      resolve({ status: 'error', message: e.message });
    }
  });
}

// ============================================
// BADGE E ÍCONE
// ============================================

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;

  if (changes.globalEnabled !== undefined) {
    updateBadge(changes.globalEnabled.newValue);
  }
});

function updateBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
  }
}

// Inicializa badge
chrome.storage.sync.get(['globalEnabled'], (data) => {
  updateBadge(data.globalEnabled !== false);
});
