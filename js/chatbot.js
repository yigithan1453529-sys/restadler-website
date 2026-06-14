// ─── Chatbot Data ───
const chatbotData = {
  de: {
    title: 'Adler Assistent',
    greeting: 'Grüezi! Ich bin der Adler-Assistent. Wie kann ich Ihnen helfen?',
    placeholder: 'Ihre Frage...',
    send: 'Senden',
    suggestions: ['Öffnungszeiten', 'Tisch reservieren', 'Adresse & Anfahrt', 'Speisekarte'],
    responses: [
      {
        keys: ['öffnung', 'offen', 'wann', 'geschlossen', 'uhrzeit', 'zeiten'],
        text: '🕐 Unsere Öffnungszeiten:\n\nMontag: Geschlossen\nDienstag – Sonntag: 10:00 – 22:00 Uhr\n\nWir freuen uns auf Ihren Besuch!'
      },
      {
        keys: ['reservier', 'tisch', 'buchen', 'platz', 'buchung'],
        text: '🍽️ Tisch reservieren:\n\n📱 Online: Auf unserer Reservierungsseite\n📞 Telefon: +41 71 787 53 38\n\nFür Gruppen ab 8 Personen bitten wir um Voranmeldung.',
        link: { label: 'Online reservieren →', href: 'reservierung.html' }
      },
      {
        keys: ['adresse', 'wo ', 'lage', 'standort', 'anfahrt', 'finden', 'parkplatz', 'parken'],
        text: '📍 Sie finden uns hier:\n\nWeissbadstrasse 2\n9050 Appenzell\n\nVom Bahnhof Appenzell zu Fuss in wenigen Minuten erreichbar.\n\n🚗 Parkplätze in der Nähe vorhanden.\n⚡ E-Auto-Laden nach Verfügbarkeit kostenlos.'
      },
      {
        keys: ['telefon', 'nummer', 'anrufen', 'kontakt', 'mail', 'email'],
        text: '📞 Kontakt:\n\nTelefon: +41 71 787 53 38\nE-Mail: info@adler-appenzell.ch\n\nOder schreiben Sie uns telefonisch!'
      },
      {
        keys: ['speisekarte', 'menu', 'essen', 'gericht', 'küche', 'was gibt'],
        text: '🍽️ Unsere Küche:\n\n🥩 Fleisch & Fisch (Schweizer Qualität)\n🥗 Salate & Vorspeisen\n🍔 Burger-Auswahl\n🌿 Vegetarische Gerichte\n🍨 Hausgemachte Glacé',
        link: { label: 'Zur Speisekarte →', href: 'speisekarte.html' }
      },
      {
        keys: ['glacé', 'glace', 'eis', 'dessert', 'süss', 'nachspeise'],
        text: '🍨 Unsere legendäre Hausglacé!\n\nRezept von Konditormeister Hans Leu – ohne Chemie & Farbstoffe.\n\nSorten: Vanille · Choco · Mocca · Erdbeer · Banane · Zitrone\n\nEmpfehlung: Coupe «Dänemark» mit warmer Chocosauce – CHF 13.80'
      },
      {
        keys: ['vegetarisch', 'vegi', 'vegan', 'fleischlos'],
        text: '🌿 Vegetarische Gerichte:\n\n• Käsespätzli mit Appenzeller – CHF 24.50\n• Gebackene Randen-Falafel – CHF 33.00\n• Vegi Burger – CHF 28.50\n• Diverse Salate\n\nErkennbar am 🌿 Symbol auf der Speisekarte.'
      },
      {
        keys: ['hotel', 'zimmer', 'übernacht', 'schlafen', 'nacht', 'suite'],
        text: '🛏️ Das Adler Hotel:\n\n19 gemütliche Zimmer & Suiten, alle mit eigenem Bad.\n\n✅ Reichhaltiges Frühstück\n✅ Gratis WLAN\n✅ Digital-TV\n\nAb 3 Nächten: Appenzeller Ferienkarte gratis!\n\nBuchung: +41 71 787 53 38'
      },
      {
        keys: ['1825', 'geschichte', 'generation', 'familie', 'tradition', 'co2', 'nachhaltig'],
        text: '🏠 Seit 1825 in Familienbesitz!\n\nDas historische Haus «zum Schwarzen Adler» wird heute von der 7. Generation geführt.\n\nWir sind das einzige CO₂-neutrale Hotel in Appenzell. 🌱'
      },
      {
        keys: ['allergie', 'unverträglich', 'gluten', 'laktose'],
        text: '⚠️ Bei Allergien beraten wir Sie gerne persönlich!\n\n📞 +41 71 787 53 38\n✉️ info@adler-appenzell.ch\n\nOder sprechen Sie unser Service-Team an.'
      },
      {
        keys: ['preis', 'kosten', 'chf', 'teuer', 'wie viel'],
        text: '💰 Preisübersicht:\n\nKäsespätzli: CHF 24.50\nZüri Geschnetzeltes: CHF 36.50\nRindsfilet (Angus): CHF 48.00\nBurger ab: CHF 26.50\nGlacé-Coupe: CHF 13.80\n\nAlle Preise inkl. MwSt.'
      },
      {
        keys: ['wifi', 'wlan', 'internet', 'bahn', 'zug', 'öv'],
        text: '📶 Gratis WLAN für alle Gäste.\n🚂 Direktverbindungen via Appenzeller Bahnen.\nVom Bahnhof nur wenige Minuten zu Fuss!'
      },
    ],
    fallback: 'Für diese Frage helfe ich Ihnen gerne persönlich weiter:\n📞 +41 71 787 53 38\n✉️ info@adler-appenzell.ch'
  },

  fr: {
    title: 'Assistant Adler',
    greeting: "Bonjour! Je suis l'assistant de l'Adler. Comment puis-je vous aider?",
    placeholder: 'Votre question...',
    send: 'Envoyer',
    suggestions: ["Heures d'ouverture", 'Réserver une table', 'Adresse & Accès', 'Menu'],
    responses: [
      {
        keys: ['heure', 'ouvert', 'quand', 'fermé', 'horaire'],
        text: "🕐 Heures d'ouverture:\n\nLundi: Fermé\nMardi – Dimanche: 10:00 – 22:00\n\nNous nous réjouissons de votre visite!"
      },
      {
        keys: ['réserv', 'table', 'réserver', 'place'],
        text: "🍽️ Réserver une table:\n\n📱 En ligne: Sur notre page de réservation\n📞 Téléphone: +41 71 787 53 38\n\nPour les groupes de 8+, merci de nous prévenir à l'avance.",
        link: { label: 'Réserver en ligne →', href: 'reservierung.html' }
      },
      {
        keys: ['adresse', 'où', 'situé', 'trouver', 'accès', 'parking'],
        text: "📍 Vous nous trouvez ici:\n\nWeissbadstrasse 2\n9050 Appenzell, Suisse\n\nQuelques minutes à pied depuis la gare d'Appenzell.\n\n🚗 Parking à proximité.\n⚡ Recharge électrique gratuite selon disponibilité."
      },
      {
        keys: ['téléphone', 'numéro', 'contact', 'email', 'mail'],
        text: '📞 Contact:\n\nTéléphone: +41 71 787 53 38\nE-Mail: info@adler-appenzell.ch\n\nOu écrivez-nous telefonisch!'
      },
      {
        keys: ['menu', 'manger', 'plat', 'cuisine', 'carte'],
        text: '🍽️ Notre cuisine:\n\n🥩 Viande & Poisson (qualité suisse)\n🥗 Salades & Entrées\n🍔 Sélection de Burgers\n🌿 Plats végétariens\n🍨 Glaces maison',
        link: { label: 'Voir le menu →', href: 'speisekarte.html' }
      },
      {
        keys: ['glace', 'dessert', 'sucré'],
        text: '🍨 Notre légendaire glace maison!\n\nRecette du maître confiseur Hans Leu – sans produits chimiques.\n\nParfums: Vanille · Chocolat · Moka · Fraise · Banane · Citron\n\nRecommandation: Coupe «Danemark» – CHF 13.80'
      },
      {
        keys: ['végétarien', 'vegan', 'sans viande'],
        text: '🌿 Plats végétariens:\n\n• Spätzli au fromage – CHF 24.50\n• Falafel de betterave – CHF 33.00\n• Burger végétarien – CHF 28.50\n• Diverses salades'
      },
      {
        keys: ['hôtel', 'chambre', 'nuit', 'séjour', 'suite'],
        text: "🛏️ L'Adler Hotel:\n\n19 chambres & suites, toutes avec salle de bains.\n\n✅ Riche petit-déjeuner\n✅ WLAN gratuit\n✅ TV numérique\n\nDès 3 nuits: Carte de vacances d'Appenzell offerte!\n\nRéservations: +41 71 787 53 38"
      },
      {
        keys: ['1825', 'histoire', 'génération', 'famille', 'tradition'],
        text: "🏠 En mains familiales depuis 1825!\n\nLa maison historique «zum Schwarzen Adler» est dirigée par la 7e génération.\n\nNous sommes le seul hôtel CO₂-neutre d'Appenzell. 🌱"
      },
      {
        keys: ['allergi', 'intolér', 'gluten', 'lactose'],
        text: '⚠️ Pour les allergies, nous vous conseillons volontiers!\n\n📞 +41 71 787 53 38\n✉️ info@adler-appenzell.ch'
      },
      {
        keys: ['prix', 'combien', 'chf', 'coût'],
        text: '💰 Aperçu des prix:\n\nSpätzli au fromage: CHF 24.50\nÉmincé zurichois: CHF 36.50\nFilet de bœuf: CHF 48.00\nBurger dès: CHF 26.50\nCoupe glace: CHF 13.80'
      },
    ],
    fallback: "Pour cette question, contactez-nous:\n📞 +41 71 787 53 38\n✉️ info@adler-appenzell.ch"
  },

  en: {
    title: 'Adler Assistant',
    greeting: "Hello! I'm the Adler assistant. How can I help you?",
    placeholder: 'Your question...',
    send: 'Send',
    suggestions: ['Opening hours', 'Reserve a table', 'Address & Directions', 'Menu'],
    responses: [
      {
        keys: ['hour', 'open', 'when', 'closed', 'time', 'schedule'],
        text: '🕐 Opening hours:\n\nMonday: Closed\nTuesday – Sunday: 10:00 – 22:00\n\nWe look forward to your visit!'
      },
      {
        keys: ['reserv', 'table', 'book', 'seat', 'booking'],
        text: '🍽️ Reserve a table:\n\n📱 Online: On our reservation page\n📞 Phone: +41 71 787 53 38\n\nFor groups of 8+, please let us know in advance.',
        link: { label: 'Reserve online →', href: 'reservierung.html' }
      },
      {
        keys: ['address', 'where', 'location', 'find', 'direction', 'parking', 'park'],
        text: '📍 You can find us here:\n\nWeissbadstrasse 2\n9050 Appenzell, Switzerland\n\nJust a few minutes walk from Appenzell station.\n\n🚗 Parking spaces nearby.\n⚡ Free EV charging subject to availability.'
      },
      {
        keys: ['phone', 'number', 'call', 'contact', 'email', 'mail'],
        text: '📞 Contact:\n\nPhone: +41 71 787 53 38\nE-Mail: info@adler-appenzell.ch\n\nOr message us telefonisch!'
      },
      {
        keys: ['menu', 'food', 'eat', 'dish', 'cuisine', 'serve'],
        text: '🍽️ Our kitchen:\n\n🥩 Meat & Fish (Swiss quality)\n🥗 Salads & Starters\n🍔 Burger selection\n🌿 Vegetarian dishes\n🍨 Homemade ice cream',
        link: { label: 'See full menu →', href: 'speisekarte.html' }
      },
      {
        keys: ['ice cream', 'dessert', 'sweet', 'glacé'],
        text: '🍨 Our legendary homemade ice cream!\n\nOriginal recipe from master confectioner Hans Leu – no chemicals or artificial colours.\n\nFlavours: Vanilla · Chocolate · Mocha · Strawberry · Banana · Lemon\n\nRecommendation: Coupe «Denmark» – CHF 13.80'
      },
      {
        keys: ['vegetarian', 'vegan', 'no meat', 'veggie'],
        text: '🌿 Vegetarian dishes:\n\n• Cheese Spätzli – CHF 24.50\n• Baked Beetroot Falafel – CHF 33.00\n• Veggie Burger – CHF 28.50\n• Various salads'
      },
      {
        keys: ['hotel', 'room', 'stay', 'night', 'sleep', 'suite'],
        text: '🛏️ The Adler Hotel:\n\n19 comfortable rooms & suites, all with private bathroom.\n\n✅ Rich breakfast included\n✅ Free WLAN\n✅ Digital TV\n\nFrom 3 nights: Free Appenzell holiday card!\n\nBookings: +41 71 787 53 38'
      },
      {
        keys: ['1825', 'history', 'generation', 'family', 'tradition', 'since'],
        text: '🏠 Family-owned since 1825!\n\nThe historic «zum Schwarzen Adler» house is now run by the 7th generation.\n\nWe are the only CO₂-neutral hotel in Appenzell. 🌱'
      },
      {
        keys: ['allerg', 'intoleran', 'gluten', 'lactose'],
        text: '⚠️ For allergies, we are happy to advise you!\n\n📞 +41 71 787 53 38\n✉️ info@adler-appenzell.ch'
      },
      {
        keys: ['price', 'cost', 'how much', 'chf', 'expensive'],
        text: '💰 Price overview:\n\nCheese Spätzli: CHF 24.50\nZurich-style Veal: CHF 36.50\nBeef Fillet: CHF 48.00\nBurger from: CHF 26.50\nIce cream coupe: CHF 13.80'
      },
    ],
    fallback: 'For further questions please contact us:\n📞 +41 71 787 53 38\n✉️ info@adler-appenzell.ch'
  }
};

