
/* ── Nav Scroll ── */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Mobile nav (hamburger + slide-out menu) ── */
function setupMobileNavLayout() {
  const mobile = window.matchMedia('(max-width: 768px)');
  const navEl = document.getElementById('nav');
  const navInner = document.querySelector('.nav-inner');
  const headerCenter = document.querySelector('.header-center');
  const langToggle = document.getElementById('langToggle');
  if (!navEl || !navInner || !headerCenter) return;

  if (!window.__navMobileStore) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'navToggle';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    const topBar = document.createElement('div');
    topBar.className = 'nav-top-bar';

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = navEl.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-menu-open', open);
    });

    document.addEventListener('click', () => {
      navEl.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-menu-open');
    });

    headerCenter.addEventListener('click', (e) => e.stopPropagation());
    headerCenter.querySelectorAll('.nav-links a, .level-dropdown-menu a').forEach((link) => {
      link.addEventListener('click', () => {
        navEl.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-menu-open');
      });
    });

    window.__navMobileStore = {
      langParent: langToggle?.parentElement,
      langNext: langToggle?.nextSibling,
      cartParent: document.getElementById('cartWrap')?.parentElement,
      cartNext: document.getElementById('cartWrap')?.nextSibling,
      toggle,
      topBar,
    };
  }

  const store = window.__navMobileStore;
  const { toggle, topBar } = store;

  function closeMenu() {
    navEl.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-menu-open');
  }

  function applyMobile() {
    const cartWrap = document.getElementById('cartWrap');
    const navLinks = headerCenter.querySelector('.nav-links');

    if (cartWrap && !topBar.contains(cartWrap)) topBar.appendChild(cartWrap);
    if (langToggle && store.langParent && langToggle.parentElement !== store.langParent) {
      store.langParent.appendChild(langToggle);
    }
    if (store.langParent && navLinks && !navLinks.contains(store.langParent)) {
      navLinks.appendChild(store.langParent);
    }
    if (!topBar.contains(toggle)) topBar.appendChild(toggle);
    if (!navInner.contains(topBar)) navInner.insertBefore(topBar, headerCenter);
    headerCenter.classList.add('nav-menu-panel');
    closeMenu();
  }

  function applyDesktop() {
    closeMenu();
    headerCenter.classList.remove('nav-menu-panel');
    const cartWrap = document.getElementById('cartWrap');
    if (store.langParent && langToggle && langToggle.parentElement !== store.langParent) {
      store.langParent.insertBefore(langToggle, store.langNext);
    }
    if (store.cartParent && cartWrap && cartWrap.parentElement !== store.cartParent) {
      store.cartParent.insertBefore(cartWrap, store.cartNext);
    }
    if (topBar.parentElement) topBar.remove();
  }

  function update() {
    if (mobile.matches) applyMobile();
    else applyDesktop();
  }

  update();
  mobile.addEventListener('change', update);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMobileNavLayout);
} else {
  setupMobileNavLayout();
}

