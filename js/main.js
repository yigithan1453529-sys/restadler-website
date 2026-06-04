// ─── Translations ───
const translations = {
  de: {
    nav_start:'Startseite', nav_menu:'Speisekarte', nav_res:'Reservierung',
    nav_contact:'Kontakt', nav_team:'Team', nav_galerie:'Galerie',
    day_mon:'Montag', day_tue:'Dienstag', day_wed:'Mittwoch',
    day_thu:'Donnerstag', day_fri:'Freitag', day_sat:'Samstag', day_sun:'Sonntag',
    closed:'Geschlossen', morning_hrs:'Morgens – 22:00 Uhr',

    hero_sub:'Frisch zubereitet · Regionale Zutaten · Mit Leidenschaft gekocht',
    hero_btn_res:'Tisch reservieren', hero_btn_menu:'Speisekarte',

    hl1_title:'Regionale Küche',
    hl1_desc:'Frisch zubereitet mit sorgfältig ausgewählten Zutaten aus der Region Appenzell.',
    hl2_title:'Seit 1825',
    hl2_desc:'7 Generationen Gastfreundschaft im historischen Haus zum Schwarzen Adler im Herzen von Appenzell.',
    hl3_title:'Vielfältige Küche',
    hl3_desc:'Von klassischen Schweizer Gerichten bis zu internationalen Highlights — für jeden Geschmack.',
    hl4_title:'Hausgemachte Glacé',
    hl4_desc:'Unsere legendäre Hausglacé — nach Originalrezept von Konditormeister Hans Leu, ohne Chemie & Farbstoffe.',

    gesch_label:'Unsere Geschichte',
    gesch_p1:'Willkommen im historischen Haus «zum Schwarzen Adler». Seit 1825 in Familienbesitz und nun von der 7. Generation geführt. In den letzten 30 Jahren wurde das historische Haus renoviert und ist bei den Hotel- und Restaurantgästen sehr beliebt.',
    gesch_p2:'Das Adlerhotel liegt im Dorfzentrum am Fluss Sitter. In unserem charmanten 400-jährigen Haus und im Neubau stehen Ihnen insgesamt 19 gemütlich eingerichtete Zimmer und Suiten zur Auswahl. Alle verfügen über ein eigenes Bad mit Dusche oder Badewanne und einer Toilette. Als Hotelgast profitieren Sie von einer schönen Auswahl an kostenfreien Digital-TV- und Radiokanälen und freiem Internetzugang (WLAN und LAN). Nach Verfügbarkeit schenken wir Ihnen eine kostenlose Ladung für Ihr Elektroauto.',
    gesch_p3:'Ein reichhaltiges Frühstück gehört zu einem gelungenen Tagesstart — egal ob Sie danach per Velo, zu Fuss oder per Seilbahn in den Alpstein aufbrechen. Unser Frühstücksraum ist auch Ihr Aufenthaltsraum und der Rundtisch eignet sich für einen spannenden Jass.',
    gesch_p4:'Ab 3 Nächten schenken wir Ihnen die Appenzeller Ferienkarte. Wenn Sie zusätzlich mit dem öffentlichen Verkehr aus der ganzen Schweiz nach Appenzell an- und abreisen möchten, dürfen Sie diese Billette bei Appenzellerland Tourismus bestellen.',
    gesch_p5:'Dank der Sanierung der Weissbadstrasse 2024 erneuerten wir die Ölheizung durch eine moderne Wärmepumpe mit Hybridboiler. Ab dem 1. Januar 2026 ermöglicht eine Gesetzesänderung den Kauf von Sonnenenergie direkt von ortsansässigen Produzenten — mit ¼ Strom erzeugen wir nun ¾ thermische Energie und sind das einzige CO₂-neutrale Hotel in Appenzell.',
    stat_founded:'Gegründet', stat_gen:'Generation', stat_trad:'Jahre Tradition',
    quote_text:'&bdquo;Seit 1825 —<br>Herzlichkeit,<br>die man spürt.&ldquo;',

    menu_label:'Kulinarische Highlights', menu_title:'Aus unserer Küche',
    menu_sub:'Frisch zubereitet mit regionalen Zutaten — ein Auszug unserer Speisekarte.',
    dish1_desc:'Zartes Kalbsfleisch in feiner Rahmsauce mit Champignons, dazu Rösti',
    dish2_desc:'Appenzeller Käse-Variation · Mostbröckli · Geräucherter Schinken · Oliven (2 Pers.)',
    dish3_desc:'Mit Pommes frites, Pfeffersauce und Saisonalem Gemüse',
    dish4_desc:'Hausgemachte Spätzli mit cremigem Appenzeller Käse und knusprigen Röstzwiebeln',
    dish5_desc:'Beef, Appenzeller Käse, knusprige Mostbröckli-Scheiben, Chimichurri-Sauce',
    dish6_desc:'3 Kugeln Vanilleglacé & Rahm mit warmer Chocosauce',
    menu_cta:'Vollständige Speisekarte',

    cta_title:'Reservieren Sie Ihren Tisch',
    cta_text:'Wir freuen uns auf Ihren Besuch. Reservieren Sie jetzt bequem online oder rufen Sie uns an.',
    cta_btn_res:'Online reservieren',

    sk_page_title:'Speisekarte',
    sk_page_sub:'Frisch zubereitet · Regionale Zutaten · Mit Leidenschaft gekocht',
    sk_page_note:'🌿 = Vegetarisches Gericht · Alle Preise in CHF inkl. MwSt. · Bei Allergien beraten wir Sie gerne.',
    sk_cat1:'Starter Platten & Zwischendurch', sk_cat1_title:'Starter & Zwischendurch',
    sk_cat2:'Vorspeisen & Suppen', sk_cat2_title:'Vorspeisen & Suppen',
    sk_cat3:'Hauptgänge', sk_cat3_title:'Hauptgänge',
    sk_cat3_note:'Alle Hauptgänge werden mit Saisonalem Gemüse serviert',
    sk_sub_fisch:'Fisch', sk_sub_poulet:'Poulet', sk_sub_fleisch:'Fleisch', sk_sub_vegi:'Vegetarisch',
    sk_cat4:'Salat-Fitnessteller', sk_cat4_title:'Salat-Fitnessteller',
    sk_cat4_note:'Frische Blattsalate mit Haussauce — wählen Sie Ihren Belag',
    sk_cat5:'Burger Auswahl', sk_cat5_title:'Burger Auswahl',
    sk_cat5_note:'Alle Burger werden mit Pommes frites serviert',
    sk_cat6:'Desserts', sk_cat6_title:'Desserts & Glacé',
    sk_cat6_note:'Unsere Hausglacé — nach Originalrezept von Konditormeister Hans Leu, ohne Chemie & Farbstoffe, hergestellt wie in den «1960er Jahren»',
    sk_cat7:'Kuchen', sk_cat7_title:'Kuchen',
    sk_cat8:'Unsere Lieferanten', sk_cat8_title:'Unsere Lieferanten',
    sk_cat8_note:'Wir setzen auf regionale Partner und kurze Lieferwege — für maximale Frische und Qualität auf Ihrem Teller.',
    sk_footer_note:'Alle Preise in CHF inkl. 8.1% MwSt. · Bei Allergien oder Unverträglichkeiten beraten wir Sie gerne.',

    res_page_title:'Reservierung', res_page_sub:'Wir freuen uns auf Ihren Besuch',
    res_label:'Online Reservierung', res_form_title:'Tisch reservieren',
    res_form_desc:'Füllen Sie das Formular aus und wir bestätigen Ihre Reservierung per E-Mail oder Telefon.',
    res_vorname:'Vorname', res_nachname:'Nachname', res_telefon:'Telefon', res_email:'E-Mail',
    res_datum:'Datum', res_uhrzeit:'Uhrzeit', res_select_time:'Bitte wählen',
    res_personen:'Anzahl Personen', res_select_person:'Bitte wählen',
    res_bemerkungen:'Bemerkungen / Wünsche',
    res_bemerkungen_ph:'z.B. Allergien, besondere Anlässe, Sitzwünsche...',
    res_submit:'Reservierung anfragen',
    res_hours_title:'Öffnungszeiten', res_phone_title:'Telefonisch reservieren',
    res_phone_desc:'Wir nehmen gerne Ihre Reservierung telefonisch entgegen.',
    res_hints_title:'Hinweise',
    res_hint1:'Für Gruppen ab 8 Personen bitten wir um eine Voranmeldung. Wir berücksichtigen gerne besondere Wünsche und Anlässe.',
    res_hint2:'Bei Allergien oder Unverträglichkeiten beraten wir Sie gerne persönlich.',
    res_hint3:'Das Cafe Restaurant Adler befindet sich im Adler Hotel, Weissbadstrasse 2, 9050 Appenzell.',
    form_error:'Bitte füllen Sie alle Pflichtfelder aus.',

    kon_page_title:'Kontakt & Anfahrt', kon_page_sub:'Wir sind für Sie da',
    kon_addr_title:'Adresse', kon_maps_btn:'In Google Maps öffnen', kon_maps_btn2:'Auf Google Maps anzeigen',
    kon_contact_title:'Kontakt', kon_tel_label:'Telefon', kon_email_label:'E-Mail',
    kon_hours_title:'Öffnungszeiten', kon_anfahrt_title:'Anfahrt',
    kon_car_title:'🚗 Mit dem Auto',
    kon_car_desc:'Das Adler Hotel liegt im Dorfzentrum von Appenzell am Fluss Sitter. Parkplätze sind in der Nähe des Hotels vorhanden.',
    kon_train_title:'🚂 Mit öffentlichen Verkehrsmitteln',
    kon_train_desc:'Vom Bahnhof Appenzell ist das Restaurant zu Fuss in wenigen Minuten erreichbar. Direktverbindungen aus der ganzen Schweiz via Appenzeller Bahnen.',
    kon_ev_title:'⚡ Elektroauto',
    kon_ev_desc:'Nach Verfügbarkeit bieten wir unseren Hotelgästen eine kostenlose Lademöglichkeit für Elektroautos.',
    kon_res_title:'Tisch reservieren', kon_res_desc:'Sichern Sie sich Ihren Tisch für einen unvergesslichen Abend.',
    kon_res_btn:'Online reservieren',

    team_page_title:'Unser Team', team_page_sub:'Menschen mit Leidenschaft für Gastfreundschaft',
    team_label:'Seit 1825', team_title:'Das Herz des Adlers',
    team_intro:'Hinter jedem Gericht, jedem freundlichen Lächeln und jedem perfekten Moment steht unser engagiertes Team. Wir sind stolz auf unsere Mitarbeitenden, die das Cafe Restaurant Adler jeden Tag zu einem besonderen Ort machen.',
    team1_name:'Service', team1_role:'Gastfreundschaft',
    team1_desc:'Unser Serviceteam sorgt dafür, dass Sie sich vom ersten Moment an willkommen fühlen — aufmerksam, herzlich und immer mit einem Lächeln.',
    team2_name:'Küchenchef', team2_role:'Küche & Kreation',
    team2_desc:'Mit Leidenschaft und regionalen Zutaten zaubert unser Küchenchef täglich frische Gerichte — von klassischer Schweizer Küche bis zu modernen Kreationen.',
    team3_name:'Küchenmitarbeiter', team3_role:'Küche',
    team3_desc:'Mit Sorgfalt und handwerklichem Können unterstützt unser Küchenmitarbeiter das Team bei der täglichen Zubereitung frischer, regionaler Gerichte.',
    team4_name:'Geschäftsführer', team4_role:'Leitung & Management',
    team4_desc:'Mit unternehmerischem Gespür und Leidenschaft für Gastfreundschaft führt unser Geschäftsführer das Restaurant mit Herz und Professionalität.',
    team5_name:'Familie Leu', team5_role:'7. Generation · Inhaber',
    team5_desc:'Seit 1825 in Familienbesitz — heute führt die 7. Generation das historische Haus mit Herzblut und dem Respekt für eine jahrhundertealte Tradition.',
    team_placeholder:'Möchten Sie Fotos und Namen Ihres Teams hinzufügen? Schicken Sie uns die Bilder und wir ergänzen die Seite.',
    val_label:'Was uns antreibt', val_title:'Unsere Werte',
    val1_title:'Regionalität', val1_desc:'Wir beziehen unsere Zutaten von lokalen Lieferanten aus der Region Appenzell — für maximale Frische und kurze Lieferwege.',
    val2_title:'Leidenschaft', val2_desc:'Kochen ist für uns keine Arbeit — es ist eine Berufung. Jedes Gericht wird mit Sorgfalt und Liebe zum Detail zubereitet.',
    val3_title:'Gastfreundschaft', val3_desc:'Jeder Gast ist bei uns willkommen. Wir nehmen uns Zeit für Sie und sorgen dafür, dass Sie sich wohlfühlen.',
    val4_title:'Tradition', val4_desc:'200 Jahre Geschichte verpflichten. Wir pflegen die Traditionen des Hauses und verbinden sie mit modernem Gastgebertum.',
  },

  fr: {
    nav_start:'Accueil', nav_menu:'Menu', nav_res:'Réservation',
    nav_contact:'Contact', nav_team:'Équipe', nav_galerie:'Galerie',
    day_mon:'Lundi', day_tue:'Mardi', day_wed:'Mercredi',
    day_thu:'Jeudi', day_fri:'Vendredi', day_sat:'Samedi', day_sun:'Dimanche',
    closed:'Fermé', morning_hrs:'Matin – 22:00',

    hero_sub:'Fraîchement préparé · Ingrédients régionaux · Cuisiné avec passion',
    hero_btn_res:'Réserver une table', hero_btn_menu:'Menu',

    hl1_title:'Cuisine régionale',
    hl1_desc:"Fraîchement préparé avec des ingrédients soigneusement sélectionnés de la région d'Appenzell.",
    hl2_title:'Depuis 1825',
    hl2_desc:"7 générations d'hospitalité dans la maison historique «zum Schwarzen Adler» au cœur d'Appenzell.",
    hl3_title:'Cuisine variée',
    hl3_desc:'Des plats suisses classiques aux spécialités internationales — pour tous les goûts.',
    hl4_title:'Glace maison',
    hl4_desc:'Notre légendaire glace maison — recette originale du maître confiseur Hans Leu, sans produits chimiques ni colorants.',

    gesch_label:'Notre histoire',
    gesch_p1:"Bienvenue dans la maison historique «zum Schwarzen Adler». En mains familiales depuis 1825, aujourd'hui dirigée par la 7e génération. Ces 30 dernières années, la maison historique a été rénovée et est très appréciée des hôtes de l'hôtel et du restaurant.",
    gesch_p2:"L'Adlerhotel est situé dans le centre du village au bord de la rivière Sitter. Dans notre charmante maison de 400 ans et dans la nouvelle construction, vous disposez de 19 chambres et suites confortablement aménagées. Toutes sont équipées d'une salle de bains avec douche ou baignoire et de toilettes. En tant qu'hôte, vous profitez d'une belle sélection de chaînes TV et radio numériques gratuites et d'un accès Internet gratuit (WLAN et LAN). Selon disponibilité, nous vous offrons une recharge gratuite pour votre voiture électrique.",
    gesch_p3:"Un riche petit-déjeuner est la clé d'un bon départ — que vous partiez à vélo, à pied ou par téléphérique vers l'Alpstein. Notre salle de petit-déjeuner est aussi votre salon et la table ronde est idéale pour une partie de jass.",
    gesch_p4:"À partir de 3 nuits, nous vous offrons la carte de vacances d'Appenzell. Si vous souhaitez également voyager depuis toute la Suisse en transports publics, vous pouvez commander vos billets auprès d'Appenzellerland Tourismus.",
    gesch_p5:"Grâce à la rénovation de la Weissbadstrasse en 2024, nous avons remplacé le chauffage au mazout par une pompe à chaleur moderne. Depuis le 1er janvier 2026, un changement de loi permet l'achat d'énergie solaire directement auprès de producteurs locaux — avec ¼ d'électricité, nous produisons ¾ d'énergie thermique et sommes le seul hôtel CO₂-neutre d'Appenzell.",
    stat_founded:'Fondé', stat_gen:'Génération', stat_trad:'Ans de tradition',
    quote_text:"&bdquo;Depuis 1825 —<br>Hospitalité<br>que l'on ressent.&ldquo;",

    menu_label:'Spécialités culinaires', menu_title:'De notre cuisine',
    menu_sub:'Fraîchement préparé avec des ingrédients régionaux — un extrait de notre menu.',
    dish1_desc:'Tendre veau en sauce à la crème avec champignons, servi avec rösti',
    dish2_desc:"Variation de fromage d'Appenzell · Mostbröckli · Jambon fumé · Olives (2 pers.)",
    dish3_desc:'Avec pommes frites, sauce au poivre et légumes de saison',
    dish4_desc:"Spätzli maison avec fromage d'Appenzell crémeux et oignons frits croustillants",
    dish5_desc:"Bœuf, fromage d'Appenzell, tranches croustillantes de mostbröckli, sauce chimichurri",
    dish6_desc:'3 boules de glace à la vanille & crème avec sauce chaude au chocolat',
    menu_cta:'Menu complet',

    cta_title:'Réservez votre table',
    cta_text:'Nous nous réjouissons de votre visite. Réservez maintenant en ligne ou appelez-nous.',
    cta_btn_res:'Réserver en ligne',

    sk_page_title:'Menu',
    sk_page_sub:'Fraîchement préparé · Ingrédients régionaux · Cuisiné avec passion',
    sk_page_note:"🌿 = Plat végétarien · Tous les prix en CHF TVA incluse · Pour les allergies, n'hésitez pas à nous consulter.",
    sk_cat1:'Entrées & Amuse-bouches', sk_cat1_title:'Entrées & Amuse-bouches',
    sk_cat2:'Entrées & Soupes', sk_cat2_title:'Entrées & Soupes',
    sk_cat3:'Plats principaux', sk_cat3_title:'Plats principaux',
    sk_cat3_note:'Tous les plats principaux sont servis avec des légumes de saison',
    sk_sub_fisch:'Poisson', sk_sub_poulet:'Volaille', sk_sub_fleisch:'Viande', sk_sub_vegi:'Végétarien',
    sk_cat4:'Salade-Fitness', sk_cat4_title:'Salade-Fitness',
    sk_cat4_note:'Salade fraîche avec sauce maison — choisissez votre garniture',
    sk_cat5:'Sélection de Burgers', sk_cat5_title:'Sélection de Burgers',
    sk_cat5_note:'Tous les burgers sont servis avec des pommes frites',
    sk_cat6:'Desserts', sk_cat6_title:'Desserts & Glaces',
    sk_cat6_note:'Notre glace maison — recette originale du maître confiseur Hans Leu, sans produits chimiques ni colorants, préparée comme dans les «années 1960»',
    sk_cat7:'Pâtisseries', sk_cat7_title:'Pâtisseries',
    sk_cat8:'Nos fournisseurs', sk_cat8_title:'Nos fournisseurs',
    sk_cat8_note:'Nous privilégions les partenaires régionaux et les circuits courts — pour une fraîcheur et une qualité maximales dans votre assiette.',
    sk_footer_note:"Tous les prix en CHF TVA 8.1% incluse · Pour les allergies ou intolérances, n'hésitez pas à nous consulter.",

    res_page_title:'Réservation', res_page_sub:'Nous nous réjouissons de votre visite',
    res_label:'Réservation en ligne', res_form_title:'Réserver une table',
    res_form_desc:'Remplissez le formulaire et nous confirmerons votre réservation par e-mail ou téléphone.',
    res_vorname:'Prénom', res_nachname:'Nom', res_telefon:'Téléphone', res_email:'E-Mail',
    res_datum:'Date', res_uhrzeit:'Heure', res_select_time:'Veuillez choisir',
    res_personen:'Nombre de personnes', res_select_person:'Veuillez choisir',
    res_bemerkungen:'Remarques / Souhaits',
    res_bemerkungen_ph:'p.ex. allergies, occasions spéciales, préférences de place...',
    res_submit:'Demander une réservation',
    res_hours_title:"Heures d'ouverture", res_phone_title:'Réserver par téléphone',
    res_phone_desc:'Nous acceptons volontiers votre réservation par téléphone.',
    res_hints_title:'Informations',
    res_hint1:"Pour les groupes de 8 personnes et plus, nous vous prions de vous inscrire à l'avance. Nous tenons compte volontiers de vos souhaits particuliers.",
    res_hint2:'En cas d\'allergies ou d\'intolérances, nous vous conseillons volontiers.',
    res_hint3:"Le Café Restaurant Adler se trouve à l'Adler Hotel, Weissbadstrasse 2, 9050 Appenzell.",
    form_error:'Veuillez remplir tous les champs obligatoires.',

    kon_page_title:'Contact & Accès', kon_page_sub:'Nous sommes là pour vous',
    kon_addr_title:'Adresse', kon_maps_btn:'Ouvrir dans Google Maps', kon_maps_btn2:'Afficher sur Google Maps',
    kon_contact_title:'Contact', kon_tel_label:'Téléphone', kon_email_label:'E-Mail',
    kon_hours_title:"Heures d'ouverture", kon_anfahrt_title:'Accès',
    kon_car_title:'🚗 En voiture',
    kon_car_desc:"L'Adler Hotel est situé dans le centre du village d'Appenzell au bord de la rivière Sitter. Des places de stationnement sont disponibles à proximité de l'hôtel.",
    kon_train_title:'🚂 En transports publics',
    kon_train_desc:"Depuis la gare d'Appenzell, le restaurant est accessible à pied en quelques minutes. Liaisons directes depuis toute la Suisse via les Chemins de fer d'Appenzell.",
    kon_ev_title:'⚡ Voiture électrique',
    kon_ev_desc:'Selon disponibilité, nous offrons à nos hôtes une recharge gratuite pour les voitures électriques.',
    kon_res_title:'Réserver une table', kon_res_desc:'Assurez-vous votre table pour une soirée inoubliable.',
    kon_res_btn:'Réserver en ligne',

    team_page_title:'Notre équipe', team_page_sub:"Des gens passionnés par l'hospitalité",
    team_label:'Depuis 1825', team_title:"Le cœur de l'Adler",
    team_intro:"Derrière chaque plat, chaque sourire et chaque moment parfait se trouve notre équipe dévouée. Nous sommes fiers de nos collaborateurs qui font du Café Restaurant Adler un lieu spécial chaque jour.",
    team1_name:'Service', team1_role:'Hospitalité',
    team1_desc:'Notre équipe de service veille à ce que vous vous sentiez le bienvenu dès le premier instant — attentif, chaleureux et toujours avec le sourire.',
    team2_name:'Chef de cuisine', team2_role:'Cuisine & Création',
    team2_desc:'Avec passion et des ingrédients régionaux, notre chef crée chaque jour des plats frais — de la cuisine suisse classique aux créations modernes.',
    team3_name:'Aide de cuisine', team3_role:'Cuisine',
    team3_desc:"Avec soin et savoir-faire, notre aide de cuisine soutient l'équipe dans la préparation quotidienne de plats frais et régionaux.",
    team4_name:'Directeur', team4_role:'Direction & Management',
    team4_desc:"Avec un sens entrepreneurial et une passion pour l'hospitalité, notre directeur gère le restaurant avec cœur et professionnalisme.",
    team5_name:'Famille Leu', team5_role:'7e génération · Propriétaires',
    team5_desc:"En mains familiales depuis 1825 — aujourd'hui, la 7e génération dirige la maison historique avec cœur et le respect d'une tradition séculaire.",
    team_placeholder:'Souhaitez-vous ajouter des photos et les noms de votre équipe ? Envoyez-nous les photos et nous complèterons la page.',
    val_label:'Ce qui nous motive', val_title:'Nos valeurs',
    val1_title:'Régionalité', val1_desc:"Nous nous approvisionnons auprès de fournisseurs locaux de la région d'Appenzell — pour une fraîcheur maximale et des circuits courts.",
    val2_title:'Passion', val2_desc:"Cuisiner n'est pas un travail pour nous — c'est une vocation. Chaque plat est préparé avec soin et amour du détail.",
    val3_title:'Hospitalité', val3_desc:'Chaque hôte est le bienvenu chez nous. Nous prenons le temps pour vous et veillons à votre bien-être.',
    val4_title:'Tradition', val4_desc:"200 ans d'histoire nous engagent. Nous cultivons les traditions de la maison en les associant à une hospitalité moderne.",
  },

  en: {
    nav_start:'Home', nav_menu:'Menu', nav_res:'Reservation',
    nav_contact:'Contact', nav_team:'Team', nav_galerie:'Gallery',
    day_mon:'Monday', day_tue:'Tuesday', day_wed:'Wednesday',
    day_thu:'Thursday', day_fri:'Friday', day_sat:'Saturday', day_sun:'Sunday',
    closed:'Closed', morning_hrs:'Morning – 22:00',

    hero_sub:'Freshly prepared · Regional ingredients · Cooked with passion',
    hero_btn_res:'Reserve a table', hero_btn_menu:'Menu',

    hl1_title:'Regional cuisine',
    hl1_desc:'Freshly prepared with carefully selected ingredients from the Appenzell region.',
    hl2_title:'Since 1825',
    hl2_desc:'7 generations of hospitality in the historic «zum Schwarzen Adler» house in the heart of Appenzell.',
    hl3_title:'Diverse cuisine',
    hl3_desc:'From classic Swiss dishes to international highlights — for every taste.',
    hl4_title:'Homemade ice cream',
    hl4_desc:'Our legendary homemade ice cream — original recipe from master confectioner Hans Leu, without chemicals or artificial colours.',

    gesch_label:'Our history',
    gesch_p1:'Welcome to the historic «zum Schwarzen Adler» house. Family-owned since 1825, now run by the 7th generation. Over the last 30 years, the historic building has been renovated and is very popular with hotel and restaurant guests.',
    gesch_p2:'The Adlerhotel is located in the village centre by the Sitter river. In our charming 400-year-old building and new wing, we offer 19 comfortably furnished rooms and suites. All have a private bathroom with shower or bath and toilet. As a hotel guest, you enjoy a wide selection of free digital TV and radio channels and free Internet access (WLAN and LAN). Subject to availability, we offer you a free charge for your electric vehicle.',
    gesch_p3:'A hearty breakfast is the start of a great day — whether you head off by bike, on foot or by cable car into the Alpstein. Our breakfast room also serves as your lounge and the round table is ideal for a game of Jass.',
    gesch_p4:'From 3 nights onwards, we give you the Appenzell holiday card. If you also want to travel from anywhere in Switzerland by public transport, you can order your tickets from Appenzellerland Tourismus.',
    gesch_p5:'Thanks to the renovation of Weissbadstrasse in 2024, we replaced the oil heating with a modern heat pump. From 1 January 2026, a change in law allows the purchase of solar energy directly from local producers — with ¼ electricity we produce ¾ thermal energy and are the only CO₂-neutral hotel in Appenzell.',
    stat_founded:'Founded', stat_gen:'Generation', stat_trad:'Years of tradition',
    quote_text:'&bdquo;Since 1825 —<br>Hospitality<br>you can feel.&ldquo;',

    menu_label:'Culinary highlights', menu_title:'From our kitchen',
    menu_sub:'Freshly prepared with regional ingredients — a selection from our menu.',
    dish1_desc:'Tender veal in cream sauce with mushrooms, served with rösti',
    dish2_desc:'Appenzell cheese variation · Mostbröckli · Smoked ham · Olives (2 pers.)',
    dish3_desc:'With French fries, pepper sauce and seasonal vegetables',
    dish4_desc:'Homemade spätzli with creamy Appenzell cheese and crispy fried onions',
    dish5_desc:'Beef, Appenzell cheese, crispy mostbröckli slices, chimichurri sauce',
    dish6_desc:'3 scoops of vanilla ice cream & cream with warm chocolate sauce',
    menu_cta:'Full menu',

    cta_title:'Reserve your table',
    cta_text:'We look forward to your visit. Reserve online or give us a call.',
    cta_btn_res:'Reserve online',

    sk_page_title:'Menu',
    sk_page_sub:'Freshly prepared · Regional ingredients · Cooked with passion',
    sk_page_note:'🌿 = Vegetarian dish · All prices in CHF incl. VAT · For allergies, we are happy to advise you.',
    sk_cat1:'Starters & Snacks', sk_cat1_title:'Starters & Snacks',
    sk_cat2:'Starters & Soups', sk_cat2_title:'Starters & Soups',
    sk_cat3:'Main courses', sk_cat3_title:'Main courses',
    sk_cat3_note:'All main courses are served with seasonal vegetables',
    sk_sub_fisch:'Fish', sk_sub_poulet:'Poultry', sk_sub_fleisch:'Meat', sk_sub_vegi:'Vegetarian',
    sk_cat4:'Salad fitness plate', sk_cat4_title:'Salad fitness plate',
    sk_cat4_note:'Fresh salad leaves with house dressing — choose your topping',
    sk_cat5:'Burger selection', sk_cat5_title:'Burger selection',
    sk_cat5_note:'All burgers are served with French fries',
    sk_cat6:'Desserts', sk_cat6_title:'Desserts & Ice cream',
    sk_cat6_note:'Our homemade ice cream — original recipe from master confectioner Hans Leu, without chemicals or artificial colours, made as in the «1960s»',
    sk_cat7:'Cakes', sk_cat7_title:'Cakes',
    sk_cat8:'Our suppliers', sk_cat8_title:'Our suppliers',
    sk_cat8_note:'We rely on regional partners and short delivery routes — for maximum freshness and quality on your plate.',
    sk_footer_note:'All prices in CHF incl. 8.1% VAT · For allergies or intolerances, we are happy to advise you.',

    res_page_title:'Reservation', res_page_sub:'We look forward to your visit',
    res_label:'Online reservation', res_form_title:'Reserve a table',
    res_form_desc:'Fill in the form and we will confirm your reservation by email or phone.',
    res_vorname:'First name', res_nachname:'Last name', res_telefon:'Phone', res_email:'E-mail',
    res_datum:'Date', res_uhrzeit:'Time', res_select_time:'Please select',
    res_personen:'Number of people', res_select_person:'Please select',
    res_bemerkungen:'Comments / Requests',
    res_bemerkungen_ph:'e.g. allergies, special occasions, seating preferences...',
    res_submit:'Request reservation',
    res_hours_title:'Opening hours', res_phone_title:'Reserve by phone',
    res_phone_desc:'We are happy to take your reservation by phone.',
    res_hints_title:'Information',
    res_hint1:'For groups of 8 or more, we ask for advance notice. We are happy to accommodate special requests.',
    res_hint2:'For allergies or intolerances, we are happy to advise you personally.',
    res_hint3:'Cafe Restaurant Adler is located in the Adler Hotel, Weissbadstrasse 2, 9050 Appenzell.',
    form_error:'Please fill in all required fields.',

    kon_page_title:'Contact & Directions', kon_page_sub:'We are here for you',
    kon_addr_title:'Address', kon_maps_btn:'Open in Google Maps', kon_maps_btn2:'Show on Google Maps',
    kon_contact_title:'Contact', kon_tel_label:'Phone', kon_email_label:'E-mail',
    kon_hours_title:'Opening hours', kon_anfahrt_title:'Directions',
    kon_car_title:'🚗 By car',
    kon_car_desc:'The Adler Hotel is located in the village centre of Appenzell by the Sitter river. Parking spaces are available near the hotel.',
    kon_train_title:'🚂 By public transport',
    kon_train_desc:'From Appenzell station, the restaurant is reachable on foot in just a few minutes. Direct connections from all over Switzerland via Appenzeller Bahnen.',
    kon_ev_title:'⚡ Electric vehicle',
    kon_ev_desc:'Subject to availability, we offer our hotel guests a free charge for electric vehicles.',
    kon_res_title:'Reserve a table', kon_res_desc:'Secure your table for an unforgettable evening.',
    kon_res_btn:'Reserve online',

    team_page_title:'Our team', team_page_sub:'People with a passion for hospitality',
    team_label:'Since 1825', team_title:'The heart of the Adler',
    team_intro:'Behind every dish, every friendly smile and every perfect moment is our dedicated team. We are proud of our staff who make Cafe Restaurant Adler a special place every day.',
    team1_name:'Service', team1_role:'Hospitality',
    team1_desc:'Our service team ensures you feel welcome from the very first moment — attentive, warm and always with a smile.',
    team2_name:'Head chef', team2_role:'Kitchen & Creation',
    team2_desc:'With passion and regional ingredients, our head chef creates fresh dishes daily — from classic Swiss cuisine to modern creations.',
    team3_name:'Kitchen assistant', team3_role:'Kitchen',
    team3_desc:'With care and craftsmanship, our kitchen assistant supports the team in the daily preparation of fresh, regional dishes.',
    team4_name:'Manager', team4_role:'Management & Operations',
    team4_desc:'With entrepreneurial spirit and a passion for hospitality, our manager leads the restaurant with heart and professionalism.',
    team5_name:'Leu Family', team5_role:'7th generation · Owners',
    team5_desc:'Family-owned since 1825 — today the 7th generation runs the historic house with heart and respect for a centuries-old tradition.',
    team_placeholder:'Would you like to add photos and names of your team? Send us the pictures and we will update the page.',
    val_label:'What drives us', val_title:'Our values',
    val1_title:'Regionality', val1_desc:'We source our ingredients from local suppliers in the Appenzell region — for maximum freshness and short delivery routes.',
    val2_title:'Passion', val2_desc:'Cooking is not a job for us — it is a calling. Every dish is prepared with care and attention to detail.',
    val3_title:'Hospitality', val3_desc:'Every guest is welcome with us. We take time for you and ensure you feel at ease.',
    val4_title:'Tradition', val4_desc:'200 years of history oblige. We uphold the traditions of the house and combine them with modern hospitality.',
  }
};

