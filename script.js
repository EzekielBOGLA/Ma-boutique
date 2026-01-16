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

/* ===== Ajouts dynamiques pour Best-sellers, lazy images et newsletter ===== */
(function () {
  'use strict';

  /* Lazy load simple pour images avec data-src */
  function initLazyFromData(scope = document) {
    const imgs = Array.from(scope.querySelectorAll('img.lazy[data-src]'));
    if (!imgs.length) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.remove('lazy');
          obs.unobserve(img);
        });
      }, { rootMargin: '200px 0px' });
      imgs.forEach(i => io.observe(i));
    } else {
      imgs.forEach(i => { i.src = i.dataset.src; i.removeAttribute('data-src'); i.classList.remove('lazy'); });
    }
  }

  /* Best-sellers : boutons "Ajouter au panier" et "Commander" */
  function initBestsellersButtons(scope = document) {
    const addBtns = Array.from(scope.querySelectorAll('.best-add-cart'));
    addBtns.forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        const d = e.currentTarget.dataset;
        const product = {
          id: d.id || `prod-${Date.now()}`,
          title: d.title || 'Produit',
          price: Number(d.price || 0),
          img: d.img || ''
        };
        try { addToCart(product, 1); } catch (err) { console.error('addToCart missing', err); }
      });
    });

    const buyBtns = Array.from(scope.querySelectorAll('.best-buy-now'));
    buyBtns.forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        const d = e.currentTarget.dataset;
        const product = {
          id: d.id || `prod-${Date.now()}`,
          title: d.title || 'Produit',
          price: Number(d.price || 0),
          img: d.img || ''
        };
        try {
          addToCart(product, 1);
          // open cart modal and show checkout form if available
          const modal = document.querySelector('#cart-modal') || document.querySelector('#cart-modal-2');
          if (modal) {
            renderCartModal('');
            const form = document.querySelector('#checkout-form-2') || document.querySelector('#checkout-form');
            if (form) form.style.display = 'flex';
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
          }
        } catch (err) { console.error('buy-now error', err); }
      });
    });
  }

  /* Newsletter : stockage local simple + feedback */
  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    const emailInput = form.querySelector('input[type="email"]');
    const status = document.getElementById('newsletter-status');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (emailInput.value || '').trim();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email)) {
        if (status) status.textContent = 'Veuillez saisir une adresse email valide.';
        return;
      }
      // sauvegarde locale (ex: pour CRM manuel) et feedback
      try {
        const key = 'maison_elegante_newsletter';
        const listRaw = localStorage.getItem(key);
        const list = listRaw ? JSON.parse(listRaw) : [];
        if (!list.includes(email)) list.push(email);
        localStorage.setItem(key, JSON.stringify(list));
        if (status) status.textContent = "Merci ! Vous êtes inscrit(e).";
        toast('Inscription newsletter confirmée.');
        form.reset();
      } catch (err) {
        console.error('newsletter save error', err);
        if (status) status.textContent = "Erreur lors de l'inscription. Réessayez.";
      }
    });
  }

  /* Re-init après navigation SPA si nécessaire */
  function initHomepageEnhancements(scope = document) {
    initLazyFromData(scope);
    initBestsellersButtons(scope);
    initNewsletter();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHomepageEnhancements(document);
  });

  // Expose for SPA reinit if your SPA loader replaces content
  window.initHomepageEnhancements = initHomepageEnhancements;

})();