/* ── Level dropdown ── */
const levelDropdown = document.getElementById('levelDropdown');
const levelDropdownBtn = document.getElementById('levelDropdownBtn');
if (levelDropdown && levelDropdownBtn) {
  levelDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = levelDropdown.classList.toggle('open');
    levelDropdownBtn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', () => {
    levelDropdown.classList.remove('open');
    levelDropdownBtn.setAttribute('aria-expanded', 'false');
  });
  levelDropdown.querySelectorAll('.level-dropdown-menu a').forEach(link => {
    link.addEventListener('click', () => {
      levelDropdown.classList.remove('open');
      levelDropdownBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Shopping Cart ── */
const CART_KEY = 'mls-cart';
const cartBtn = document.getElementById('cartBtn');
const cartPanel = document.getElementById('cartPanel');
const cartBackdrop = document.getElementById('cartBackdrop');
const cartClose = document.getElementById('cartClose');
const cartItemsEl = document.getElementById('cartItems');
const cartFooter = document.getElementById('cartFooter');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  renderCart();
  if (typeof renderCheckout === 'function') renderCheckout();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateCartQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) saveCart(cart.filter(i => i.id !== id));
  else saveCart(cart);
}

function setCartOpen(open) {
  if (!cartPanel || !cartBackdrop) return;
  if (open) {
    levelDropdown?.classList.remove('open');
    levelDropdownBtn?.setAttribute('aria-expanded', 'false');
  }
  cartPanel.classList.toggle('open', open);
  cartBackdrop.classList.toggle('open', open);
  cartBtn?.setAttribute('aria-expanded', open);
  cartPanel.setAttribute('aria-hidden', !open);
  document.body.classList.toggle('cart-open', open);
}

function renderCart() {
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.hidden = count === 0;
  }

  if (!cartItemsEl) return;

  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">${typeof t === 'function' ? t('cart.empty') : 'Your cart is empty.'}<br><a href="store.html">${typeof t === 'function' ? t('cart.browse') : 'Browse our books →'}</a></p>`;
    if (cartFooter) cartFooter.hidden = true;
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-thumb">${item.image ? `<img src="${item.image}" alt="" />` : ''}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}${item.qty > 1 ? ` × ${item.qty}` : ''}</div>
        ${item.nameAr ? `<div class="cart-item-name-ar">${item.nameAr}</div>` : ''}
        <div class="cart-item-row">
          <span class="cart-item-price">AED ${item.price * item.qty}</span>
          <button type="button" class="cart-item-remove" data-remove="${item.id}">${typeof t === 'function' ? t('cart.remove') : 'Remove'}</button>
        </div>
      </div>
    </div>
  `).join('');

  cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });

  if (cartFooter) cartFooter.hidden = false;
  if (cartTotalEl) cartTotalEl.textContent = `AED ${total}`;
}

if (cartBtn && cartPanel && cartBackdrop) {
  cartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setCartOpen(!cartPanel.classList.contains('open'));
  });
  cartClose?.addEventListener('click', () => setCartOpen(false));
  cartBackdrop.addEventListener('click', () => setCartOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartPanel.classList.contains('open')) setCartOpen(false);
  });
  renderCart();
}

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', function() {
    const card = this.closest('.product-card');
    if (!card) return;
    const nameEn = card.querySelector('.product-name')?.textContent.trim() || 'Book';
    const nameAr = card.querySelector('.product-name-ar')?.textContent.trim() || '';
    const lang = typeof getLang === 'function' ? getLang() : 'en';
    addToCart({
      id: card.dataset.productId,
      name: lang === 'ar' && nameAr ? nameAr : nameEn,
      nameAr: nameAr,
      price: parseInt(card.dataset.price, 10) || 0,
      image: card.querySelector('.product-cover')?.getAttribute('src') || '',
    });
    setCartOpen(true);
    this.textContent = '✓';
    this.style.background = 'var(--c-green)';
    this.style.transform = 'scale(1.15)';
    setTimeout(() => {
      this.textContent = '+';
      this.style.background = '';
      this.style.transform = '';
    }, 1400);
  });
});

/* ── Level strip scroll ── */
const levelsStrip = document.getElementById('levelsStrip');
document.getElementById('stripPrev')?.addEventListener('click', () => {
  levelsStrip?.scrollBy({ left: -200, behavior: 'smooth' });
});
document.getElementById('stripNext')?.addEventListener('click', () => {
  levelsStrip?.scrollBy({ left: 200, behavior: 'smooth' });
});

/* ── Arabic Letter Rain ── */
const LETTERS = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
const COLORS  = [
  'rgba(46,134,193,0.72)',
  'rgba(192,80,77,0.68)',
  'rgba(78,140,77,0.70)',
  'rgba(232,206,58,0.75)',
  'rgba(46,134,193,0.65)',
  'rgba(192,80,77,0.65)',
  'rgba(78,140,77,0.68)',
  'rgba(200,160,30,0.72)',
];
const canvas = document.getElementById('rainCanvas');

function spawnRainLetter() {
  if (!canvas) return;
  const el = document.createElement('span');
  el.className = 'rain-letter';
  const size  = (Math.random() * 52 + 32).toFixed(0);
  const x     = (Math.random() * 98).toFixed(1);
  const dur   = (Math.random() * 4.5 + 3.5).toFixed(1);
  const delay = (Math.random() * -dur).toFixed(1);
  const rot   = ((Math.random() - 0.5) * 16).toFixed(1);
  const op    = (Math.random() * 0.25 + 0.45).toFixed(2);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  el.textContent = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  el.style.cssText = `
    left:${x}%;font-size:${size}px;color:${color};
    --r:${rot}deg;--op:${op};
    animation-duration:${dur}s;animation-delay:${delay}s;
  `;
  canvas.appendChild(el);
  if (canvas.children.length > 80) canvas.removeChild(canvas.firstChild);
}
if (canvas) {
  for (let i = 0; i < 60; i++) spawnRainLetter();
  setInterval(spawnRainLetter, 450);
}

/* ── Marquee ── */
const MARQUEE_ICONS = ['📅', '🎓', '🕌', '📚', '👧', '✅', '✦', '🔤'];
const MARQUEE_KEYS = ['marquee.1','marquee.2','marquee.3','marquee.4','marquee.5','marquee.6','marquee.7','marquee.8'];

function buildMarquee() {
  const inner = document.getElementById('marqueeInner');
  if (!inner) return;
  inner.innerHTML = '';
  const items = MARQUEE_KEYS.map((key, i) => [MARQUEE_ICONS[i], typeof t === 'function' ? t(key) : key]);
  [...items, ...items, ...items].forEach(([icon, text]) => {
    const el = document.createElement('div');
    el.className = 'marquee-item';
    el.innerHTML = `${icon}&nbsp;&nbsp;<strong>${text}</strong><span class="m-dot"></span>`;
    inner.appendChild(el);
  });
}
buildMarquee();
window.addEventListener('langchange', buildMarquee);
window.addEventListener('langchange', () => { if (typeof renderCart === 'function') renderCart(); });
window.addEventListener('langchange', () => { if (typeof renderCheckout === 'function') renderCheckout(); });

/* ── Checkout Page ── */
const checkoutLayout = document.getElementById('checkoutLayout');
const checkoutEmpty = document.getElementById('checkoutEmpty');
const checkoutSuccess = document.getElementById('checkoutSuccess');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutSummaryItems = document.getElementById('checkoutSummaryItems');
const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
const checkoutGrandTotalEl = document.getElementById('checkoutGrandTotal');

function cartSubtotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCheckout() {
  if (!checkoutLayout) return;
  if (checkoutSuccess && !checkoutSuccess.hidden) return;

  const cart = getCart();
  const subtotal = cartSubtotal(cart);

  if (!cart.length) {
    checkoutLayout.hidden = true;
    if (checkoutEmpty) checkoutEmpty.hidden = false;
    return;
  }

  if (checkoutEmpty) checkoutEmpty.hidden = true;
  checkoutLayout.hidden = false;

  const lang = typeof getLang === 'function' ? getLang() : 'en';

  if (checkoutSummaryItems) {
    checkoutSummaryItems.innerHTML = cart.map(item => {
      const displayName = lang === 'ar' && item.nameAr ? item.nameAr : item.name;
      const altName = lang === 'ar' ? item.name : item.nameAr;
      return `
        <div class="checkout-summary-item" data-id="${item.id}">
          <div class="checkout-summary-thumb">${item.image ? `<img src="${item.image}" alt="" />` : ''}</div>
          <div class="checkout-summary-info">
            <div class="checkout-summary-name">${displayName}</div>
            ${altName ? `<div class="checkout-summary-name-ar">${altName}</div>` : ''}
            <div class="checkout-summary-row">
              <div class="checkout-qty">
                <button type="button" data-qty-minus="${item.id}" aria-label="Decrease">−</button>
                <span>${item.qty}</span>
                <button type="button" data-qty-plus="${item.id}" aria-label="Increase">+</button>
              </div>
              <span class="checkout-summary-price">AED ${item.price * item.qty}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    checkoutSummaryItems.querySelectorAll('[data-qty-minus]').forEach(btn => {
      btn.addEventListener('click', () => updateCartQty(btn.dataset.qtyMinus, -1));
    });
    checkoutSummaryItems.querySelectorAll('[data-qty-plus]').forEach(btn => {
      btn.addEventListener('click', () => updateCartQty(btn.dataset.qtyPlus, 1));
    });
  }

  if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = `AED ${subtotal}`;
  if (checkoutGrandTotalEl) checkoutGrandTotalEl.textContent = `AED ${subtotal}`;
}

