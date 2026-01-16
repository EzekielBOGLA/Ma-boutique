/* script.js - version sans viewer d'images
   Conserve : gestion panier, rendu total correct, checkout + envoi email.
*/

/* Utilitaires */
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

const CART_KEY = 'maison_elegante_cart_v2';

/* Panier */
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erreur lecture panier', e);
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
function cartTotal(cart) {
  return cart.reduce((s, p) => s + (Number(p.price) * Number(p.qty)), 0);
}
function updateCartCount() {
  const cart = loadCart();
  const count = cart.reduce((s, p) => s + p.qty, 0);
  qsa('#cart-count, #cart-count-2, #cart-count-3, #cart-count-4').forEach(el => {
    if (el) el.textContent = count;
  });
}
function addToCart(product, qty = 1) {
  const cart = loadCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.qty += qty;
  else cart.push({ id: product.id, title: product.title, price: Number(product.price), qty });
  saveCart(cart);
  toast(`${product.title} ajouté au panier.`);
}
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}
function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.right = '20px';
  t.style.bottom = '20px';
  t.style.background = 'var(--color-primary)';
  t.style.color = 'var(--color-bg)';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '10px';
  t.style.boxShadow = '0 8px 30px rgba(11,18,32,0.12)';
  t.style.zIndex = 9999;
  t.style.transition = 'opacity 300ms';
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity = '0', 2200);
  setTimeout(() => t.remove(), 2600);
}

/* Rendu du panier (gère suffixes) */
function renderCartModal(suffix = '') {
  const cart = loadCart();
  const itemsEl = qs(`#cart-items${suffix}`) || qs('#cart-items');
  const totalEl = qs(`#cart-total${suffix}`) || qs('#cart-total');
  if (!itemsEl || !totalEl) return;
  itemsEl.innerHTML = '';
  if (cart.length === 0) {
    itemsEl.innerHTML = '<li>Votre panier est vide.</li>';
    totalEl.textContent = '0.00 €';
    return;
  }
  cart.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.title} × ${item.qty}</span><span>${(item.price * item.qty).toFixed(2)} €</span>`;
    itemsEl.appendChild(li);
  });
  totalEl.textContent = cartTotal(cart).toFixed(2) + ' €';
}

/* Helpers pour suffixes */
function getSuffixFromButtonId(btnId) {
  if (!btnId) return '';
  const m = btnId.match(/cart-btn(?:-(\d+))?/);
  if (!m) return '';
  return m[1] ? `-${m[1]}` : '';
}
function openCartModalFromButton(btn) {
  const dataSuffix = btn?.dataset?.suffix;
  const suffix = dataSuffix ? dataSuffix : getSuffixFromButtonId(btn?.id);
  const modalSelector = `#cart-modal${suffix}`;
  const modal = qs(modalSelector) || qs('#cart-modal');
  if (!modal) return;
  renderCartModal(suffix);
  const form = modal.querySelector('.checkout-form');
  if (form) form.style.display = 'none';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}
function closeAllCartModals() {
  qsa('.cart-modal').forEach(m => {
    m.classList.add('hidden');
    m.setAttribute('aria-hidden', 'true');
    const form = m.querySelector('.checkout-form');
    if (form) form.style.display = 'none';
  });
}