// ─── Chatbot Core ───
function getLang() {
  return window.currentLang || localStorage.getItem('lang') || 'de';
}

function findResponse(input) {
  const lang = getLang();
  const data = chatbotData[lang] || chatbotData.de;
  const text = input.toLowerCase();
  for (const r of data.responses) {
    if (r.keys.some(k => text.includes(k))) return r;
  }
  return null;
}

function addMessage(content, isUser, link) {
  const messages = document.getElementById('cb-messages');
  const div = document.createElement('div');
  div.className = 'cb-msg ' + (isUser ? 'cb-msg-user' : 'cb-msg-bot');
  div.innerHTML = content.replace(/\n/g, '<br>');
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.className = 'cb-link';
    a.textContent = link.label;
    div.appendChild(document.createElement('br'));
    div.appendChild(a);
  }
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('cb-messages');
  const div = document.createElement('div');
  div.className = 'cb-msg cb-msg-bot cb-typing';
  div.id = 'cb-typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('cb-typing-indicator');
  if (el) el.remove();
}

function sendChatMessage(text) {
  if (!text.trim()) return;
  const lang = getLang();
  const data = chatbotData[lang] || chatbotData.de;

  addMessage(text, true);
  document.getElementById('cb-input').value = '';
  document.getElementById('cb-suggestions').style.display = 'none';

  showTyping();
  setTimeout(() => {
    removeTyping();
    const match = findResponse(text);
    if (match) {
      addMessage(match.text, false, match.link || null);
    } else {
      addMessage(data.fallback, false);
    }
  }, 700);
}

