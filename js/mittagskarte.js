(function () {
  let mkData = null;

  function getLang() {
    return window.currentLang || localStorage.getItem('lang') || 'de';
  }

  function getName(item) {
    const l = getLang();
    return l === 'en' ? (item.name_en || item.name_de) : item.name_de;
  }

  function getCatName(cat) {
    const l = getLang();
    if (l === 'en') return cat.name_en || cat.name_de;
    if (l === 'fr') return cat.name_fr || cat.name_de;
    return cat.name_de;
  }

  function getBeilage(item) {
    const l = getLang();
    return l === 'en' ? (item.beilage_en || item.beilage_de || '') : (item.beilage_de || '');
  }

  var slideshowTimer = null;

  function renderSlideshow(data) {
    const stage = document.getElementById('mk-slideshow');
    if (!stage) return;

    const badge = document.getElementById('mk-week-badge');
    if (badge) badge.textContent = 'KW ' + data.kw + ' · ' + data.von_display + ' – ' + data.bis_display;
    const inclEl = document.getElementById('mk-incl');
    if (inclEl) inclEl.textContent = data.inklusive;

    const slides = [];
    data.kategorien.filter(function (k) { return k.id !== 'suppen'; }).forEach(function (cat) {
      cat.gerichte.forEach(function (dish) { slides.push({ cat: cat, dish: dish }); });
    });

    if (!slides.length) return;
    var current = 0;

    function showSlide(idx) {
      current = (idx + slides.length) % slides.length;
      var s = slides[current];
      var l = getLang();
      var name = l === 'en' ? (s.dish.name_en || s.dish.name_de) : s.dish.name_de;
      var beilage = l === 'en' ? (s.dish.beilage_en || s.dish.beilage_de || '') : (s.dish.beilage_de || '');
      var catName = getCatName(s.cat);
      var html = '<div class="mk-slide">';
      html += '<div class="mk-slide-cat">' + s.cat.icon + ' ' + catName + '</div>';
      html += '<div class="mk-slide-name">' + name + (s.dish.vegi ? ' 🌿' : '') + '</div>';
      if (beilage) html += '<div class="mk-slide-beilage">' + beilage + '</div>';
      if (s.dish.preis) html += '<div class="mk-slide-price">CHF ' + s.dish.preis + '</div>';
      html += '</div>';
      stage.innerHTML = html;

      var dotsEl = document.getElementById('mk-dots');
      if (dotsEl) {
        var dots = dotsEl.querySelectorAll('.mk-dot');
        dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
      }
    }

    var dotsEl = document.getElementById('mk-dots');
    if (dotsEl) {
      dotsEl.innerHTML = slides.map(function (_, i) {
        return '<button class="mk-dot" onclick="mkGoTo(' + i + ')"></button>';
      }).join('');
    }

    function goTo(idx) {
      showSlide(idx);
      resetTimer();
    }

    function resetTimer() {
      clearInterval(slideshowTimer);
      slideshowTimer = setInterval(function () { goTo(current + 1); }, 4500);
    }

    window.mkSlidePrev = function () { goTo(current - 1); };
    window.mkSlideNext = function () { goTo(current + 1); };
    window.mkGoTo = goTo;

    stage.addEventListener('mouseenter', function () { clearInterval(slideshowTimer); });
    stage.addEventListener('mouseleave', resetTimer);

    showSlide(0);
    resetTimer();
  }

  function renderPreview(data) {
    const container = document.getElementById('mk-preview-cards');
    if (!container) return;

    const badge = document.getElementById('mk-week-badge');
    if (badge) badge.textContent = 'KW ' + data.kw + ' · ' + data.von_display + ' – ' + data.bis_display;

    const inclEl = document.getElementById('mk-incl');
    if (inclEl) inclEl.textContent = data.inklusive;

    const featured = data.kategorien.filter(function (k) { return k.id !== 'suppen'; });
    let html = '';
    featured.forEach(function (cat) {
      const dish = cat.gerichte[0];
      html += '<div class="mk-card">';
      html += '<div class="mk-cat-label">' + cat.icon + ' ' + getCatName(cat) + '</div>';
      html += '<div class="mk-dish-name">' + getName(dish) + (dish.vegi ? ' <span class="mk-vegi">🌿</span>' : '') + '</div>';
      html += '<div class="mk-dish-beilage">' + getBeilage(dish) + '</div>';
      html += '<div class="mk-dish-footer">';
      if (dish.preis) html += '<span class="mk-price">CHF ' + dish.preis + '</span>';
      html += '<span class="mk-allergene-small">(' + dish.allergene + ')</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  function renderFull(data) {
    const container = document.getElementById('mk-full-content');
    if (!container) return;

    const badge = document.getElementById('mk-week-badge-full');
    if (badge) badge.textContent = 'KW ' + data.kw + ' · ' + data.von_display + ' – ' + data.bis_display;

    const inclEl = document.getElementById('mk-incl-full');
    if (inclEl) inclEl.textContent = data.inklusive;

    const l = getLang();
    let html = '';

    data.kategorien.forEach(function (cat) {
      html += '<div class="mk-full-cat">';
      html += '<div class="mk-full-cat-header">';
      html += '<span class="mk-full-cat-icon">' + cat.icon + '</span>';
      html += '<h2 class="mk-full-cat-name">' + getCatName(cat) + '</h2>';
      html += '</div>';

      if (cat.hinweis_de) {
        const hint = l === 'en' ? (cat.hinweis_en || cat.hinweis_de) : cat.hinweis_de;
        html += '<p class="mk-full-cat-hint">' + hint + '</p>';
      }

      cat.gerichte.forEach(function (dish) {
        html += '<div class="mk-full-dish">';
        html += '<div class="mk-full-dish-left">';
        if (dish.tag) html += '<span class="mk-day-tag">' + dish.tag + '</span>';
        html += '<div>';
        html += '<div class="mk-full-dish-name">' + getName(dish);
        if (dish.vegi) html += ' <span class="mk-vegi-badge">🌿 Vegi</span>';
        html += ' <span class="mk-allergene-inline">(' + dish.allergene + ')</span>';
        html += '</div>';
        const beilage = getBeilage(dish);
        if (beilage) html += '<div class="mk-full-dish-beilage">' + beilage + '</div>';
        if (l !== 'en' && dish.name_en) {
          html += '<div class="mk-full-dish-en">' + dish.name_en;
          if (dish.beilage_en) html += ' · ' + dish.beilage_en;
          html += '</div>';
        }
        html += '</div></div>';
        if (dish.preis) html += '<div class="mk-full-price">CHF ' + dish.preis + '</div>';
        html += '</div>';
      });

      html += '</div>';
    });

    // Allergen legend
    html += '<div class="mk-allergen-section">';
    html += '<h3>Allergen-Legende</h3>';
    html += '<div class="mk-allergen-grid">';
    Object.keys(data.allergene_legende).forEach(function (k) {
      html += '<div class="mk-allergen-item"><strong>' + k + '</strong> ' + data.allergene_legende[k] + '</div>';
    });
    html += '</div>';
    html += '<p class="mk-allergen-note">🌿 = Vegetarisches Gericht &nbsp;·&nbsp; Alle Preise in CHF inkl. 8.1% MwSt. &nbsp;·&nbsp; Bei Allergien oder Unverträglichkeiten stehen wir Ihnen gerne beratend zur Seite.</p>';
    html += '</div>';

    container.innerHTML = html;
  }

  function render(data) {
    if (!data) return;
    renderSlideshow(data);
    renderPreview(data);
    renderFull(data);
  }

  window.mkRender = function () { render(mkData); };

  document.addEventListener('DOMContentLoaded', function () {
    fetch('mittagskarte.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        mkData = data;
        render(data);
      })
      .catch(function () {
        var c = document.getElementById('mk-preview-cards');
        if (c) c.innerHTML = '<p style="text-align:center;color:var(--cream-muted);padding:2rem 0;">Mittagskarte momentan nicht verfügbar.</p>';
        var f = document.getElementById('mk-full-content');
        if (f) f.innerHTML = '<p style="text-align:center;color:var(--cream-muted);padding:3rem 0;">Mittagskarte momentan nicht verfügbar.</p>';
      });
  });
})();
