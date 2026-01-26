/**
 * Element Modifier Pro - Content Script
 * Modifica elementos HTML baseado em configurações salvas no chrome.storage.sync
 * Suporte aprimorado para iframes, IDs duplicados e elementos dinâmicos
 */

(() => {
  'use strict';

  // ============================================
  // ESTADO E CONFIGURAÇÕES
  // ============================================
  
  let CONFIG = {
    rules: [],
    globalEnabled: true,
    debounceDelay: 50,
    debug: false
  };

  // Usar Map para rastrear elementos processados por regra
  const processedMap = new WeakMap();
  let observer = null;
  let isInitialized = false;
  
  // Identificador único para este contexto (útil para debug em iframes)
  const contextId = Math.random().toString(36).substring(2, 8);
  const isIframe = window !== window.top;

  // ============================================
  // UTILITÁRIOS
  // ============================================

  function log(...args) {
    if (CONFIG.debug) {
      const prefix = isIframe ? `[EMP:${contextId}:iframe]` : `[EMP:${contextId}:main]`;
      console.log(prefix, ...args);
    }
  }

  function warn(...args) {
    const prefix = isIframe ? `[EMP:${contextId}:iframe]` : `[EMP:${contextId}:main]`;
    console.warn(prefix, ...args);
  }

  function getCurrentHost() {
    return window.location.hostname;
  }

  function matchesUrlPattern(pattern, url) {
    if (!pattern || pattern === '*' || pattern === '<all_urls>') {
      return true;
    }
    
    try {
      // Converte padrão simples para regex
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escapa caracteres especiais
        .replace(/\*/g, '.*');  // Converte * para .*
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(url) || regex.test(getCurrentHost());
    } catch (e) {
      warn('Padrão de URL inválido:', pattern);
      return false;
    }
  }

  function getApplicableRules() {
    const currentUrl = window.location.href;
    const currentHost = getCurrentHost();
    
    return CONFIG.rules.filter(rule => {
      if (!rule.enabled) return false;
      if (!rule.urlPattern) return true;
      
      return matchesUrlPattern(rule.urlPattern, currentUrl) || 
             matchesUrlPattern(rule.urlPattern, currentHost);
    });
  }
  
  /**
   * Verifica se um elemento já foi processado para uma regra específica
   */
  function wasProcessed(element, ruleId) {
    const processed = processedMap.get(element);
    return processed && processed.has(ruleId);
  }
  
  /**
   * Marca elemento como processado para uma regra
   */
  function markProcessed(element, ruleId) {
    let processed = processedMap.get(element);
    if (!processed) {
      processed = new Set();
      processedMap.set(element, processed);
    }
    processed.add(ruleId);
  }
  
  /**
   * Busca elementos de forma robusta, lidando com IDs duplicados
   */
  function findElements(selector, root = document) {
    const elements = [];
    
    try {
      // Tenta querySelectorAll normal primeiro
      const found = root.querySelectorAll(selector);
      found.forEach(el => elements.push(el));
      
      // Se é um seletor de ID e encontrou apenas 1, verifica se há duplicados
      if (selector.startsWith('#') && !selector.includes(' ') && !selector.includes('.')) {
        const id = selector.substring(1);
        // Busca por atributo para encontrar IDs duplicados
        const byAttribute = root.querySelectorAll(`[id="${id}"]`);
        byAttribute.forEach(el => {
          if (!elements.includes(el)) {
            elements.push(el);
          }
        });
      }
    } catch (e) {
      warn(`Seletor inválido: "${selector}"`, e.message);
    }
    
    return elements;
  }

  // ============================================
  // APLICAÇÃO DE MODIFICAÇÕES
  // ============================================

  function applyModifications(element, rule) {
    // Verifica se já foi processado para esta regra
    if (wasProcessed(element, rule.id)) {
      return false;
    }

    try {
      let modified = false;
      const changes = []; // Para debug detalhado
      
      // Modificar atributos
      if (rule.attributes && typeof rule.attributes === 'object' && Object.keys(rule.attributes).length > 0) {
        for (const [attr, value] of Object.entries(rule.attributes)) {
          if (value === null || value === '') {
            if (element.hasAttribute(attr)) {
              element.removeAttribute(attr);
              changes.push(`attr:${attr}=REMOVED`);
              modified = true;
            }
          } else {
            const currentValue = element.getAttribute(attr);
            if (currentValue !== String(value)) {
              element.setAttribute(attr, String(value));
              changes.push(`attr:${attr}="${value}"`);
              modified = true;
            }
          }
        }
      }

      // Modificar estilos
      if (rule.styles && typeof rule.styles === 'object' && Object.keys(rule.styles).length > 0) {
        for (const [prop, value] of Object.entries(rule.styles)) {
          if (!prop || prop.trim() === '') continue;
          
          // Converte camelCase para kebab-case se necessário
          let cssProp = prop.trim();
          if (cssProp.match(/[A-Z]/)) {
            cssProp = cssProp.replace(/([A-Z])/g, '-$1').toLowerCase();
          }
          
          if (value === null || value === '') {
            element.style.removeProperty(cssProp);
            changes.push(`style:${cssProp}=REMOVED`);
            modified = true;
          } else {
            // Aplica com !important para garantir que sobrescreva CSS externo
            const valueStr = String(value).trim();
            const hasImportant = valueStr.toLowerCase().includes('!important');
            const finalValue = hasImportant ? valueStr : valueStr;
            const priority = hasImportant ? '' : 'important';
            
            try {
              element.style.setProperty(cssProp, finalValue.replace(/!important/gi, '').trim(), priority);
              changes.push(`style:${cssProp}="${finalValue}" !important`);
              modified = true;
              
              // Verificação imediata
              const appliedValue = element.style.getPropertyValue(cssProp);
              if (!appliedValue) {
                warn(`⚠️ Estilo não foi aplicado: ${cssProp}. Verificar se a propriedade é válida.`);
              }
            } catch (styleError) {
              warn(`Erro ao aplicar estilo ${cssProp}:`, styleError.message);
            }
          }
        }
      }

      // Modificar propriedades DOM
      if (rule.properties && typeof rule.properties === 'object' && Object.keys(rule.properties).length > 0) {
        for (const [prop, value] of Object.entries(rule.properties)) {
          try {
            if (element[prop] !== value) {
              element[prop] = value;
              changes.push(`prop:${prop}=${value}`);
              modified = true;
            }
          } catch (e) {
            warn(`Não foi possível definir propriedade "${prop}":`, e.message);
          }
        }
      }

      // Adicionar classes
      if (rule.addClass && rule.addClass.length > 0) {
        const classes = Array.isArray(rule.addClass) ? rule.addClass : [rule.addClass];
        classes.forEach(cls => {
          if (cls && typeof cls === 'string' && cls.trim() && !element.classList.contains(cls.trim())) {
            element.classList.add(cls.trim());
            changes.push(`class:+${cls.trim()}`);
            modified = true;
          }
        });
      }

      // Remover classes
      if (rule.removeClass && rule.removeClass.length > 0) {
        const classes = Array.isArray(rule.removeClass) ? rule.removeClass : [rule.removeClass];
        classes.forEach(cls => {
          if (cls && typeof cls === 'string' && cls.trim() && element.classList.contains(cls.trim())) {
            element.classList.remove(cls.trim());
            changes.push(`class:-${cls.trim()}`);
            modified = true;
          }
        });
      }

      // Modificar texto interno (cuidado: substitui todo o conteúdo)
      if (rule.textContent !== undefined && rule.textContent !== null) {
        if (element.textContent !== String(rule.textContent)) {
          element.textContent = String(rule.textContent);
          changes.push(`text:"${String(rule.textContent).substring(0, 20)}..."`);
          modified = true;
        }
      }

      // Marca como processado para esta regra
      markProcessed(element, rule.id);
      
      // Log detalhado
      if (CONFIG.debug) {
        const elementDesc = element.tagName + 
          (element.id ? '#' + element.id : '') + 
          (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ')[0] : '');
        
        if (changes.length > 0) {
          log(`✓ MODIFICADO [${rule.name}]`, {
            selector: rule.selector,
            element: elementDesc,
            changes: changes,
            styleAttr: element.getAttribute('style') || '(vazio)'
          });
        } else {
          log(`○ SEM MUDANÇAS [${rule.name}]`, {
            selector: rule.selector,
            element: elementDesc,
            reason: 'Nenhum estilo/atributo configurado ou valores já aplicados',
            ruleStyles: rule.styles,
            ruleAttributes: rule.attributes
          });
        }
      }
      
      return modified;
    } catch (error) {
      warn('Erro ao modificar elemento:', error.message, element);
      return false;
    }
  }

  function processElements(root = document) {
    if (!CONFIG.globalEnabled) return { total: 0, modified: 0 };
    
    const rules = getApplicableRules();
    let totalFound = 0;
    let totalModified = 0;
    
    for (const rule of rules) {
      const elements = findElements(rule.selector, root);
      totalFound += elements.length;
      
      elements.forEach(el => {
        if (applyModifications(el, rule)) {
          totalModified++;
        }
      });
      
      if (CONFIG.debug && elements.length > 0) {
        log(`Regra "${rule.name}" (${rule.selector}): ${elements.length} elemento(s) encontrado(s)`);
      }
    }
    
    return { total: totalFound, modified: totalModified };
  }

  function processNode(node) {
    if (!CONFIG.globalEnabled) return;
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const rules = getApplicableRules();

    for (const rule of rules) {
      try {
        // Verifica se o próprio nó corresponde ao seletor
        if (node.matches && node.matches(rule.selector)) {
          applyModifications(node, rule);
        }
        
        // Também verifica por ID se for um seletor de ID
        if (rule.selector.startsWith('#') && !rule.selector.includes(' ')) {
          const id = rule.selector.substring(1);
          if (node.id === id) {
            applyModifications(node, rule);
          }
        }
      } catch (e) {
        // matches() pode falhar com seletores inválidos
      }
    }

    // Processa filhos do nó
    processElements(node);
  }

  // ============================================
  // MUTATION OBSERVER
  // ============================================

  function setupMutationObserver() {
    if (observer) {
      observer.disconnect();
    }

    let timeoutId = null;
    let pendingNodes = [];

    observer = new MutationObserver((mutations) => {
      if (!CONFIG.globalEnabled) return;

      // Coleta nós adicionados
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              pendingNodes.push(node);
            }
          }
        }
      }

      // Debounce: processa todos de uma vez
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const nodesToProcess = [...pendingNodes];
        pendingNodes = [];
        timeoutId = null;

        nodesToProcess.forEach(processNode);
      }, CONFIG.debounceDelay);
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      log('MutationObserver ativado');
    }

    return observer;
  }

  // ============================================
  // STORAGE E SINCRONIZAÇÃO
  // ============================================

  async function loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['rules', 'globalEnabled', 'debug'], (data) => {
        if (chrome.runtime.lastError) {
          warn('Erro ao carregar configurações:', chrome.runtime.lastError);
          resolve(getDefaultConfig());
          return;
        }

        CONFIG.rules = data.rules || [];
        CONFIG.globalEnabled = data.globalEnabled !== false;
        CONFIG.debug = data.debug || false;
        
        // Log detalhado das regras carregadas
        if (CONFIG.debug) {
          log('=== CONFIGURAÇÕES CARREGADAS ===');
          log('Global Enabled:', CONFIG.globalEnabled);
          log('Total de regras:', CONFIG.rules.length);
          CONFIG.rules.forEach((rule, i) => {
            log(`Regra ${i + 1}: "${rule.name}"`, {
              id: rule.id,
              selector: rule.selector,
              urlPattern: rule.urlPattern,
              enabled: rule.enabled,
              styles: rule.styles || '(nenhum)',
              attributes: rule.attributes || '(nenhum)',
              addClass: rule.addClass || '(nenhum)',
              removeClass: rule.removeClass || '(nenhum)'
            });
          });
          log('================================');
        }
        
        resolve(CONFIG);
      });
    });
  }

  function getDefaultConfig() {
    return {
      rules: [],
      globalEnabled: true,
      debug: false
    };
  }

  function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;

      log('Configurações alteradas:', changes);

      if (changes.rules) {
        const oldRules = changes.rules.oldValue || [];
        const newRules = changes.rules.newValue || [];
        
        // Detecta regras que foram modificadas (mesmo ID, mas conteúdo diferente)
        const modifiedRuleIds = newRules
          .filter(newRule => {
            const oldRule = oldRules.find(r => r.id === newRule.id);
            if (!oldRule) return false; // É nova, não modificada
            // Compara se houve mudança
            return JSON.stringify(oldRule) !== JSON.stringify(newRule);
          })
          .map(r => r.id);
        
        // Remove estilos das regras modificadas antes de reaplicar
        if (modifiedRuleIds.length > 0) {
          log('Regras modificadas detectadas:', modifiedRuleIds);
          removeStylesFromRules(oldRules.filter(r => modifiedRuleIds.includes(r.id)));
        }
        
        CONFIG.rules = newRules;
        reprocessAllElements();
      }

      if (changes.globalEnabled !== undefined) {
        CONFIG.globalEnabled = changes.globalEnabled.newValue !== false;
        if (CONFIG.globalEnabled) {
          reprocessAllElements();
        }
      }

      if (changes.debug !== undefined) {
        CONFIG.debug = changes.debug.newValue || false;
      }
    });
  }
  
  /**
   * Remove estilos aplicados por regras específicas
   */
  function removeStylesFromRules(rules) {
    for (const rule of rules) {
      if (!rule || !rule.selector) continue;
      
      try {
        const elements = findElements(rule.selector);
        
        elements.forEach(element => {
          // Remove estilos que foram aplicados por esta regra
          if (rule.styles && typeof rule.styles === 'object') {
            for (const prop of Object.keys(rule.styles)) {
              let cssProp = prop.trim();
              if (cssProp.match(/[A-Z]/)) {
                cssProp = cssProp.replace(/([A-Z])/g, '-$1').toLowerCase();
              }
              element.style.removeProperty(cssProp);
              log(`Removido estilo: ${cssProp} de`, element);
            }
          }
          
          // Remove classes adicionadas
          if (rule.addClass) {
            const classes = Array.isArray(rule.addClass) ? rule.addClass : [rule.addClass];
            classes.forEach(cls => {
              if (cls && element.classList.contains(cls.trim())) {
                element.classList.remove(cls.trim());
              }
            });
          }
          
          // Restaura classes removidas (adiciona de volta)
          if (rule.removeClass) {
            const classes = Array.isArray(rule.removeClass) ? rule.removeClass : [rule.removeClass];
            classes.forEach(cls => {
              if (cls && !element.classList.contains(cls.trim())) {
                element.classList.add(cls.trim());
              }
            });
          }
          
          // Limpa a marcação de processamento para esta regra
          const processed = processedMap.get(element);
          if (processed) {
            processed.delete(rule.id);
          }
        });
      } catch (e) {
        warn(`Erro ao remover estilos da regra "${rule.name}":`, e.message);
      }
    }
  }

  function reprocessAllElements() {
    log('Reprocessando todos os elementos...');
    
    // IMPORTANTE: Limpa todas as marcações de processamento
    // Isso permite que os elementos sejam processados novamente
    // O WeakMap será limpo implicitamente, mas precisamos garantir
    // que os elementos sejam remarcados
    
    // Busca todos os elementos que podem ter sido modificados e limpa suas marcações
    const rules = getApplicableRules();
    for (const rule of rules) {
      try {
        const elements = findElements(rule.selector);
        elements.forEach(el => {
          const processed = processedMap.get(el);
          if (processed) {
            processed.delete(rule.id);
          }
        });
      } catch (e) {
        // Ignora erros de seletores inválidos
      }
    }
    
    const result = processElements();
    log(`Reprocessamento concluído: ${result.total} encontrados, ${result.modified} modificados`);
    
    return result;
  }

  // ============================================
  // COMUNICAÇÃO COM POPUP/BACKGROUND
  // ============================================

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      log('Mensagem recebida:', message.action);

      switch (message.action) {
        case 'ping':
          sendResponse({ 
            status: 'ok', 
            url: window.location.href,
            isIframe: isIframe,
            contextId: contextId
          });
          break;

        case 'reprocess':
          const result = reprocessAllElements();
          sendResponse({ 
            status: 'ok',
            ...result
          });
          break;

        case 'getStatus':
          const rules = getApplicableRules();
          sendResponse({
            status: 'ok',
            enabled: CONFIG.globalEnabled,
            rulesCount: CONFIG.rules.length,
            applicableRules: rules.length,
            url: window.location.href,
            isIframe: isIframe
          });
          break;

        case 'testSelector':
          try {
            // Busca elementos usando nossa função robusta
            const elements = findElements(message.selector);
            
            // Também verifica iframes se estiver no documento principal
            let iframeCount = 0;
            if (!isIframe) {
              try {
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                  try {
                    if (iframe.contentDocument) {
                      const iframeElements = findElements(message.selector, iframe.contentDocument);
                      iframeCount += iframeElements.length;
                    }
                  } catch (e) {
                    // Cross-origin iframe, não podemos acessar
                  }
                });
              } catch (e) {
                // Ignorar erros de iframe
              }
            }
            
            const totalCount = elements.length + iframeCount;
            
            sendResponse({
              status: 'ok',
              count: totalCount,
              mainDocument: elements.length,
              iframes: iframeCount,
              preview: elements.slice(0, 5).map(el => ({
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                classes: Array.from(el.classList).slice(0, 3).join(' ') || null,
                text: (el.textContent || '').substring(0, 30).trim() || null
              }))
            });
          } catch (e) {
            sendResponse({ status: 'error', message: e.message });
          }
          break;
          
        case 'getDebugInfo':
          const applicableRules = getApplicableRules();
          const debugInfo = {
            status: 'ok',
            contextId: contextId,
            isIframe: isIframe,
            url: window.location.href,
            hostname: window.location.hostname,
            rulesTotal: CONFIG.rules.length,
            rulesApplicable: applicableRules.length,
            rules: applicableRules.map(r => ({
              name: r.name,
              selector: r.selector,
              urlPattern: r.urlPattern,
              enabled: r.enabled,
              elementsFound: findElements(r.selector).length
            }))
          };
          sendResponse(debugInfo);
          break;

        default:
          sendResponse({ status: 'unknown_action' });
      }

      return true; // Mantém o canal aberto para resposta assíncrona
    });
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    log('Inicializando...', { 
      url: window.location.href, 
      isIframe 
    });

    // Carrega configurações do storage
    await loadConfig();

    // Configura listeners
    setupStorageListener();
    setupMessageListener();

    // Função para processar elementos
    const doProcess = () => {
      const result = processElements();
      log(`Processamento inicial: ${result.total} encontrados, ${result.modified} modificados`);
      return result;
    };

    // Aguarda o body existir
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => {
        doProcess();
        setupMutationObserver();
        
        // Retry após 500ms para elementos carregados tardiamente
        setTimeout(() => {
          const retryResult = processElements();
          if (retryResult.modified > 0) {
            log(`Retry: ${retryResult.modified} elemento(s) modificado(s)`);
          }
        }, 500);
      });
    } else {
      doProcess();
      setupMutationObserver();
      
      // Retry após 500ms para elementos carregados tardiamente
      setTimeout(() => {
        const retryResult = processElements();
        if (retryResult.modified > 0) {
          log(`Retry: ${retryResult.modified} elemento(s) modificado(s)`);
        }
      }, 500);
      
      // Segundo retry após 2s para páginas muito lentas
      setTimeout(() => {
        const retryResult = processElements();
        if (retryResult.modified > 0) {
          log(`Retry 2: ${retryResult.modified} elemento(s) modificado(s)`);
        }
      }, 2000);
    }

    log('Inicialização concluída');
  }

  // Inicia quando o documento estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