/* Envoi email (EmailJS ou mailto fallback) */
function sendOrderEmail(params) {
  if (window.emailjs && typeof window.emailjs.send === 'function') {
    const serviceID = 'YOUR_SERVICE_ID';
    const templateID = 'YOUR_TEMPLATE_ID';
    const templateParams = {
      to_email: params.to_email,
      to_name: params.to_name,
      phone: params.phone,
      address: params.address,
      items: params.items_html,
      total: params.total
    };
    return window.emailjs.send(serviceID, templateID, templateParams)
      .then(() => ({ ok: true }))
      .catch(err => ({ ok: false, error: err }));
  } else {
    const subject = encodeURIComponent('Confirmation de votre commande - Maison Élégante');
    const body = encodeURIComponent(
      `Bonjour ${params.to_name},\n\nMerci pour votre commande.\n\nDétails :\n${params.items_text}\n\nTotal : ${params.total}\n\nAdresse de livraison : ${params.address}\nTéléphone : ${params.phone}\n\nCordialement,\nMaison Élégante`
    );
    const mailto = `mailto:${params.to_email}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    return Promise.resolve({ ok: true, fallback: true });
  }
}
function getCartItemsSummary() {
  const cart = loadCart();
  if (!cart || cart.length === 0) return { html: '<p>Panier vide</p>', text: 'Panier vide' };
  const lines = cart.map(i => `${i.title} × ${i.qty} — ${(i.price * i.qty).toFixed(2)} €`);
  const html = `<ul>${cart.map(i => `<li>${i.title} × ${i.qty} — ${(i.price * i.qty).toFixed(2)} €</li>`).join('')}</ul>`;
  const text = lines.join('\n');
  return { html, text };
}

/* Checkout handlers */
function initCheckoutHandlers() {
  qsa('#checkout-btn, #checkout-btn-2, #checkout-btn-3, #checkout-btn-4').forEach(btn => {
    btn && btn.addEventListener('click', (e) => {
      openCartModalFromButton(e.currentTarget);
      const suffix = getSuffixFromButtonId(e.currentTarget.id);
      const modal = qs(`#cart-modal${suffix}`) || qs('#cart-modal');
      if (!modal) return;
      const form = modal.querySelector('.checkout-form') || qs(`#checkout-form${suffix}`);
      if (form) form.style.display = 'flex';
      renderCartModal(suffix);
    });
  });

  qsa('#confirm-order, #confirm-order-2').forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      const modal = e.currentTarget.closest('.cart-modal');
      const form = modal ? modal.querySelector('.checkout-form') : null;
      if (!form) return;
      const name = form.querySelector('[name="name"]')?.value?.trim();
      const email = form.querySelector('[name="email"]')?.value?.trim();
      const phone = form.querySelector('[name="phone"]')?.value?.trim();
      const address = form.querySelector('[name="address"]')?.value?.trim();

      if (!name || !email || !phone || !address) {
        alert('Veuillez remplir tous les champs obligatoires pour finaliser la commande.');
        return;
      }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        alert('Veuillez saisir une adresse email valide.');
        return;
      }
      if (phone && !/^[0-9+\s\-()]{6,20}$/.test(phone)) {
        alert('Veuillez saisir un numéro de téléphone valide.');
        return;
      }

      const cart = loadCart();
      if (!cart || cart.length === 0) {
        alert('Votre panier est vide.');
        return;
      }

      const total = cartTotal(cart).toFixed(2) + ' €';
      const items = getCartItemsSummary();

      try {
        const res = await sendOrderEmail({
          to_email: email,
          to_name: name,
          phone,
          address,
          items_html: items.html,
          items_text: items.text,
          total
        });
        if (res.ok) {
          alert(`Commande confirmée pour ${name}. Total : ${total}. Un email de confirmation a été envoyé à ${email}.`);
        } else {
          console.warn('Envoi email échoué', res.error);
          alert(`Commande confirmée pour ${name}. Total : ${total}. (Envoi d'email automatique échoué, fallback mailto utilisé si possible.)`);
        }
      } catch (err) {
        console.error('Erreur envoi email', err);
        alert(`Commande confirmée pour ${name}. Total : ${total}.`);
      }

      clearCart();
      form.reset();
      closeAllCartModals();
    });
  });

  qsa('#cancel-checkout, #cancel-checkout-2').forEach(btn => {
    btn && btn.addEventListener('click', () => {
      const modal = btn.closest('.cart-modal');
      if (!modal) return;
      const form = modal.querySelector('.checkout-form');
      if (form) form.style.display = 'none';
    });
  });
}

/* Contact form (envoi email automatique) */
function initContactForm() {
  const form = qs('#contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = qs('#name').value.trim();
    const email = qs('#email').value.trim();
    const phone = qs('#phone').value.trim();
    const subject = qs('#subject').value.trim();
    const message = qs('#message').value.trim();

    if (!name || !email || !subject || !message) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      alert('Veuillez saisir une adresse email valide.');
      return;
    }
    if (phone && !/^[0-9+\s\-()]{6,20}$/.test(phone)) {
      alert('Veuillez saisir un numéro de téléphone valide.');
      return;
    }

    const bodyText = `Bonjour ${name},\n\nMerci pour votre message ("${subject}").\n\nMessage reçu :\n${message}\n\nNous vous répondrons sous 48h.\n\nCordialement,\nMaison Élégante`;
    try {
      const res = await sendOrderEmail({
        to_email: email,
        to_name: name,
        phone,
        address: 'N/A',
        items_html: `<p>Message de contact : ${message}</p>`,
        items_text: bodyText,
        total: 'N/A'
      });
      if (res.ok) {
        alert('Merci pour votre message. Un email de confirmation vous a été envoyé.');
      } else {
        alert('Merci pour votre message. Un email de confirmation a été ouvert dans votre client mail.');
      }
    } catch (err) {
      console.error('Erreur envoi email contact', err);
      alert('Merci pour votre message. Un email de confirmation a été ouvert dans votre client mail.');
    }

    form.reset();
  });
}