function setLang(lang) {
  localStorage.setItem('lang', lang);
  window.currentLang = lang;
  document.documentElement.lang = lang === 'de' ? 'de' : lang === 'fr' ? 'fr' : 'en';
  const t = translations[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
  });

  // Speisekarte item-fr handling
  document.querySelectorAll('.item-fr').forEach(el => {
    if (!el.dataset.original) el.dataset.original = el.textContent;
    const parts = el.dataset.original.split(' · ');
    if (lang === 'de') {
      el.style.display = 'none';
    } else {
      el.style.display = '';
      el.textContent = (lang === 'fr' ? parts[0] : parts[1] || parts[0] || '').trim();
    }
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lang') || 'de';
  window.currentLang = saved;
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
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

// ─── Scroll fade-in
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
fadeEls.forEach(el => observer.observe(el));

// ─── Reservation form
function submitReservation(e) {
  e.preventDefault();
  const form = document.getElementById('reservationForm');
  const msg = document.getElementById('formMsg');
  const lang = window.currentLang || 'de';
  const t = translations[lang];

  const vorname = document.getElementById('vorname').value.trim();
  const nachname = document.getElementById('nachname').value.trim();
  const datum = document.getElementById('datum').value;
  const uhrzeit = document.getElementById('uhrzeit').value;
  const personen = document.getElementById('personen').value;

  if (!vorname || !nachname || !datum || !uhrzeit || !personen) {
    msg.textContent = t.form_error;
    msg.style.borderColor = '#c96060';
    msg.style.color = '#c96060';
    msg.style.display = 'block';
    return;
  }

  msg.textContent = `${vorname} — ${personen} · ${formatDate(datum)} · ${uhrzeit}`;
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

const datumInput = document.getElementById('datum');
if (datumInput) {
  datumInput.setAttribute('min', new Date().toISOString().split('T')[0]);
}