function openChatbot() {
  const lang = getLang();
  const data = chatbotData[lang] || chatbotData.de;
  const win = document.getElementById('cb-window');
  const btn = document.getElementById('cb-toggle');
  const isOpen = win.classList.contains('cb-open');

  if (isOpen) {
    win.classList.remove('cb-open');
    btn.classList.remove('cb-active');
    return;
  }

  // Update language texts
  document.getElementById('cb-title').textContent = data.title;
  document.getElementById('cb-input').placeholder = data.placeholder;
  document.getElementById('cb-send').textContent = data.send;

  // Clear and show greeting if first open
  const messages = document.getElementById('cb-messages');
  if (messages.children.length === 0) {
    addMessage(data.greeting, false);
    // Show suggestions
    const sugg = document.getElementById('cb-suggestions');
    sugg.innerHTML = '';
    data.suggestions.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'cb-suggestion';
      btn.textContent = s;
      btn.onclick = () => sendChatMessage(s);
      sugg.appendChild(btn);
    });
    sugg.style.display = 'flex';
  }

  win.classList.add('cb-open');
  btn.classList.add('cb-active');
  document.getElementById('cb-input').focus();
}

// ─── Build DOM ───
document.addEventListener('DOMContentLoaded', () => {
  const html = `
    <div id="cb-window" class="cb-window">
      <div class="cb-header">
        <div class="cb-header-info">
          <div class="cb-avatar">✦</div>
          <div>
            <div id="cb-title" class="cb-title">Adler Assistent</div>
            <div class="cb-status">● Online</div>
          </div>
        </div>
        <button class="cb-close" onclick="openChatbot()">✕</button>
      </div>
      <div id="cb-messages" class="cb-messages"></div>
      <div id="cb-suggestions" class="cb-suggestions" style="display:none;"></div>
      <div class="cb-footer">
        <input id="cb-input" class="cb-input" type="text" placeholder="Ihre Frage..."
          onkeydown="if(event.key==='Enter') sendChatMessage(this.value)">
        <button id="cb-send" class="cb-send" onclick="sendChatMessage(document.getElementById('cb-input').value)">Senden</button>
      </div>
    </div>
    <button id="cb-toggle" class="cb-toggle" onclick="openChatbot()" title="Chat">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
    </button>
  `;
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
});
