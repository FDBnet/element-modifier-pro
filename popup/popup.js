/**
 * Element Modifier Pro - Popup Script
 * Gerencia a interface do usuário para configuração de regras
 * Suporte a internacionalização (i18n)
 */

(() => {
  'use strict';

  // ============================================
  // INTERNACIONALIZAÇÃO (i18n)
  // ============================================

  /**
   * Obtém mensagem traduzida
   */
  function getMessage(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || key;
  }

  /**
   * Aplica traduções a todos os elementos com data-i18n
   */
  function applyTranslations() {
    // Traduzir conteúdo de texto
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const message = getMessage(key);
      if (message && message !== key) {
        el.textContent = message;
      }
    });

    // Traduzir placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const message = getMessage(key);
      if (message && message !== key) {
        el.placeholder = message;
      }
    });

    // Traduzir títulos (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const message = getMessage(key);
      if (message && message !== key) {
        el.title = message;
      }
    });
  }

  /**
   * Configura direção do texto (RTL para hebraico)
   */
  function setupTextDirection() {
    const uiLanguage = chrome.i18n.getUILanguage();
    const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
    const isRTL = rtlLanguages.some(lang => uiLanguage.startsWith(lang));
    
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = uiLanguage;
    
    if (isRTL) {
      document.body.classList.add('rtl');
    }
  }

  // ============================================
  // ESTADO
  // ============================================

  let currentRules = [];
  let editingRuleId = null;

  // ============================================
  // ELEMENTOS DOM
  // ============================================

  const elements = {
    // Header
    globalToggle: document.getElementById('globalToggle'),
    statusBar: document.getElementById('statusBar'),
    
    // Tabs
    tabs: document.querySelectorAll('.tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    
    // Rules List
    rulesList: document.getElementById('rulesList'),
    emptyState: document.getElementById('emptyState'),
    addRuleBtn: document.getElementById('addRuleBtn'),
    reprocessBtn: document.getElementById('reprocessBtn'),
    
    // Editor
    ruleForm: document.getElementById('ruleForm'),
    ruleId: document.getElementById('ruleId'),
    ruleName: document.getElementById('ruleName'),
    ruleDescription: document.getElementById('ruleDescription'),
    ruleSelector: document.getElementById('ruleSelector'),
    ruleUrlPattern: document.getElementById('ruleUrlPattern'),
    ruleAddClass: document.getElementById('ruleAddClass'),
    ruleRemoveClass: document.getElementById('ruleRemoveClass'),
    ruleEnabled: document.getElementById('ruleEnabled'),
    testSelectorBtn: document.getElementById('testSelectorBtn'),
    selectorResult: document.getElementById('selectorResult'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    stylesContainer: document.getElementById('stylesContainer'),
    attributesContainer: document.getElementById('attributesContainer'),
    
    // Settings
    debugMode: document.getElementById('debugMode'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    storageInfo: document.getElementById('storageInfo')
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  async function init() {
    // Configurar direção do texto (RTL/LTR)
    setupTextDirection();
    
    // Aplicar traduções
    applyTranslations();
    
    // Carregar dados
    await loadSettings();
    await loadRules();
    await updatePageStatus();
    
    // Configurar eventos
    setupEventListeners();
    updateStorageInfo();
  }

  // ============================================
  // CARREGAR DADOS
  // ============================================

  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['globalEnabled', 'debug'], (data) => {
        elements.globalToggle.checked = data.globalEnabled !== false;
        elements.debugMode.checked = data.debug || false;
        resolve();
      });
    });
  }

  async function loadRules() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['rules'], (data) => {
        currentRules = data.rules || [];
        renderRulesList();
        resolve();
      });
    });
  }

  async function updatePageStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id || tab.url.startsWith('chrome://')) {
        elements.statusBar.innerHTML = `
          <span class="status-dot" style="background: var(--warning)"></span>
          <span class="status-text">${getMessage('pageNotSupported')}</span>
        `;
        elements.statusBar.classList.add('inactive');
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          elements.statusBar.innerHTML = `
            <span class="status-dot" style="background: var(--text-muted)"></span>
            <span class="status-text">${getMessage('extensionNotLoaded')}</span>
          `;
          elements.statusBar.classList.add('inactive');
          return;
        }

        const applicableCount = response.applicableRules || 0;
        elements.statusBar.innerHTML = `
          <span class="status-dot"></span>
          <span class="status-text">${getMessage('rulesActive', [applicableCount.toString()])}</span>
        `;
        elements.statusBar.classList.remove('inactive');
      });
    } catch (e) {
      console.error('Erro ao obter status:', e);
    }
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  function renderRulesList() {
    if (currentRules.length === 0) {
      elements.rulesList.style.display = 'none';
      elements.emptyState.style.display = 'block';
      return;
    }

    elements.rulesList.style.display = 'flex';
    elements.emptyState.style.display = 'none';

    elements.rulesList.innerHTML = currentRules.map(rule => {
      // Conta modificações
      const stylesCount = rule.styles ? Object.keys(rule.styles).length : 0;
      const attrsCount = rule.attributes ? Object.keys(rule.attributes).length : 0;
      const classesCount = (rule.addClass?.length || 0) + (rule.removeClass?.length || 0);
      const totalMods = stylesCount + attrsCount + classesCount;
      
      // Badge de modificações
      const modsBadge = totalMods > 0 
        ? `<span class="mods-badge" title="${stylesCount} estilos, ${attrsCount} atributos, ${classesCount} classes">${totalMods} mod${totalMods > 1 ? 's' : ''}</span>`
        : `<span class="mods-badge warning" title="Nenhuma modificação configurada">⚠️ vazio</span>`;
      
      return `
        <div class="rule-item ${rule.enabled ? '' : 'disabled'}" data-id="${rule.id}">
          <div class="rule-toggle">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} 
                   data-action="toggle" data-id="${rule.id}" 
                   title="${getMessage('ruleEnabled')}">
          </div>
          <div class="rule-info">
            <div class="rule-name">${escapeHtml(rule.name)} ${modsBadge}</div>
            <div class="rule-selector">${escapeHtml(rule.selector)}</div>
          </div>
          <div class="rule-actions">
            <button data-action="edit" data-id="${rule.id}" title="${getMessage('edit')}">✏️</button>
            <button data-action="duplicate" data-id="${rule.id}" title="${getMessage('duplicate')}">📋</button>
            <button class="delete-btn" data-action="delete" data-id="${rule.id}" title="${getMessage('delete')}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderKeyValueRows(container, data = {}) {
    container.innerHTML = '';
    
    Object.entries(data).forEach(([key, value]) => {
      addKeyValueRow(container, key, value);
    });
  }

  function addKeyValueRow(container, key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'key-value-row';
    
    // Determina se é container de estilos ou atributos
    const isStyles = container.id === 'stylesContainer';
    const keyPlaceholder = isStyles ? 'width' : 'data-id';
    const valuePlaceholder = isStyles ? '100%' : 'valor';
    
    row.innerHTML = `
      <input type="text" placeholder="${keyPlaceholder}" value="${escapeHtml(key)}" title="${getMessage('property')}">
      <input type="text" placeholder="${valuePlaceholder}" value="${escapeHtml(value)}" title="${getMessage('value')}">
      <button type="button" class="remove-row" title="${getMessage('delete')}">×</button>
    `;
    
    row.querySelector('.remove-row').addEventListener('click', () => {
      row.remove();
    });
    
    container.appendChild(row);
  }

  function getKeyValueData(container) {
    const data = {};
    container.querySelectorAll('.key-value-row').forEach(row => {
      const inputs = row.querySelectorAll('input');
      let key = inputs[0].value.trim();
      let value = inputs[1].value.trim();
      
      if (key) {
        // Sanitiza a propriedade: remove ":" do final se o usuário digitou
        key = key.replace(/:+$/, '').trim();
        
        // Sanitiza o valor: remove "!important" pois já é adicionado automaticamente
        value = value.replace(/!important\s*;?\s*$/i, '').trim();
        // Remove ";" do final se houver
        value = value.replace(/;+$/, '').trim();
        
        data[key] = value;
      }
    });
    return data;
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function setupEventListeners() {
    // Global Toggle
    elements.globalToggle.addEventListener('change', async (e) => {
      await chrome.storage.sync.set({ globalEnabled: e.target.checked });
      updatePageStatus();
    });

    // Tabs
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Rules List Actions
    elements.rulesList.addEventListener('click', handleRuleAction);
    elements.rulesList.addEventListener('change', handleRuleAction);

    // Toolbar
    elements.addRuleBtn.addEventListener('click', () => openEditor());
    elements.reprocessBtn.addEventListener('click', reprocessPage);

    // Editor
    elements.ruleForm.addEventListener('submit', handleFormSubmit);
    elements.cancelEditBtn.addEventListener('click', closeEditor);
    elements.testSelectorBtn.addEventListener('click', testSelector);

    // Add Key-Value buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const container = document.getElementById(btn.dataset.container);
        addKeyValueRow(container);
      });
    });

    // Settings
    elements.debugMode.addEventListener('change', async (e) => {
      await chrome.storage.sync.set({ debug: e.target.checked });
    });

    elements.exportBtn.addEventListener('click', exportRules);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importRules);
    elements.clearAllBtn.addEventListener('click', clearAllRules);

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.rules) {
        currentRules = changes.rules.newValue || [];
        renderRulesList();
        updatePageStatus();
      }
    });
  }

  // ============================================
  // HANDLERS
  // ============================================

  function handleRuleAction(e) {
    const action = e.target.dataset.action;
    const ruleId = e.target.dataset.id;

    if (!action || !ruleId) return;

    switch (action) {
      case 'toggle':
        toggleRule(ruleId, e.target.checked);
        break;
      case 'edit':
        editRule(ruleId);
        break;
      case 'duplicate':
        duplicateRule(ruleId);
        break;
      case 'delete':
        deleteRule(ruleId);
        break;
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const stylesData = getKeyValueData(elements.stylesContainer);
    const attributesData = getKeyValueData(elements.attributesContainer);
    
    const ruleData = {
      name: elements.ruleName.value.trim(),
      description: elements.ruleDescription.value.trim(),
      selector: elements.ruleSelector.value.trim(),
      urlPattern: elements.ruleUrlPattern.value.trim() || '*',
      styles: stylesData,
      attributes: attributesData,
      addClass: elements.ruleAddClass.value.split(',').map(s => s.trim()).filter(Boolean),
      removeClass: elements.ruleRemoveClass.value.split(',').map(s => s.trim()).filter(Boolean),
      enabled: elements.ruleEnabled.checked
    };

    // Debug: mostrar o que está sendo salvo
    console.log('[Element Modifier Pro] Salvando regra:', {
      name: ruleData.name,
      selector: ruleData.selector,
      styles: ruleData.styles,
      stylesCount: Object.keys(ruleData.styles).length,
      attributes: ruleData.attributes,
      attributesCount: Object.keys(ruleData.attributes).length
    });

    // Aviso se não houver modificações configuradas
    const hasModifications = 
      Object.keys(stylesData).length > 0 ||
      Object.keys(attributesData).length > 0 ||
      ruleData.addClass.length > 0 ||
      ruleData.removeClass.length > 0;
    
    if (!hasModifications) {
      const proceed = confirm(
        'Você não adicionou nenhuma modificação (estilos, atributos ou classes).\n\n' +
        'A regra será salva, mas não fará nenhuma alteração visual.\n\n' +
        'Deseja continuar mesmo assim?'
      );
      if (!proceed) return;
    }

    if (!ruleData.name || !ruleData.selector) {
      alert(getMessage('requiredFields'));
      return;
    }

    try {
      if (editingRuleId) {
        // Atualizar regra existente
        const index = currentRules.findIndex(r => r.id === editingRuleId);
        if (index !== -1) {
          currentRules[index] = {
            ...currentRules[index],
            ...ruleData,
            updatedAt: Date.now()
          };
        }
      } else {
        // Criar nova regra
        const newRule = {
          id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          ...ruleData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        currentRules.push(newRule);
      }

      await chrome.storage.sync.set({ rules: currentRules });
      console.log('[Element Modifier Pro] Regras salvas no storage:', currentRules);
      closeEditor();
      renderRulesList();
      updateStorageInfo();
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      alert(`${getMessage('saveError')}: ${error.message}`);
    }
  }

  // ============================================
  // OPERAÇÕES DE REGRAS
  // ============================================

  async function toggleRule(ruleId, enabled) {
    const rule = currentRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.updatedAt = Date.now();
      await chrome.storage.sync.set({ rules: currentRules });
      renderRulesList();
      updatePageStatus();
    }
  }

  function editRule(ruleId) {
    const rule = currentRules.find(r => r.id === ruleId);
    if (!rule) return;

    editingRuleId = ruleId;
    
    elements.ruleName.value = rule.name || '';
    elements.ruleDescription.value = rule.description || '';
    elements.ruleSelector.value = rule.selector || '';
    elements.ruleUrlPattern.value = rule.urlPattern || '*';
    elements.ruleAddClass.value = (rule.addClass || []).join(', ');
    elements.ruleRemoveClass.value = (rule.removeClass || []).join(', ');
    elements.ruleEnabled.checked = rule.enabled !== false;

    renderKeyValueRows(elements.stylesContainer, rule.styles || {});
    renderKeyValueRows(elements.attributesContainer, rule.attributes || {});

    switchTab('editor');
  }

  async function duplicateRule(ruleId) {
    const rule = currentRules.find(r => r.id === ruleId);
    if (!rule) return;

    const newRule = {
      ...JSON.parse(JSON.stringify(rule)),
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `${rule.name} ${getMessage('copy')}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    currentRules.push(newRule);
    await chrome.storage.sync.set({ rules: currentRules });
    renderRulesList();
    updateStorageInfo();
  }

  async function deleteRule(ruleId) {
    if (!confirm(getMessage('confirmDelete'))) return;

    currentRules = currentRules.filter(r => r.id !== ruleId);
    await chrome.storage.sync.set({ rules: currentRules });
    renderRulesList();
    updatePageStatus();
    updateStorageInfo();
  }

  // ============================================
  // EDITOR
  // ============================================

  function openEditor(ruleData = null) {
    editingRuleId = null;
    elements.ruleForm.reset();
    elements.selectorResult.textContent = '';
    elements.stylesContainer.innerHTML = '';
    elements.attributesContainer.innerHTML = '';
    elements.ruleEnabled.checked = true;
    
    if (ruleData) {
      // Preencher com dados fornecidos
      Object.entries(ruleData).forEach(([key, value]) => {
        const input = document.getElementById(`rule${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (input) input.value = value;
      });
    }
    
    switchTab('editor');
    elements.ruleName.focus();
  }

  function closeEditor() {
    editingRuleId = null;
    elements.ruleForm.reset();
    elements.stylesContainer.innerHTML = '';
    elements.attributesContainer.innerHTML = '';
    switchTab('rules');
  }

  async function testSelector() {
    const selector = elements.ruleSelector.value.trim();
    
    if (!selector) {
      elements.selectorResult.textContent = getMessage('selectorRequired');
      elements.selectorResult.className = 'helper-text error';
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        elements.selectorResult.textContent = getMessage('cannotTestOnPage');
        elements.selectorResult.className = 'helper-text error';
        return;
      }

      // Usa chrome.scripting.executeScript para executar diretamente na página
      // Isso é mais confiável do que enviar mensagens
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: (sel) => {
          try {
            // Busca normal
            const elements = document.querySelectorAll(sel);
            let count = elements.length;
            
            // Se é seletor de ID, também busca por atributo (IDs duplicados)
            if (sel.startsWith('#') && !sel.includes(' ') && !sel.includes('.')) {
              const id = sel.substring(1);
              const byAttr = document.querySelectorAll(`[id="${id}"]`);
              byAttr.forEach(el => {
                if (!Array.from(elements).includes(el)) {
                  count++;
                }
              });
            }
            
            // Pega info do primeiro elemento para preview
            const first = elements[0];
            const preview = first ? {
              tag: first.tagName.toLowerCase(),
              id: first.id || null,
              classes: first.className ? first.className.split(' ').slice(0, 2).join(' ') : null
            } : null;
            
            return { count, preview, isIframe: window !== window.top };
          } catch (e) {
            return { error: e.message };
          }
        },
        args: [selector]
      });

      // Soma resultados de todos os frames
      let totalCount = 0;
      let mainCount = 0;
      let iframeCount = 0;
      let preview = null;
      let hasError = false;
      let errorMsg = '';

      for (const result of results) {
        if (result.result) {
          if (result.result.error) {
            hasError = true;
            errorMsg = result.result.error;
          } else {
            totalCount += result.result.count;
            if (result.result.isIframe) {
              iframeCount += result.result.count;
            } else {
              mainCount += result.result.count;
              if (!preview && result.result.preview) {
                preview = result.result.preview;
              }
            }
          }
        }
      }

      if (hasError && totalCount === 0) {
        elements.selectorResult.textContent = `${getMessage('selectorInvalid')}: ${errorMsg}`;
        elements.selectorResult.className = 'helper-text error';
        return;
      }

      // Monta texto do resultado
      let resultText = `✓ ${getMessage('elementsFound', [totalCount.toString()])}`;
      
      if (iframeCount > 0) {
        resultText += ` (${mainCount} main + ${iframeCount} iframe)`;
      }
      
      if (preview) {
        const parts = [preview.tag];
        if (preview.id) parts.push(`#${preview.id}`);
        if (preview.classes) parts.push(`.${preview.classes.split(' ')[0]}`);
        resultText += ` → ${parts.join('')}`;
      }
      
      elements.selectorResult.textContent = resultText;
      elements.selectorResult.className = totalCount > 0 ? 'helper-text success' : 'helper-text error';

    } catch (e) {
      console.error('[Element Modifier Pro] Erro ao testar seletor:', e);
      
      // Fallback: tenta o método antigo com sendMessage
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'testSelector', selector }, (response) => {
          if (chrome.runtime.lastError || !response) {
            elements.selectorResult.textContent = getMessage('testError') + ' - ' + (chrome.runtime.lastError?.message || 'sem resposta');
            elements.selectorResult.className = 'helper-text error';
            return;
          }
          
          if (response.status === 'error') {
            elements.selectorResult.textContent = `${getMessage('selectorInvalid')}: ${response.message}`;
            elements.selectorResult.className = 'helper-text error';
          } else {
            elements.selectorResult.textContent = `✓ ${getMessage('elementsFound', [response.count.toString()])}`;
            elements.selectorResult.className = response.count > 0 ? 'helper-text success' : 'helper-text error';
          }
        });
      } catch (fallbackError) {
        elements.selectorResult.textContent = getMessage('testError');
        elements.selectorResult.className = 'helper-text error';
      }
    }
  }

  // ============================================
  // TABS
  // ============================================

  function switchTab(tabName) {
    elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    elements.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });
  }

  // ============================================
  // SETTINGS ACTIONS
  // ============================================

  async function exportRules() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      rules: currentRules
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `element-modifier-rules-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  async function importRules(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.rules || !Array.isArray(data.rules)) {
        throw new Error(getMessage('invalidFileFormat'));
      }

      const count = data.rules.length;
      if (!confirm(getMessage('confirmImport', [count.toString()]))) {
        return;
      }

      // Regenera IDs para evitar conflitos
      const importedRules = data.rules.map(rule => ({
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      currentRules = [...currentRules, ...importedRules];
      await chrome.storage.sync.set({ rules: currentRules });
      
      renderRulesList();
      updateStorageInfo();
      alert(getMessage('importSuccess', [count.toString()]));
    } catch (error) {
      alert(`${getMessage('importError')}: ${error.message}`);
    }

    // Reset input
    e.target.value = '';
  }

  async function clearAllRules() {
    if (!confirm(getMessage('confirmClearAll'))) {
      return;
    }

    currentRules = [];
    await chrome.storage.sync.set({ rules: [] });
    renderRulesList();
    updatePageStatus();
    updateStorageInfo();
  }

  async function reprocessPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) return;

      chrome.tabs.sendMessage(tab.id, { action: 'reprocess' }, () => {
        updatePageStatus();
      });
    } catch (e) {
      console.error('Erro ao reprocessar:', e);
    }
  }

  function updateStorageInfo() {
    chrome.storage.sync.getBytesInUse(null, (bytes) => {
      const maxBytes = chrome.storage.sync.QUOTA_BYTES || 102400;
      const percentage = ((bytes / maxBytes) * 100).toFixed(1);
      elements.storageInfo.textContent = `${getMessage('storage')}: ${formatBytes(bytes)} / ${formatBytes(maxBytes)} (${percentage}%)`;
    });
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  // ============================================
  // INICIAR
  // ============================================

  document.addEventListener('DOMContentLoaded', init);

})();
