import type { CityDetails } from '../types';

const FALLBACK: CityDetails = {
  features: 'Iconic destination with significant cultural and natural heritage.',
  environment: 'Climate and geography vary; consult travel resources for specifics.',
  geography: 'Reachable via international transport links.',
  products: 'Local crafts, agricultural goods, and regional specialties.',
  economy: 'Tourism alongside traditional industries.',
};

const DATA: Record<string, CityDetails> = {
  venice: {
    features:
      "118 islands linked by 400+ bridges, threaded by 150 canals. UNESCO heritage; St. Mark's Basilica, Rialto Bridge, Doge's Palace, the Murano and Burano islands.",
    environment:
      'Built on wooden piles in a tidal lagoon; the city is sinking ~2 mm/year. The MOSE flood-barrier system has actively protected the city from acqua alta since 2020.',
    geography:
      'Northeastern Italy, gateway to the Adriatic. Connected to the mainland by the 4-km Ponte della Libertà; Marco Polo Airport handles international arrivals.',
    products:
      'Murano glass, Burano lace, prosecco, baccalà mantecato, risotto al nero di seppia. Centuries-old artisan guilds still operate.',
    economy:
      'Tourism dominates (~60% of GDP) — cruise ships, day-trippers and short stays. Shipbuilding heritage at the Venetian Arsenal; small but premium glass and lace exports.',
  },
  barcelona: {
    features:
      'Capital of Catalonia. Antoni Gaudí\'s Sagrada Família, Park Güell and Casa Batlló; Gothic Quarter; La Rambla; FC Barcelona at Camp Nou.',
    environment:
      'Mediterranean climate, flanked by Collserola hills and Barceloneta beach. The 2016 "superblocks" plan reclaims streets from cars to widen pedestrian space.',
    geography:
      'Northeast Spain on the Mediterranean. Major Western Mediterranean cruise port; high-speed rail to Madrid (~2.5 h) and France via the AVE network.',
    products:
      'Cava sparkling wine, Iberico ham, calçots, Catalan textiles and leather, Modernista design objects.',
    economy:
      'Tourism, fashion, biotech and a fast-growing tech-startup scene. Hosts the annual Mobile World Congress; ~3 M cruise passengers per year before recent caps.',
  },
  amsterdam: {
    features:
      'Concentric 17th-century canal ring (UNESCO), 1,500+ bridges, narrow gabled merchant houses. Anne Frank House, Rijksmuseum, Van Gogh Museum.',
    environment:
      'Much of the city sits below sea level on wooden piles, with 100 km of canals. Bicycle-first urban planning — about 880 K bikes for 870 K residents.',
    geography:
      'Capital of the Netherlands, on the IJ bay near the North Sea. Schiphol is among Europe\'s top three airports; direct rail to Brussels, Paris and London.',
    products:
      'Tulips and bulb flowers, Gouda cheese, jenever, diamonds (the Asscher cut), Delftware ceramics, herring.',
    economy:
      'Financial services, tech (Booking.com, Adyen), creative industries, port logistics, flower trade and tourism.',
  },
  santorini: {
    features:
      'Crescent-shaped volcanic caldera with whitewashed cliff villages — Oia and Fira — and signature blue-domed churches. Black, red and white volcanic beaches.',
    environment:
      'Active volcanic island; last eruption 1950. No surface freshwater — all drinking water is desalinated. Hot dry summers, mild winters.',
    geography:
      'Southern Aegean, in the Cyclades archipelago, ~200 km southeast of Athens. Reached by ferry (5–8 h) or 45-min flight; cruise ships moor inside the caldera.',
    products:
      'Assyrtiko white wine (volcanic terroir, PDO since 1971), cherry tomatoes, fava beans, capers, white aubergines.',
    economy:
      'Tourism is ~70% of island GDP, hyper-seasonal (May–October). Boutique winemaking and traditional fishing make up the rest.',
  },
  dubrovnik: {
    features:
      '"Pearl of the Adriatic" — a walled medieval city of polished marble streets and red-tiled roofs. Famed as Game of Thrones\' King\'s Landing.',
    environment:
      'Mediterranean coast with forested limestone mountains rising sharply behind. Surrounded by 1,940 m of intact 13th-century stone walls.',
    geography:
      'Southern Croatia on the Dalmatian coast, near Bosnia and Montenegro borders. Cruise port with 1-h flights to most European capitals.',
    products:
      'Konavle silk embroidery, Croatian wine (Plavac Mali, Pošip), Pelješac olive oil, Ston oysters, limestone craftsmanship.',
    economy:
      'Tourism dominates (~80% of city revenue). Maritime trade heritage; modest olive and vineyard agriculture in the Konavle valley.',
  },
  reykjavik: {
    features:
      'World\'s northernmost capital. Hallgrímskirkja modernist church, Harpa concert hall, the Sun Voyager sculpture; gateway to the aurora borealis and geothermal pools.',
    environment:
      'Geothermal-powered — about 90% of homes are heated by hot springs. Sub-arctic climate; midnight sun in summer, dark winters and frequent storms.',
    geography:
      'Southwest Iceland on Faxaflói Bay. Keflavík Airport is a North-Atlantic stopover hub; 40 km from the Blue Lagoon and Reykjanes Peninsula volcanoes.',
    products:
      'Renewable-energy expertise, Icelandic wool (the lopapeysa sweater), skyr yogurt, fresh cod and haddock, Brennivín schnapps.',
    economy:
      'Fisheries are ~40% of national exports; renewable-energy services, tourism (~10% of GDP), and tech firms (CCP Games, green-powered data centres).',
  },
  paris: {
    features:
      "World\'s most-visited city. Eiffel Tower, Louvre, Notre-Dame, Champs-Élysées, Versailles. UNESCO Seine banks; capital of haute couture.",
    environment:
      'Temperate Atlantic climate; the Seine bisects a compact 105 km² centre of Haussmann boulevards. The 2024 Olympics catalysed greening and Seine cleanup investments.',
    geography:
      'North-central France. CDG, Orly and Beauvais make it Europe\'s biggest aviation hub; TGV reaches Brussels in 1 h 22, London in 2 h 16.',
    products:
      'Haute couture (LVMH, Chanel, Dior), perfume, champagne, foie gras, brie and camembert, the croissant.',
    economy:
      'Global headquarters for fashion and luxury (LVMH, Kering); finance hub La Défense; tourism, gastronomy, cultural exports. ~€750 B Île-de-France GDP.',
  },
  florence: {
    features:
      'Birthplace of the Renaissance. Brunelleschi\'s Duomo, the Uffizi, Ponte Vecchio, Michelangelo\'s David. UNESCO historic centre.',
    environment:
      'Tuscan basin ringed by hills; Mediterranean climate. The Arno river bisects the city — its 1966 flood prompted modern art-conservation infrastructure.',
    geography:
      'Central Italy in Tuscany. 1.5 h by train to Rome, 2 h to Milan; surrounded by Chianti wine country and the classic Tuscan hill towns.',
    products:
      'Tuscan leather goods, gold filigree from the Ponte Vecchio jewellers, Pucci silks, Chianti wine, olive oil, pecorino, biscotti and cantucci.',
    economy:
      'Tourism is ~25% of regional GDP. High-end leather and fashion (Gucci and Ferragamo HQ are nearby), wine exports, art-restoration services.',
  },
  kyoto: {
    features:
      'Japan\'s former imperial capital (794–1868). 17 UNESCO sites, 1,600 Buddhist temples, 400 Shinto shrines. Kiyomizu-dera, Fushimi Inari\'s 10,000 torii, the Gion geisha quarter.',
    environment:
      'Bowl-shaped basin ringed by mountains; humid summers, cold winters. Cherry blossoms in April; vivid maple foliage in November.',
    geography:
      'West-central Honshu, in the Kansai region. 30-min bullet train from Osaka, 2 h from Tokyo. Inland city without sea access.',
    products:
      'Nishijin silk weaving, Kiyomizu pottery, Uji matcha green tea, tofu and yuba, washi paper, kaiseki cuisine, sake.',
    economy:
      'Cultural tourism and traditional crafts, alongside surprisingly heavyweight tech: Nintendo, Kyocera, Rohm and Murata are headquartered here.',
  },
  bali: {
    features:
      '"Island of the Gods" — Hindu majority in Muslim Indonesia. UNESCO Jatiluwih rice terraces, Ubud yoga retreats, surf at Canggu and Uluwatu, sunset temples (Tanah Lot, Uluwatu).',
    environment:
      'Tropical volcanic island; Mount Agung (3,031 m) is sacred and active. Year-round rain feeds the centuries-old subak irrigation system. Biodiversity hotspot.',
    geography:
      'East of Java in the Indonesian archipelago. Ngurah Rai Airport handles 25 M+ passengers; direct flights from Singapore, Tokyo and Sydney.',
    products:
      'Coffee (Arabica and the controversial Kopi Luwak), subak-irrigated rice, woodcarvings (Mas), batik textiles, silver jewellery (Celuk), arak.',
    economy:
      'Tourism is ~80% of island GDP — about $10 B annually. Agriculture (rice, coffee, vanilla) and handicrafts make up most of the rest.',
  },
  phuket: {
    features:
      'Thailand\'s largest island. Sino-Portuguese Old Town in Phuket City, Patong Beach nightlife, Maya Bay (closed 2018–22 to recover), the 45-m Big Buddha.',
    environment:
      'Tropical monsoon climate. Karst limestone islands rise out of Phang Nga Bay; degraded coral reefs, mangroves, rubber plantations inland.',
    geography:
      'Andaman Sea coast of southern Thailand. International airport with 30+ direct routes; connected to the mainland by the Sarasin Bridge.',
    products:
      'Natural rubber (the largest cash crop), pearls, cashew nuts, batik, longan and durian fruit, dried seafood, Phuket-style hokkien noodles.',
    economy:
      'Tourism (~70%), rubber plantations (~10%), fishing and marine cargo. The historic tin-mining boom shaped Old Town\'s mansion architecture.',
  },
  boracay: {
    features:
      '7-km tropical island. White Beach is 4 km of powder-fine sand; spectacular sunsets. The 2018 closure for environmental rehabilitation became a global case study.',
    environment:
      'Coral-fringed island. "Amihan" (cool dry) and "habagat" (rainy) seasons; strict zoning since 2018 reopening governs noise, alcohol and density.',
    geography:
      'Off Panay\'s northern tip in the Western Visayas, central Philippines. 1-h flight from Manila to Caticlan, then a 30-min boat.',
    products:
      'Coconut products, dried mangoes, seashell crafts, woven nipa-palm souvenirs, fresh seafood — kinilaw, lapu-lapu fish, Boracay puka shells.',
    economy:
      'Tourism is over 90% of the local economy. Pre-tourism: small Aeta and Visayan fishing villages. Daily visitor cap of 19,200 since reopening.',
  },
  bangkok: {
    features:
      '"Krung Thep" — the City of Angels. Grand Palace and Wat Phra Kaew, Wat Pho\'s reclining Buddha, Chatuchak weekend market, floating markets and street-food culture.',
    environment:
      'Tropical and humid. On the Chao Phraya river delta; sinking ~1 cm/year due to groundwater extraction. PM2.5 haze recurs every dry season.',
    geography:
      'Central Thailand, near the Gulf of Thailand. Suvarnabhumi (BKK) and Don Mueang (DMK) make Bangkok one of Asia\'s busiest aviation hubs.',
    products:
      'Thai silk (Jim Thompson), gemstones (rubies, sapphires), jasmine rice, durian, mangosteen, green and red curry pastes, longan honey.',
    economy:
      'About 50% of Thailand\'s GDP. Banking and finance (CP Group, Siam Cement), apparel manufacturing, and consistently the world\'s most-visited city.',
  },
  siemreap: {
    features:
      'Gateway to Angkor Archaeological Park — Angkor Wat, the Bayon at Angkor Thom, Ta Prohm. Pub Street nightlife; floating villages on Tonle Sap.',
    environment:
      'Tropical monsoon; flat plain near Tonle Sap, Southeast Asia\'s largest lake which expands fivefold in the wet season. Heavy rains May–October.',
    geography:
      'Northwest Cambodia. International airport with regional flights from Bangkok, Singapore and Kuala Lumpur; ~8 h drive from Phnom Penh.',
    products:
      'Krama (cotton checkered scarves), silver crafts, rattan weaving, jasmine rice, freshwater fish from Tonle Sap, palm sugar.',
    economy:
      'Tourism is ~60% of provincial GDP. Angkor Wat alone draws 2 M+ visitors annually; small-scale handicrafts and rice farming on the side.',
  },
  seoul: {
    features:
      'South Korea\'s capital — ancient meets ultra-modern. Gyeongbokgung Palace, Bukchon hanok village, N Seoul Tower on Namsan, Gangnam shopping districts.',
    environment:
      'The Han River bisects the city; surrounded by Bukhansan and Namsan mountains. Four distinct seasons; humid summers, harsh winters, springtime fine-dust pollution.',
    geography:
      'Northwest South Korea, ~50 km from the DMZ. Incheon Airport handles 70 M+ passengers — the world\'s busiest hub for transfers.',
    products:
      'K-pop and K-drama IP, kimchi, soju, Korean ginseng, K-beauty cosmetics, semiconductors, mobile phones.',
    economy:
      'About 20% of South Korea\'s GDP. Headquarters of Samsung, Hyundai, LG. K-pop alone generates ~$10 B annually; tourism contributes ~$15 B.',
  },
  newyork: {
    features:
      '"The city that never sleeps." Statue of Liberty, Times Square, Central Park, Broadway, the Empire State Building. Five boroughs, 8.3 M residents.',
    environment:
      'Mid-Atlantic, on Hudson and East rivers. Hot humid summers, cold winters with snowstorms. Sea-level rise threatens coastal Brooklyn and Queens neighbourhoods.',
    geography:
      'Northeast US Atlantic coast. Three airports (JFK, LGA, EWR); the subway is the busiest in the western world; major Atlantic seaport.',
    products:
      'Financial services (Wall Street), media (publishing, TV networks), fashion (Garment District), tech (NYC Tech Alliance), arts and Broadway theatre.',
    economy:
      '~$1.7 T metro GDP, top-five city worldwide. Finance ~17%, real estate ~13%, professional services ~10%, tourism ~5%.',
  },
  machupicchu: {
    features:
      '15th-century Inca citadel at 2,430 m altitude. UNESCO Heritage and a "New 7 Wonder of the World." Daily entry capped at 4,500 since 2024.',
    environment:
      'Cloud-forest cliff-top setting. Andean wet/dry seasons; landslide risk in the wet season. Endemic flora — over 400 orchid species recorded.',
    geography:
      'Cusco region, southern Peru. Reachable only by train and bus from Aguas Calientes — or via the four-day Inca Trail trek.',
    products:
      'Quechua textiles and alpaca-wool weavings, ceramics from Pisac, coca leaf and tea, native Andean potatoes, kiwicha grain.',
    economy:
      'Heritage tourism is ~95% of provincial revenue. Quechua subsistence farming on pre-Hispanic agricultural terraces continues to this day.',
  },
  cusco: {
    features:
      'Former Inca capital at 3,400 m altitude. Plaza de Armas, the Qorikancha Sun Temple, Sacsayhuamán fortress, San Pedro market. UNESCO World Heritage.',
    environment:
      'Andean highland climate; thin air challenges visitors on arrival. Dry winter (May–Sept), wet summer (Dec–March). Surrounded by sacred mountains (apus).',
    geography:
      'Southeast Peru in the Sacred Valley region. Direct flights from Lima (~1 h 20) and La Paz; gateway to Machu Picchu via 3-h train.',
    products:
      'Alpaca and vicuña-wool products, Chinchero weavings, silver jewellery, chicha de jora (fermented corn drink), quinoa, Andean potatoes.',
    economy:
      'Tourism is ~70% of regional GDP. Highland agriculture and alpaca farming continue; the Inca Trail employs thousands of porters in season.',
  },
  rio: {
    features:
      '"Cidade Maravilhosa." Christ the Redeemer (UNESCO), Sugarloaf Mountain, Copacabana and Ipanema beaches, Carnival, samba and bossa nova.',
    environment:
      'Atlantic rainforest meets sea; the Tijuca Forest is one of the world\'s largest urban forests. Tropical climate; flash floods and landslides during summer.',
    geography:
      'Southeast Brazil on the Atlantic coast. Galeão (GIG) handles intercontinental flights; Santos Dumont (SDU) for domestic and São Paulo shuttle.',
    products:
      'Açaí berry, cachaça, Havaianas, Brazilian gemstones (tourmaline, topaz), bossa nova and samba music exports, surf brands.',
    economy:
      'Tourism, oil and gas (Petrobras HQ), entertainment, fashion. Brazil\'s second-largest metro economy; hosted the 2014 World Cup and 2016 Olympics.',
  },
  cancun: {
    features:
      'Resort city on the Caribbean. The "Hotel Zone" lines turquoise water with luxury resorts; Mayan ruins (Tulum, Chichén Itzá) within day-trip distance.',
    environment:
      'Tropical Caribbean climate; hurricane season runs June–November. Mangrove ecosystems destroyed by hotel construction; sargassum-seaweed influxes since 2014.',
    geography:
      'Northeast Yucatán Peninsula, Mexico. International airport — Mexico\'s second-busiest. The Riviera Maya stretches south to Tulum.',
    products:
      'Mayan textiles, henequen sisal, vanilla, achiote, Yucatecan mezcal, chaya greens, regulated coral-reef jewellery.',
    economy:
      'Tourism dominates — about 60% of Quintana Roo\'s GDP. ~$10 B annual tourism revenue; main employer for Maya-speaking workers commuting from inland villages.',
  },
  cairo: {
    features:
      'Egypt\'s capital and Africa\'s largest urban area (22 M metro). Giza Pyramids, Egyptian Museum (and the new Grand Egyptian Museum), Khan el-Khalili bazaar, Islamic Cairo.',
    environment:
      'Saharan desert margin — hot dry summers, mild winters. The Nile is the city\'s lifeline; air pollution ranks among the world\'s worst.',
    geography:
      'North Egypt on the Nile. Strategic between Africa, the Middle East and the Mediterranean; the Suez Canal lies ~120 km east.',
    products:
      'Egyptian long-staple cotton, papyrus, alabaster crafts, Khan el-Khalili silver, coffee, dates and traditional perfumes.',
    economy:
      'Tourism is the second-largest employer; major Arab-world banking centre, textile manufacturing, Suez Canal revenues. Egypt\'s GDP capital.',
  },
  capetown: {
    features:
      '"Mother City" of South Africa. Table Mountain (1,086 m, UNESCO), Cape of Good Hope, Robben Island (Mandela\'s prison), V&A Waterfront, the painted Bo-Kaap.',
    environment:
      'Mediterranean climate at the southern tip of Africa. The Cape Floral Kingdom is the most biodiverse plant kingdom on Earth; the 2018 "Day Zero" water crisis came within 90 days.',
    geography:
      'Southwest South Africa, where Atlantic and Indian Oceans meet. A major Atlantic-Indian shipping-route stopover; international flights from Africa and Europe.',
    products:
      'Stellenbosch wines, rooibos and honeybush teas, ostrich products, diamonds, Karoo lamb, abalone (regulated).',
    economy:
      'Tourism (~10% of regional GDP), wine industry (8th largest globally), film production ("Cape Town Studios"), oil-rig services, fishing.',
  },
  sydney: {
    features:
      "Australia's largest city. Sydney Opera House (UNESCO), Harbour Bridge, Bondi Beach, the Royal Botanic Garden; one of the world's most multicultural culinary scenes.",
    environment:
      'Temperate maritime climate; Hawkesbury sandstone bluffs frame the harbour. Bushfire risk inland, coastal storms — set on what is widely called the world\'s most beautiful natural harbour.',
    geography:
      'Southeast Australia on the Tasman Sea. Kingsford Smith is Australasia\'s busiest airport, with direct flights to all continents.',
    products:
      'Merino wool, Hunter Valley wines, beef, opals, cane sugar, Aboriginal art exports, screen production from Fox Studios Australia.',
    economy:
      '~25% of Australia\'s GDP. Banking (all four "Big Four" headquartered here), tech, mining services, tourism, international-student education.',
  },
  galapagos: {
    features:
      'Darwin\'s living laboratory. 19 islands and 600+ endemic species — Galápagos giant tortoises, marine iguanas, blue-footed boobies. UNESCO Biosphere Reserve.',
    environment:
      'Volcanic archipelago straddling the equator; the cold Humboldt Current keeps fauna unique. About 95% of the land is protected national park.',
    geography:
      '~1,000 km west of mainland Ecuador in the Pacific. Reachable only via flights from Quito or Guayaquil; strict immigration and biosecurity controls on arrival.',
    products:
      'Sustainable fishing (lobster, sea cucumber), highland Arabica coffee from San Cristóbal, salt, organic vegetables. Tourism crafts are tightly limited by conservation rules.',
    economy:
      'Conservation-tourism (~$200 M/yr), small-scale fishing, agriculture limited to the four inhabited islands. Strict population caps limit human impact.',
  },
  auckland: {
    features:
      '"City of Sails" — more boats per capita than anywhere on Earth. Sky Tower (NZ\'s tallest), Waiheke Island wineries, 53 dormant volcanic cones across the urban area.',
    environment:
      'Subtropical maritime climate; built on a volcanic field. Two harbours flank the isthmus — Waitematā to the east, Manukau to the west.',
    geography:
      'North Island, NZ. International gateway — about 75% of all visitors to the country arrive here; direct flights from Asia, the Americas and the Pacific.',
    products:
      'Manuka honey (premium grade), kiwifruit, Marlborough sauvignon blanc (nearby region), greenstone (pounamu) jade, wool, dairy.',
    economy:
      '~38% of New Zealand\'s GDP. Finance, IT, screen production (Lord of the Rings, The Hobbit), shipping, tourism, dairy exports.',
  },
};

export function getCityDetails(cityId: string): CityDetails {
  return DATA[cityId] ?? FALLBACK;
}