if (checkoutLayout) {
  renderCheckout();

  checkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) return;
    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }

    const orderId = 'MLS-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem(CART_KEY, '[]');
    renderCart();

    checkoutLayout.hidden = true;
    if (checkoutEmpty) checkoutEmpty.hidden = true;
    if (checkoutSuccess) {
      checkoutSuccess.hidden = false;
      const orderNumEl = document.getElementById('orderNumber');
      if (orderNumEl) orderNumEl.textContent = orderId;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Scroll Reveal ── */
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.10, rootMargin: '0px 0px -48px 0px' });
revealEls.forEach(el => revealObs.observe(el));


/* ── Hero letter rotation ── */
const heroLetters = ['ب','ا','ت','ج','ك','م','ن','ل','ع','ق'];
const heroLetter = document.querySelector('.hero-card-letter');
const heroText = document.querySelector('.hero-card-text');
const letterKeys = ['letters.0','letters.1','letters.2','letters.3','letters.4','letters.5','letters.6','letters.7','letters.8','letters.9'];
let heroIdx = 0;

function updateHeroLetter() {
  if (!heroLetter || !heroText) return;
  heroText.textContent = typeof t === 'function' ? t(letterKeys[heroIdx]) : heroText.textContent;
}

if (heroLetter && heroText) {
  heroLetter.style.transition = 'all 0.6s cubic-bezier(0.16,1,0.3,1)';
  setInterval(() => {
    heroIdx = (heroIdx + 1) % heroLetters.length;
    heroLetter.style.opacity = '0';
    heroLetter.style.transform = 'translateY(20px) scale(0.9)';
    setTimeout(() => {
      heroLetter.textContent = heroLetters[heroIdx];
      updateHeroLetter();
      heroLetter.style.opacity = '1';
      heroLetter.style.transform = 'translateY(0) scale(1)';
    }, 350);
  }, 2800);
  window.addEventListener('langchange', updateHeroLetter);
}

