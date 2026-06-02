// ─── Sprachauswahl ───
const translations = {
  de: {
    nav_start:  'Startseite',
    nav_menu:   'Speisekarte',
    nav_res:    'Reservierung',
    nav_contact:'Kontakt',
    nav_team:   'Team',
    nav_galerie:'Galerie',
  },
  fr: {
    nav_start:  'Accueil',
    nav_menu:   'Menu',
    nav_res:    'Réservation',
    nav_contact:'Contact',
    nav_team:   'Équipe',
    nav_galerie:'Galerie',
  },
  en: {
    nav_start:  'Home',
    nav_menu:   'Menu',
    nav_res:    'Reservation',
    nav_contact:'Contact',
    nav_team:   'Team',
    nav_galerie:'Gallery',
  }
};

function setLang(lang) {
  localStorage.setItem('lang', lang);
  const t = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lang') || 'de';
  setLang(saved);
});

// ─── Mobile navigation toggle
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

// Scroll-based fade-in animations
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => observer.observe(el));

// Reservation form handler
function submitReservation(e) {
  e.preventDefault();
  const form = document.getElementById('reservationForm');
  const msg = document.getElementById('formMsg');

  const vorname = document.getElementById('vorname').value.trim();
  const nachname = document.getElementById('nachname').value.trim();
  const datum = document.getElementById('datum').value;
  const uhrzeit = document.getElementById('uhrzeit').value;
  const personen = document.getElementById('personen').value;

  if (!vorname || !nachname || !datum || !uhrzeit || !personen) {
    msg.textContent = 'Bitte füllen Sie alle Pflichtfelder aus.';
    msg.style.borderColor = '#c96060';
    msg.style.color = '#c96060';
    msg.style.display = 'block';
    return;
  }

  // Show success message (in production, this would send an email or API request)
  msg.textContent = `Vielen Dank, ${vorname}! Ihre Reservierungsanfrage für ${personen} am ${formatDate(datum)} um ${uhrzeit} Uhr wurde empfangen. Wir melden uns in Kürze zur Bestätigung.`;
  msg.style.borderColor = 'var(--gold)';
  msg.style.color = 'var(--gold)';
  msg.style.display = 'block';

  form.reset();
  msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

// Set min date for reservation form to today
const datumInput = document.getElementById('datum');
if (datumInput) {
  const today = new Date().toISOString().split('T')[0];
  datumInput.setAttribute('min', today);
}