/* Boutique : injection produits + filtres (inchangé) */
function initShop() {
  const grid = qs('#products-grid');
  const products = window.SHOP_PRODUCTS || [];
  if (!grid || products.length === 0) return;

  function render(list) {
    grid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.title}" />
        <div class="product-body">
          <h4>${p.title}</h4>
          <p class="desc">${p.desc}</p>
          <div class="product-meta">
            <span class="price">${Number(p.price).toFixed(2)} €</span>
          </div>
          <div class="product-actions">
            <button class="btn add-cart" data-id="${p.id}">Ajouter au panier</button>
            <button class="btn primary buy-now" data-id="${p.id}">Commander</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    qsa('.add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = products.find(x => x.id === id);
        if (prod) addToCart(prod, 1);
      });
    });

    qsa('.buy-now').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = products.find(x => x.id === id);
        if (prod) {
          addToCart(prod, 1);
          const modal = qs('#cart-modal') || qs('#cart-modal-2');
          if (modal) {
            renderCartModal('');
            const form = qs('#checkout-form-2') || qs('#checkout-form');
            if (form) form.style.display = 'flex';
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
          }
        }
      });
    });
  }

  render(products);

  const cat = qs('#filter-category');
  const price = qs('#filter-price');
  const clear = qs('#clear-filters');

  function applyFilters() {
    let list = products.slice();
    const c = cat?.value || 'all';
    const p = price?.value || 'all';
    if (c && c !== 'all') list = list.filter(x => x.category === c);
    if (p && p !== 'all') {
      const [min, max] = p.split('-').map(Number);
      list = list.filter(x => x.price >= min && x.price <= max);
    }
    render(list);
  }

  cat && cat.addEventListener('change', applyFilters);
  price && price.addEventListener('change', applyFilters);
  clear && clear.addEventListener('click', () => {
    if (cat) cat.value = 'all';
    if (price) price.value = 'all';
    applyFilters();
  });
}

/* Menu mobile toggle */
function initMenuToggle() {
  qsa('.menu-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = qs('.main-nav');
      if (nav) nav.classList.toggle('show');
    });
  });
}

/* Cart modal buttons */
function initCartButtons() {
  qsa('#cart-btn, #cart-btn-2, #cart-btn-3, #cart-btn-4').forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      openCartModalFromButton(e.currentTarget);
    });
  });

  qsa('#close-cart, #close-cart-2').forEach(btn => {
    btn && btn.addEventListener('click', closeAllCartModals);
  });

  qsa('#clear-cart, #clear-cart-2').forEach(btn => {
    btn && btn.addEventListener('click', () => {
      if (confirm('Vider le panier ?')) {
        clearCart();
        renderCartModal('');
      }
    });
  });

  qsa('.cart-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllCartModals();
    });
  });
}

/* Initialisation globale */
function init() {
  updateCartCount();
  initMenuToggle();
  initCartButtons();
  initCheckoutHandlers();
  initContactForm();
  initShop();
}

document.addEventListener('DOMContentLoaded', init);

/* ===========================
   DYNAMISME JS — AJOUTS
   (Coller à la fin de script.js)
   - SPA navigation (fetch + pushState)
   - Prefetch on hover
   - Lazy loading images
   - Fly-to-cart animation
   - Progress bar + skeletons
   - Focus trap for modals
   =========================== */

(function () {
  'use strict';

  /* --- Helpers --- */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const isSameOrigin = url => {
    try { const u = new URL(url, location.href); return u.origin === location.origin; } catch (e) { return false; }
  };

  /* --- Progress bar --- */
  const progressBar = document.createElement('div');
  progressBar.className = 'site-progress';
  document.documentElement.appendChild(progressBar);
  function setProgress(p) { progressBar.style.width = `${Math.max(0, Math.min(100, p))}%`; }
  function startProgress() { setProgress(10); }
  function finishProgress() { setProgress(100); setTimeout(() => setProgress(0), 300); }

  /* --- Simple SPA navigation --- */
  const mainSelector = '.container'; // container principal à remplacer si besoin
  function fetchPage(url, push = true) {
    startProgress();
    // show skeleton in main area
    const main = $(mainSelector);
    if (main) {
      main.classList.add('page-transition');
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton';
      skeleton.style.height = '220px';
      skeleton.style.margin = '12px 0';
      main.prepend(skeleton);
    }

    return fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(resp => {
        if (!resp.ok) throw new Error('Network error');
        return resp.text();
      })
      .then(html => {
        // parse and extract new content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newMain = doc.querySelector(mainSelector) || doc.body;
        if (!newMain) throw new Error('No main content');

        // animate out current content
        const current = $(mainSelector);
        if (current) {
          current.classList.add('page-fade-leave');
          current.classList.add('page-fade-leave-active');
        }

        // small delay for animation
        return new Promise(resolve => setTimeout(() => resolve(newMain.innerHTML), 180));
      })
      .then(newHtml => {
        const current = $(mainSelector);
        if (current) {
          current.innerHTML = newHtml;
          current.classList.remove('page-fade-leave', 'page-fade-leave-active');
          current.classList.add('page-fade-enter', 'page-fade-enter-active');
          setTimeout(() => current.classList.remove('page-fade-enter', 'page-fade-enter-active'), 360);
        }
        // update title
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(newHtml, 'text/html');
          const newTitle = doc.querySelector('title');
          if (newTitle) document.title = newTitle.textContent;
        } catch (e) { /* ignore */ }

        // re-run initializers for dynamic content
        reinitDynamicParts();

        if (push) history.pushState({ url }, '', url);
        finishProgress();
      })
      .catch(err => {
        console.error('Navigation error', err);
        finishProgress();
        // fallback: full navigation
        location.href = url;
      });
  }

  // Intercept clicks on internal links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || a.hasAttribute('data-no-spa')) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return; // external
    // allow ctrl/cmd/shift/alt clicks
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    fetchPage(url.href, true);
  });

  // Handle back/forward
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (state && state.url) fetchPage(state.url, false);
  });

  /* --- Prefetch on hover (links) --- */
  let prefetchTimer = null;
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || !isSameOrigin(href) || a.hasAttribute('data-no-prefetch')) return;
    clearTimeout(prefetchTimer);
    prefetchTimer = setTimeout(() => {
      // use link rel=prefetch if supported
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = new URL(href, location.href).href;
      document.head.appendChild(link);
    }, 120);
  });

  /* --- Lazy load images with IntersectionObserver --- */
  function initLazyImages(scope = document) {
    const imgs = Array.from(scope.querySelectorAll('img[data-src], img[data-srcset]'));
    if (!('IntersectionObserver' in window) || imgs.length === 0) {
      imgs.forEach(loadImg);
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImg(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });
    imgs.forEach(img => {
      // add placeholder class
      if (!img.classList.contains('img-placeholder')) img.classList.add('img-placeholder');
      io.observe(img);
    });
  }
  function loadImg(img) {
    if (img.dataset.src) img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.addEventListener('load', () => img.classList.remove('img-placeholder'));
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  }

  /* --- Fly-to-cart animation --- */
  function flyToCart(imgEl, targetSelector = '#cart-btn') {
    try {
      const cartBtn = document.querySelector(targetSelector) || document.querySelector('.cart-btn');
      if (!imgEl || !cartBtn) return;
      const rect = imgEl.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();
      const clone = imgEl.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.transition = 'transform 700ms cubic-bezier(.2,.9,.2,1), opacity 700ms ease';
      clone.style.zIndex = 99999;
      clone.className = 'cart-fly';
      document.body.appendChild(clone);
      requestAnimationFrame(() => {
        const dx = cartRect.left + cartRect.width/2 - (rect.left + rect.width/2);
        const dy = cartRect.top + cartRect.height/2 - (rect.top + rect.height/2);
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.18)`;
        clone.style.opacity = '0.6';
      });
      setTimeout(() => clone.remove(), 720);
    } catch (e) { /* ignore */ }
  }

  /* --- Enhance add-to-cart buttons with fly animation and count bump --- */
  function enhanceAddToCart(scope = document) {
    scope.querySelectorAll('.add-cart, .buy-now').forEach(btn => {
      if (btn.dataset.enhanced) return;
      btn.dataset.enhanced = '1';
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const prodImg = e.currentTarget.closest('.product')?.querySelector('img');
        if (prodImg) flyToCart(prodImg);
        // small bump animation on cart count
        const counts = document.querySelectorAll('#cart-count, #cart-count-2, #cart-count-3, #cart-count-4');
        counts.forEach(c => {
          c.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
        });
      });
    });
  }

  /* --- Reinit dynamic parts after SPA navigation --- */
  function reinitDynamicParts() {
    // lazy images
    initLazyImages(document);
    // reattach shop handlers (delegation preferred)
    enhanceAddToCart(document);
    // reattach cart buttons and checkout handlers if needed
    // existing functions in original script will still be present; call updateCartCount to sync
    try { updateCartCount(); } catch (e) { /* ignore if not present */ }
    // reinit shop filters if present
    try { initShop(); } catch (e) { /* ignore */ }
    // reinit contact form
    try { initContactForm(); } catch (e) { /* ignore */ }
    // reinit cart modal buttons
    try { initCartButtons(); } catch (e) { /* ignore */ }
    // reinit checkout handlers
    try { initCheckoutHandlers(); } catch (e) { /* ignore */ }
  }

  /* --- Focus trap for modals (basic) --- */
  function trapFocus(modal) {
    if (!modal) return;
    const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function keyHandler(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        // close modal if close button exists
        const close = modal.querySelector('.close-cart');
        if (close) close.click();
      }
    }
    modal.addEventListener('keydown', keyHandler);
    // return untrap function
    return () => modal.removeEventListener('keydown', keyHandler);
  }

  /* --- Init dynamic features on DOMContentLoaded --- */
  function initDynamic() {
    // initialize lazy images on first load
    initLazyImages(document);

    // enhance add-to-cart buttons
    enhanceAddToCart(document);

    // delegate product actions for dynamically injected products
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
      productsGrid.addEventListener('click', (e) => {
        const add = e.target.closest('.add-cart');
        const buy = e.target.closest('.buy-now');
        if (add) {
          const id = add.dataset.id;
          const prod = (window.SHOP_PRODUCTS || []).find(p => p.id === id);
          if (prod) addToCart(prod, 1);
        } else if (buy) {
          const id = buy.dataset.id;
          const prod = (window.SHOP_PRODUCTS || []).find(p => p.id === id);
          if (prod) {
            addToCart(prod, 1);
            // open checkout modal
            const modal = document.querySelector('#cart-modal') || document.querySelector('#cart-modal-2');
            if (modal) {
              renderCartModal('');
              const form = document.querySelector('#checkout-form-2') || document.querySelector('#checkout-form');
              if (form) form.style.display = 'flex';
              modal.classList.remove('hidden');
              modal.setAttribute('aria-hidden', 'false');
            }
          }
        }
      });
    }

    // attach focus trap to cart modals when opened
    document.addEventListener('click', (e) => {
      const openModal = e.target.closest('.cart-modal:not(.hidden)');
      if (openModal) {
        // trap focus
        const untrap = trapFocus(openModal);
        // remove trap when modal closes
        const observer = new MutationObserver(() => {
          if (openModal.classList.contains('hidden')) {
            if (untrap) untrap();
            observer.disconnect();
          }
        });
        observer.observe(openModal, { attributes: true, attributeFilter: ['class'] });
      }
    });

    // keyboard shortcut: "g" to go to shop (example)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const shopLink = document.querySelector('a[href*="shop"], a[href*="boutique"]');
        if (shopLink) shopLink.click();
      }
    });

    // ensure SPA state for initial load
    history.replaceState({ url: location.href }, '', location.href);
  }

  // run on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initDynamic);

  /* --- Optional: register service worker if available (progressive enhancement) --- */
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore registration errors */ });
    } catch (e) { /* ignore */ }
  }

})();
