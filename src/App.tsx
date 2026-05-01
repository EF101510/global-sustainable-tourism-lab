import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ChevronLeft, ChevronRight, Send, MessageSquare, Sparkles, X, Globe2, AlertTriangle } from 'lucide-react';

// ============ Types ============
export interface CityIssue {
  tag: string;
  icon: string;
  detail: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  region: 'Europe' | 'Asia' | 'Americas' | 'Other';
  bg: string[];
  intro: string;
  issues: CityIssue[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BoardPost {
  id: string;
  nickname: string;
  content: string;
  time: number;
}

// ============ City Data ============
const CITIES: City[] = [
  // ============ Europe ============
  {
    id: 'venice',
    name: 'Venice',
    country: 'Italy',
    lat: 45.4408,
    lng: 12.3155,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/1280px-Venezia_aerial_view.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Rialto_vista_dietra-camerlenghi.JPG/1280px-Rialto_vista_dietra-camerlenghi.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Campanile_of_St._Mark%27s_Basilica_-_remote_view.jpg/1280px-Campanile_of_St._Mark%27s_Basilica_-_remote_view.jpg',
    ],
    intro: 'The fabled lagoon city hosts ~30 million visitors a year against a resident population that has fallen below 50,000.',
    issues: [
      { tag: 'Cruise Ship Erosion', icon: '🚢', detail: 'Wakes from large cruise ships erode the lagoon; the city is sinking ~2 mm per year. Ships over 25,000 tons were banned from St. Mark\'s Basin in 2021.' },
      { tag: 'Day-Tripper Tax', icon: '💶', detail: 'In 2024 Venice became the first city in the world to charge a €5 day-trip access fee on peak days, hoping to redistribute crowds.' },
      { tag: 'Resident Exodus', icon: '🏚️', detail: 'Population dropped from 175,000 in the 1950s to under 50,000. One in four buildings is now vacant or used as short-term rental.' },
      { tag: 'Vanishing Crafts', icon: '🎭', detail: 'Murano glass apprenticeships have fallen ~70%; most "souvenirs" sold in the city are imported mass-market goods.' },
    ],
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    lat: 41.3851,
    lng: 2.1734,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Aerial_view_of_Barcelona%2C_Spain_%2851227309370%29_edited.jpg/1280px-Aerial_view_of_Barcelona%2C_Spain_%2851227309370%29_edited.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Sagrada_Familia_6-12-25_%28cropped%29.jpg/500px-Sagrada_Familia_6-12-25_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Torre_Gl%C3%B2ries_nocturna.jpg/1280px-Torre_Gl%C3%B2ries_nocturna.jpg',
    ],
    intro: 'Annual visitors exceed the city population more than 20-fold. In 2024 the mayor announced a complete short-term-rental ban by 2028.',
    issues: [
      { tag: '2028 Airbnb Ban', icon: '🚫', detail: 'Mayor Jaume Collboni announced in mid-2024 that all 10,000+ short-term tourist licences will be phased out by November 2028.' },
      { tag: 'Water-Pistol Protests', icon: '💦', detail: 'In July 2024, residents marched along La Rambla spraying tourists with water pistols and chanting "Tourists go home."' },
      { tag: 'Bus #116 Removed', icon: '🚌', detail: 'A neighbourhood bus near Park Güell was hidden from Google Maps after locals could no longer board it during peak season.' },
      { tag: '68% Rent Hike', icon: '🏚️', detail: 'Rents in El Born and Gràcia rose 68% in 10 years, pushing long-time residents to the suburbs.' },
    ],
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.3676,
    lng: 4.9041,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/KeizersgrachtReguliersgrachtAmsterdam.jpg/1280px-KeizersgrachtReguliersgrachtAmsterdam.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Concertgebouw_from_Museumplein_2539.jpg/1280px-Concertgebouw_from_Museumplein_2539.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/South_facade_of_the_Rijksmuseum_Amsterdam_%28DSCF0528%29.jpg/500px-South_facade_of_the_Rijksmuseum_Amsterdam_%28DSCF0528%29.jpg',
    ],
    intro: 'The canal city is actively turning visitors away — its "Stay Away" campaign targets specific tourist demographics, a global first.',
    issues: [
      { tag: '"Stay Away" Campaign', icon: '🛑', detail: 'A 2023 ad campaign explicitly targeted British men aged 18-35 searching for "stag party Amsterdam," warning of fines and arrests.' },
      { tag: 'Cruise Terminal Closure', icon: '🚢', detail: 'The city council voted in 2023 to close the central cruise terminal by 2026 to push large ships out of the city core.' },
      { tag: 'Red Light Relocation', icon: '🌹', detail: 'Plans to move the De Wallen sex-work district to a purpose-built "erotic centre" outside the centre, easing tourist pressure on residents.' },
      { tag: 'Cycling Accidents +40%', icon: '🚲', detail: 'Tourists unfamiliar with bike etiquette drove cycling-related incidents up 40%, prompting separate tourist walking lanes.' },
    ],
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Greece',
    lat: 36.3932,
    lng: 25.4615,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Santorini_-_Grecia_-_Vista_Aerea_del_promontorio_di_Ancient_Thira_-_agosto_2018.jpg/1280px-Santorini_-_Grecia_-_Vista_Aerea_del_promontorio_di_Ancient_Thira_-_agosto_2018.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Skaros_Rock.jpg/1280px-Skaros_Rock.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Santorini_pyrgos_kastellkirche_160707.jpg/1280px-Santorini_pyrgos_kastellkirche_160707.jpg',
    ],
    intro: 'A volcanic island with 15,000 residents and 3.4 million annual visitors. Every drop of fresh water comes from desalination.',
    issues: [
      { tag: 'Zero Natural Water', icon: '💧', detail: 'Santorini has no freshwater springs; all drinking water is desalinated. Peak-season demand routinely exceeds plant capacity.' },
      { tag: 'Cruise Cap', icon: '🚢', detail: 'After single-day arrivals hit 17,000 in 2023, the government capped cruise passengers at 8,000 per day starting in 2025.' },
      { tag: 'Donkey Welfare Crisis', icon: '🐴', detail: 'Heavier tourists were banned from donkey rides up Fira\'s 588 steps after a wave of spinal injuries among the animals.' },
      { tag: 'Caldera Cliff Erosion', icon: '🌋', detail: 'Volcanic-rock cliff edges in Oia are crumbling under the weight of selfie-seeking crowds; barriers have been added at viewpoints.' },
    ],
  },
  {
    id: 'dubrovnik',
    name: 'Dubrovnik',
    country: 'Croatia',
    lat: 42.6507,
    lng: 18.0944,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/The_walls_of_the_fortress_and_View_of_the_old_city._panorama.jpg/1280px-The_walls_of_the_fortress_and_View_of_the_old_city._panorama.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Dubrovnik_%2828%29.JPG/1280px-Dubrovnik_%2828%29.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Rector%27s_palace_20180820.jpg/1280px-Rector%27s_palace_20180820.jpg',
    ],
    intro: 'Game-of-Thrones tourism nearly cost the Old Town its UNESCO status; daily entry is now capped at 4,000 visitors.',
    issues: [
      { tag: 'Game of Thrones Effect', icon: '🎬', detail: 'Cruise arrivals hit 10,000 per day at the peak of HBO\'s show; UNESCO formally warned the city it could be delisted.' },
      { tag: '4,000-Person Cap', icon: '🚪', detail: 'The Old Town now uses sensors at the city gates to enforce a simultaneous-entry cap of 4,000 visitors.' },
      { tag: 'Stradun Stone Wear', icon: '🏛️', detail: 'The 700-year-old polished marble of the Stradun is showing visible grooves from millions of footfalls per year.' },
      { tag: 'Old-Town Hollowing', icon: '🏚️', detail: 'Resident population inside the walls fell from 5,000 to under 1,500; nearly every ground-floor unit is now a souvenir shop.' },
    ],
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    country: 'Iceland',
    lat: 64.1466,
    lng: -21.9426,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg/1280px-Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/H%C3%B6f%C3%B0i_mvp.jpg/1280px-H%C3%B6f%C3%B0i_mvp.jpg',
      'https://upload.wikimedia.org/wikipedia/en/thumb/e/ec/Perlan_in_April_2013.jpg/1280px-Perlan_in_April_2013.jpg',
    ],
    intro: 'Visitor numbers grew 400% in a decade after the 2008 financial crash, putting fragile sub-arctic ecosystems under pressure.',
    issues: [
      { tag: 'Moss Footprint Damage', icon: '🌋', detail: 'A single off-trail footprint on Icelandic moss can take decades to recover. Geyser and lava fields now have boardwalk-only access.' },
      { tag: 'Golden Circle Gridlock', icon: '🚐', detail: 'Þingvellir car parks are full year-round; emergency vehicles struggle to reach trailheads during whiteout conditions.' },
      { tag: 'Airbnb Saturation', icon: '🏠', detail: '8% of all housing in greater Reykjavík is short-term rental; nurses and teachers commute from satellite towns 40 km away.' },
      { tag: 'Whale-Watch Stress', icon: '🐋', detail: 'Boat traffic in Faxaflói Bay is suspected of altering minke and humpback feeding routes; biologists are pushing for a vessel cap.' },
    ],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/1280px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Notre-Dame_de_Paris_2013-07-24.jpg/1280px-Notre-Dame_de_Paris_2013-07-24.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre%2C_Paris_18e_140223_2.jpg/1280px-Basilique_du_Sacr%C3%A9-C%C5%93ur_de_Montmartre%2C_Paris_18e_140223_2.jpg',
    ],
    intro: '~44 million annual visitors. Post-2024 Olympics, the city is reckoning with a tourism load it now struggles to absorb.',
    issues: [
      { tag: 'Olympics Hangover', icon: '🏟️', detail: 'Post-2024 Games footfall remained 20% above pre-pandemic norms; locals report hostility toward influencer flash-mobs in Montmartre.' },
      { tag: 'Seine Cleanup', icon: '🌊', detail: 'A €1.4 billion project barely brought the Seine to swimmable E. coli levels in time for the 2024 Olympic triathlon.' },
      { tag: 'Bakery Replacement', icon: '🥖', detail: 'About 30% of independent boulangeries in the Marais have been replaced by chain stores or souvenir outlets in 20 years.' },
      { tag: 'Eiffel Tower Bottleneck', icon: '🗼', detail: 'Pedestrian crowding around the Champ de Mars triggers periodic emergency closures of access roads.' },
    ],
  },
  {
    id: 'florence',
    name: 'Florence',
    country: 'Italy',
    lat: 43.7696,
    lng: 11.2558,
    region: 'Europe',
    bg: [
      'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/FirenzeDec092023_01.jpg/1280px-FirenzeDec092023_01.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Palazzo_Pitti_nel_tardo_pomeriggio.jpg/1280px-Palazzo_Pitti_nel_tardo_pomeriggio.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Bas%C3%ADlica_de_la_Santa_Cruz%2C_Florencia%2C_Italia%2C_2022-09-18%2C_DD_95.jpg/1280px-Bas%C3%ADlica_de_la_Santa_Cruz%2C_Florencia%2C_Italia%2C_2022-09-18%2C_DD_95.jpg',
    ],
    intro: 'The cradle of the Renaissance has Europe\'s densest tourist footprint per square kilometre of historic centre.',
    issues: [
      { tag: '4-Hour Uffizi Queue', icon: '⏰', detail: 'Average queue time at the Uffizi exceeds four hours in peak season — longer than most tour groups\' attention spans.' },
      { tag: 'Centre Depopulation', icon: '🏚️', detail: 'The historic core\'s residential population has more than halved since 1970; nearly all upper floors are now Airbnb.' },
      { tag: 'Vibration Damage', icon: '🏛️', detail: 'Tour bus vibration and concentrated footfall accelerate facade weathering on Renaissance palazzi along the Arno.' },
      { tag: 'No-Eating Steps', icon: '🍦', detail: 'A 2023 ordinance bans eating on the steps of the Duomo and Santa Croce — a response to gelato stains on 600-year-old stone.' },
    ],
  },

  // ============ Asia ============
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    lat: 35.0116,
    lng: 135.7681,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiyomizu.jpg/1280px-Kiyomizu.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Arashiyama_Bamboo_Grove_%2844050138950%29.jpg/1280px-Arashiyama_Bamboo_Grove_%2844050138950%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Kyoto%2C_Japan_%2849667780482%29.jpg/1280px-Kyoto%2C_Japan_%2849667780482%29.jpg',
    ],
    intro: 'In 2024 parts of the Gion geisha district were closed to tourists after repeated harassment of maiko apprentices.',
    issues: [
      { tag: 'Geisha Harassment Ban', icon: '📸', detail: 'In April 2024 Gion\'s private alleys were closed to tourists; visitors had been chasing, grabbing and even tearing the kimonos of maiko.' },
      { tag: 'City Bus Crisis', icon: '🚌', detail: 'Locals were routinely unable to board public buses behind tourist suitcases; 2024 launched separate tourist-only express buses.' },
      { tag: 'Bamboo Carving', icon: '🎋', detail: 'The Arashiyama bamboo grove has been vandalised with carved names and dates, damaging stalks faster than the forest can regenerate.' },
      { tag: 'Machiya Conversion', icon: '🏯', detail: 'Traditional wooden townhouses (machiya) are being demolished or converted into hotels at a rate of about 800 per year.' },
    ],
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    lat: -8.3405,
    lng: 115.0920,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Bali_panorama.jpg/500px-Bali_panorama.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Bali%27s_Gunung_Agung_seen_at_sunset_from_Gunung_Rinjani.jpg/1280px-Bali%27s_Gunung_Agung_seen_at_sunset_from_Gunung_Rinjani.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Wonderfull_Nusa_Penida.jpg/1280px-Wonderfull_Nusa_Penida.jpg',
    ],
    intro: 'Tourism consumes ~65% of Bali\'s freshwater. A new tourist tax launched in 2024 to fund cultural and environmental protection.',
    issues: [
      { tag: 'Rice Paddy Drought', icon: '💧', detail: '~65% of the island\'s water now serves hotels and pools; the centuries-old subak irrigation system supporting rice paddies is collapsing.' },
      { tag: 'Sacred Site Disrespect', icon: '🛕', detail: 'Repeated incidents of nude photography on Mount Agung and other sacred sites led to fast-tracked deportations starting in 2023.' },
      { tag: '2024 Tourist Tax', icon: '💰', detail: 'A 150,000 IDR (~$10) levy was introduced in February 2024, the first attempt to monetise tourism for cultural protection.' },
      { tag: 'Canggu Gridlock', icon: '🛵', detail: 'Single-lane village roads in Canggu, designed for ox carts, now host permanent traffic jams of scooters and SUV rentals.' },
    ],
  },
  {
    id: 'phuket',
    name: 'Phuket',
    country: 'Thailand',
    lat: 7.8804,
    lng: 98.3923,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Phuket_Aerial.jpg/1280px-Phuket_Aerial.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/%D0%94%D0%BE%D0%BC_%D1%81%D0%B5%D0%BC%D1%8C%D0%B8_%D0%A7%D0%B8%D0%BD%D0%BF%D1%80%D0%B0%D1%87%D0%B0.jpg/500px-%D0%94%D0%BE%D0%BC_%D1%81%D0%B5%D0%BC%D1%8C%D0%B8_%D0%A7%D0%B8%D0%BD%D0%BF%D1%80%D0%B0%D1%87%D0%B0.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Mural_of_King_Rama_9_-_Dibuk_Road%2C_Phuket.jpg/1280px-Mural_of_King_Rama_9_-_Dibuk_Road%2C_Phuket.jpg',
    ],
    intro: 'Coral cover near the Phi Phi Islands has fallen 80% in 30 years. Maya Bay was closed for four years to recover.',
    issues: [
      { tag: 'Coral Bleaching', icon: '🐠', detail: 'Sunscreen chemicals and boat anchors have driven coral cover near Phi Phi down 80% since 1990; bleaching events now hit annually.' },
      { tag: 'Maya Bay Closure', icon: '🏖️', detail: 'Maya Bay was closed to tourists 2018-2022 to allow ecosystem recovery — a global benchmark for site-level rehabilitation.' },
      { tag: '3× Capacity Boats', icon: '🚤', detail: 'Day-trip boats to Phi Phi routinely exceed reef carrying capacity by a factor of three, visible from satellite imagery.' },
      { tag: 'Foreign Land Grab', icon: '💼', detail: 'Coastal villages have been bought up by overseas investors; multi-generation fishing families are relocating inland.' },
    ],
  },
  {
    id: 'boracay',
    name: 'Boracay',
    country: 'Philippines',
    lat: 11.9674,
    lng: 121.9248,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Boracay_S2-2020.jpg/500px-Boracay_S2-2020.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Boracay_view_from_Mount_Luho_2012-10-27.jpg/1280px-Boracay_view_from_Mount_Luho_2012-10-27.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Boracay_Cleanup_EMB_DENR_R6.jpg/1280px-Boracay_Cleanup_EMB_DENR_R6.jpg',
    ],
    intro: 'Closed for six months in 2018 after the President called it a "cesspool"; the rehabilitation became a global case study.',
    issues: [
      { tag: 'Sewage "Cesspool"', icon: '🚽', detail: 'In 2018 President Duterte ordered a six-month full closure after raw sewage was being pumped directly into the sea.' },
      { tag: 'Post-Rehab Zoning', icon: '🌊', detail: 'Reopening rules: no alcohol on White Beach, mandatory permits for hotels, and a daily visitor cap of 19,200.' },
      { tag: 'Aeta Ati Displacement', icon: '👥', detail: 'The indigenous Aeta Ati community has been pushed into the mountainous interior as resort development consumed coastal villages.' },
      { tag: 'Party Culture Takeover', icon: '🎉', detail: 'A small fishing village identity has been overwritten by international club tourism; local language use is in rapid decline.' },
    ],
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    lat: 13.7563,
    lng: 100.5018,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Bangkok_Montage_2024_2.jpg/1280px-Bangkok_Montage_2024_2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chao_Phraya_River_view_from_the_State_Tower%2C_Bangkok_2017.jpg/1280px-Chao_Phraya_River_view_from_the_State_Tower%2C_Bangkok_2017.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/%E0%B8%9A%E0%B8%A3%E0%B8%A3%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A8%E0%B8%87%E0%B8%B2%E0%B8%99_%E0%B8%AD%E0%B8%B8%E0%B9%88%E0%B8%99%E0%B9%84%E0%B8%AD%E0%B8%A3%E0%B8%B1%E0%B8%81_%E0%B8%84%E0%B8%A5%E0%B8%B2%E0%B8%A2%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%AB%E0%B8%99%E0%B8%B2%E0%B8%A7_%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%97%E0%B8%B5%E0%B9%88_2_%2838%29.jpg/1280px-%E0%B8%9A%E0%B8%A3%E0%B8%A3%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A8%E0%B8%87%E0%B8%B2%E0%B8%99_%E0%B8%AD%E0%B8%B8%E0%B9%88%E0%B8%99%E0%B9%84%E0%B8%AD%E0%B8%A3%E0%B8%B1%E0%B8%81_%E0%B8%84%E0%B8%A5%E0%B8%B2%E0%B8%A2%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%AB%E0%B8%99%E0%B8%B2%E0%B8%A7_%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%97%E0%B8%B5%E0%B9%88_2_%2838%29.jpg',
    ],
    intro: 'The world\'s most-visited city for several years running. Air pollution and river-front gentrification are the central battles.',
    issues: [
      { tag: 'PM2.5 Crisis', icon: '💨', detail: 'Khao San Road and the Old City routinely exceed WHO PM2.5 limits; in early 2024 schools closed citywide due to haze.' },
      { tag: 'Grand Palace Overflow', icon: '🛕', detail: 'Queues exceed three hours; coordinated pickpocket and gem-scam networks specifically target queueing tourists.' },
      { tag: 'River Stilt-House Erasure', icon: '🏘️', detail: 'Wooden stilt-house communities along the Chao Phraya are being demolished to make way for luxury hotels and shopping malls.' },
      { tag: 'Tuk-Tuk Scams', icon: '🛺', detail: '"Closed temple" tuk-tuk detour scams targeting tourists damage Bangkok\'s reputation and the legitimate tuk-tuk economy.' },
    ],
  },
  {
    id: 'siemreap',
    name: 'Siem Reap',
    country: 'Cambodia',
    lat: 13.3633,
    lng: 103.8564,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Front_porch_of_Wat_Damnak.jpg/1280px-Front_porch_of_Wat_Damnak.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Siem_Reap_River%2C_Siem_Reap.jpg/1280px-Siem_Reap_River%2C_Siem_Reap.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Siem_Reap_Pub_Street_02.jpg/1280px-Siem_Reap_Pub_Street_02.jpg',
    ],
    intro: 'Hotel groundwater extraction is destabilising the foundations of the 12th-century Angkor temple complex.',
    issues: [
      { tag: 'Angkor Foundation Sinking', icon: '🏛️', detail: 'Hotels pumping groundwater for swimming pools and laundry have lowered the water table; archaeologists fear foundation subsidence.' },
      { tag: 'Sunrise Crush', icon: '🌅', detail: 'Up to 5,000 tourists gather at Angkor Wat for sunrise simultaneously; vendors and selfie sticks degrade the experience for everyone.' },
      { tag: 'Monastic Disturbance', icon: '🙏', detail: 'Monks\' early-morning rituals are routinely interrupted by camera flashes; some monasteries now restrict tourist hours.' },
      { tag: 'Farmer Land Seizure', icon: '🌾', detail: 'Rural land is being expropriated for hotel and resort development; compensation disputes are ongoing in regional courts.' },
    ],
  },
  {
    id: 'seoul',
    name: 'Seoul',
    country: 'South Korea',
    lat: 37.5665,
    lng: 126.9780,
    region: 'Asia',
    bg: [
      'https://images.unsplash.com/photo-1538669715315-155098f0fb1d?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Seoul_%28175734251%29_%28cropped%29.jpg/1280px-Seoul_%28175734251%29_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/500px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Lotte_World_day_view_2.jpg/1280px-Lotte_World_day_view_2.jpg',
    ],
    intro: 'K-pop and K-drama tourism transformed traditional neighbourhoods. In 2024 Bukchon Hanok Village imposed quiet hours after years of resident protest.',
    issues: [
      { tag: 'Bukchon Quiet Ordinance', icon: '🤫', detail: 'After eight years of resident campaigning, a 5pm-10am quiet zone now applies to Bukchon Hanok Village; fines start at 100,000 KRW.' },
      { tag: 'Insadong Commercialisation', icon: '🛍️', detail: 'Traditional craft and calligraphy shops have been replaced by mass-market K-pop merchandise stores and cosmetic chains.' },
      { tag: 'Hongdae Subway Overload', icon: '🚇', detail: 'Subway exits at Hongdae are temporarily closed during peak K-pop pilgrimage hours for crowd-flow safety.' },
      { tag: 'Hanbok Photo Industry', icon: '🏯', detail: 'Gyeongbokgung visits are now ~80% rental-costume photo tourism; original civic and ceremonial uses have receded.' },
    ],
  },

  // ============ Americas ============
  {
    id: 'newyork',
    name: 'New York',
    country: 'USA',
    lat: 40.7128,
    lng: -74.0060,
    region: 'Americas',
    bg: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/1280px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Statue-of-Liberty-New-York-2014.jpg/1280px-Statue-of-Liberty-New-York-2014.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/New_york_times_square-terabass_%28cropped%29.jpg/1280px-New_york_times_square-terabass_%28cropped%29.jpg',
    ],
    intro: 'Times Square attracts 360,000 daily visitors. In 2023 the city effectively banned Airbnb-style short-term rentals citywide.',
    issues: [
      { tag: 'Local Law 18', icon: '🏠', detail: 'Effective Sept 2023, Local Law 18 effectively banned short-term rentals under 30 days; Airbnb listings dropped ~80% overnight.' },
      { tag: 'Congestion Pricing', icon: '🚗', detail: 'In 2025 New York became the first US city to charge a $9 toll on cars entering Manhattan below 60th Street.' },
      { tag: 'Times Square Trash', icon: '🎄', detail: 'Times Square produces ~50 tons of waste per day during peak season; permanent dedicated cleanup crews now operate 24/7.' },
      { tag: 'Chinatown Erosion', icon: '🥢', detail: 'Family-owned dim sum spots are closing as rents rise and the Cantonese-speaking community ages without successor businesses.' },
    ],
  },
  {
    id: 'machupicchu',
    name: 'Machu Picchu',
    country: 'Peru',
    lat: -13.1631,
    lng: -72.5450,
    region: 'Americas',
    bg: [
      'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Machu_Picchu%2C_2023_%28012%29.jpg/1280px-Machu_Picchu%2C_2023_%28012%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Machu_Picchu%2C_Per%C3%BA%2C_2015-07-30%2C_DD_47.JPG/1280px-Machu_Picchu%2C_Per%C3%BA%2C_2015-07-30%2C_DD_47.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Andenes_at_Machu_Picchu_%28cropped%29.jpg/1280px-Andenes_at_Machu_Picchu_%28cropped%29.jpg',
    ],
    intro: 'In 2024 the daily visitor cap was tightened from 5,600 to 4,500 after archaeologists warned of irreversible step erosion.',
    issues: [
      { tag: 'Stone Step Cracks', icon: '🪜', detail: 'Inca-era steps show visible cracking and rounding under millions of footfalls; some sections have been re-routed onto wooden boardwalks.' },
      { tag: 'Aguas Calientes Saturation', icon: '🚂', detail: 'The train town below the citadel is fully tourism-dependent; basic groceries cost 3× Cusco prices in high season.' },
      { tag: '4,500/Day Cap', icon: '🎫', detail: 'In 2024 the daily entry cap was reduced from 5,600 to 4,500 across four time-banded circuits, after archaeologist pressure.' },
      { tag: 'Quechua Exclusion', icon: '👥', detail: 'Indigenous Quechua communities surrounding the site receive less than 10% of tourism revenue, despite providing most service labour.' },
    ],
  },
  {
    id: 'cusco',
    name: 'Cusco',
    country: 'Peru',
    lat: -13.5320,
    lng: -71.9675,
    region: 'Americas',
    bg: [
      'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Iglesia_de_la_Compa%C3%B1%C3%ADa_de_Jes%C3%BAs%2C_Plaza_de_Armas%2C_Cusco%2C_Per%C3%BA%2C_2015-07-31%2C_DD_74.JPG/1280px-Iglesia_de_la_Compa%C3%B1%C3%ADa_de_Jes%C3%BAs%2C_Plaza_de_Armas%2C_Cusco%2C_Per%C3%BA%2C_2015-07-31%2C_DD_74.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Vista_Calle_Suecia.jpg/1280px-Vista_Calle_Suecia.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/UNESCOCuscomarker_and_Coricancha_%28cropped%29.jpg/330px-UNESCOCuscomarker_and_Coricancha_%28cropped%29.jpg',
    ],
    intro: 'The former Inca capital sits at 3,400 m. Rapid arrivals from sea level routinely cause altitude-sickness incidents requiring oxygen.',
    issues: [
      { tag: 'Altitude Health Crisis', icon: '⛰️', detail: 'Tourists flying directly from Lima to Cusco frequently experience acute mountain sickness; emergency oxygen is now a hotel-room standard.' },
      { tag: 'Religious Commercialisation', icon: '🛐', detail: 'Holy Week (Semana Santa) processions are increasingly stage-managed for tour cameras; original Quechua-Catholic syncretic meaning is fading.' },
      { tag: 'Plaza de Armas Conversion', icon: '🏨', detail: 'Nearly every colonial-era building around the Plaza de Armas has been converted to hotels, restaurants or souvenir shops.' },
      { tag: 'Sacred Valley Bus Choke', icon: '🚌', detail: 'A single highway connects Cusco to the Sacred Valley; day-tour buses create gridlock that delays emergency vehicles.' },
    ],
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    lat: -22.9068,
    lng: -43.1729,
    region: 'Americas',
    bg: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Cidade_Maravilhosa.jpg/1280px-Cidade_Maravilhosa.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/P%C3%A3o_de_A%C3%A7ucar_Rio_de_Janeiro_Brazil_-_panoramio_-_Hiroki_Ogawa_%28cropped%29.jpg/1280px-P%C3%A3o_de_A%C3%A7ucar_Rio_de_Janeiro_Brazil_-_panoramio_-_Hiroki_Ogawa_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/At_Rio_de_Janeiro_2019_200_%28cropped%29.jpg/1280px-At_Rio_de_Janeiro_2019_200_%28cropped%29.jpg',
    ],
    intro: 'Carnival capital of the Americas — but "favela tours" raise sharp ethical debates about tourism that frames poverty as spectacle.',
    issues: [
      { tag: 'Favela Tour Ethics', icon: '🏘️', detail: 'Bus tours through Rocinha and other favelas photograph residents without consent; a growing local movement calls it "poverty tourism."' },
      { tag: 'Copacabana Bacteria', icon: '🌊', detail: 'E. coli levels at Copacabana and Ipanema regularly exceed safe-bathing thresholds during summer storms.' },
      { tag: 'Sugarloaf 3-Hour Wait', icon: '🚠', detail: 'Cable-car queues to Sugarloaf Mountain regularly exceed three hours, longer than the cable car operates safely.' },
      { tag: 'Ipanema Pricing-Out', icon: '🏖️', detail: 'Middle-class residents are being displaced from Ipanema and Leblon as luxury short-term rentals pull units off the long-term market.' },
    ],
  },
  {
    id: 'cancun',
    name: 'Cancún',
    country: 'Mexico',
    lat: 21.1619,
    lng: -86.8515,
    region: 'Americas',
    bg: [
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Cancun_Strand_Luftbild_%2822143397586%29.jpg/1280px-Cancun_Strand_Luftbild_%2822143397586%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Boulevard_Kukulcan%2C_Zona_Hotelera%2C_Canc%C3%BAn%2C_Mexico_-_panoramio_%2834%29.jpg/1280px-Boulevard_Kukulcan%2C_Zona_Hotelera%2C_Canc%C3%BAn%2C_Mexico_-_panoramio_%2834%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Museo_Maya_de_Cancun.jpg/500px-Museo_Maya_de_Cancun.jpg',
    ],
    intro: 'Resort construction has destroyed ~60% of the Riviera Maya\'s mangrove ecosystem, the original protection against hurricanes.',
    issues: [
      { tag: '60% Mangrove Loss', icon: '🌴', detail: 'Hotel-zone construction has cleared an estimated 60% of original mangrove cover, eliminating a key buffer against hurricanes.' },
      { tag: 'Sea-Turtle Nesting Loss', icon: '🐢', detail: 'Hotel-zone night-time lighting disorients hatchlings; turtle volunteers patrol nightly to redirect them away from pools and roads.' },
      { tag: 'Worker Exile', icon: '👷', detail: 'Hotel and restaurant staff commute from informal settlements 30+ km away; few can afford to live within the resort zone.' },
      { tag: 'Maya Theme-Parking', icon: '🎭', detail: 'Maya culture is largely reduced to 30-minute "ceremonial" performances at all-inclusive resorts, divorced from living communities.' },
    ],
  },

  // ============ Other ============
  {
    id: 'cairo',
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.0444,
    lng: 31.2357,
    region: 'Other',
    bg: [
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/1280px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Cairo_%22Egyptian_Museum%22_-_panoramio.jpg/500px-Cairo_%22Egyptian_Museum%22_-_panoramio.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/The_Cairo_Tower.jpg/1280px-The_Cairo_Tower.jpg',
    ],
    intro: 'The Grand Egyptian Museum opened in 2024, dramatically shifting visitor flows toward an already overloaded Giza Plateau.',
    issues: [
      { tag: 'Limestone Weathering', icon: '🏜️', detail: 'Air pollution and crowd-generated humidity are weathering Giza pyramid limestone at roughly ten times the natural rate.' },
      { tag: 'GEM Opening Surge', icon: '🏛️', detail: 'The Grand Egyptian Museum opening has redirected millions of visitors to Giza, straining roads, parking and water infrastructure.' },
      { tag: 'Camel Driver Aggression', icon: '🐪', detail: 'Aggressive touts and forced-sale tactics around the pyramids are widely cited as a top complaint, deterring repeat visits.' },
      { tag: 'Nazlet Displacement', icon: '🏘️', detail: 'Families in Nazlet El-Semman village have been relocated multiple times to expand the tourist pedestrian zone.' },
    ],
  },
  {
    id: 'capetown',
    name: 'Cape Town',
    country: 'South Africa',
    lat: -33.9249,
    lng: 18.4241,
    region: 'Other',
    bg: [
      'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Cape_Town_%28ZA%29%2C_Table_Mountain%2C_Blick_auf_City_Bowl_--_2024_--_2855.jpg/1280px-Cape_Town_%28ZA%29%2C_Table_Mountain%2C_Blick_auf_City_Bowl_--_2024_--_2855.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Camps_bay_%2853460319478%29_%28cropped%29.jpg/1280px-Camps_bay_%2853460319478%29_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Signal_Hill_and_Ferris_wheel_from_Victoria_Wharf_balcony%2C_Cape_Town.jpg/1280px-Signal_Hill_and_Ferris_wheel_from_Victoria_Wharf_balcony%2C_Cape_Town.jpg',
    ],
    intro: 'In 2018 Cape Town came within 90 days of being the first major city in the world to run out of tap water.',
    issues: [
      { tag: 'Day Zero Threat', icon: '💧', detail: 'In 2018 reservoir levels fell to 13.5%; "Day Zero" — the date municipal taps would shut off — was 90 days away before rains came.' },
      { tag: 'Table Mountain Queue', icon: '🏔️', detail: 'Cable-car wait times to Table Mountain exceed four hours in peak season, effectively excluding elderly and disabled visitors.' },
      { tag: 'Bo-Kaap Privacy War', icon: '🎨', detail: 'Residents of the colourful Bo-Kaap neighbourhood now charge tourists for photographs of their painted homes.' },
      { tag: 'V&A Gentrification', icon: '🏘️', detail: 'Historic Coloured neighbourhoods near the V&A Waterfront have been progressively displaced by waterfront luxury development.' },
    ],
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    region: 'Other',
    bg: [
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/1280px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Sydney_%28AU%29%2C_Queen_Victoria_Building_--_2019_--_3580_%28cropped%29_-_2.jpg/1280px-Sydney_%28AU%29%2C_Queen_Victoria_Building_--_2019_--_3580_%28cropped%29_-_2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/University_of_Sydney%27s_Main_Quadrangle.jpg/1280px-University_of_Sydney%27s_Main_Quadrangle.jpg',
    ],
    intro: 'Iconic harbour, second-highest house prices in the world. Bondi Beach is the global flashpoint for "Instagram tourism."',
    issues: [
      { tag: 'Bondi Instagram Effect', icon: '📱', detail: 'Bondi Beach is a global influencer location; the local surf-culture community largely no longer uses it on weekends.' },
      { tag: 'Cruise-Ship Choke', icon: '🚢', detail: 'On cruise-arrival days Circular Quay and the Opera House forecourt are saturated within minutes of disembarkation.' },
      { tag: '2nd-Highest House Prices', icon: '🏠', detail: 'Sydney has the second-highest house price-to-income ratio globally; under-30 residents are leaving the CBD permanently.' },
      { tag: 'Wildlife Selfie Stress', icon: '🦘', detail: 'Manly koalas and Bondi-area sea lions show measurable cortisol elevation from tourist approach behaviour.' },
    ],
  },
  {
    id: 'galapagos',
    name: 'Galápagos',
    country: 'Ecuador',
    lat: -0.9538,
    lng: -90.9656,
    region: 'Other',
    bg: [
      'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Lobo_marino_%28Zalophus_californianus_wollebaeki%29%2C_Punta_Pitt%2C_isla_de_San_Crist%C3%B3bal%2C_islas_Gal%C3%A1pagos%2C_Ecuador%2C_2015-07-24%2C_DD_11.JPG/1280px-Lobo_marino_%28Zalophus_californianus_wollebaeki%29%2C_Punta_Pitt%2C_isla_de_San_Crist%C3%B3bal%2C_islas_Gal%C3%A1pagos%2C_Ecuador%2C_2015-07-24%2C_DD_11.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Alvaro_Sevilla_Design_Isla_Santa_Cruz_Galapagos_foto_tomada_desde_el_avi%C3%B3n.jpg/1280px-Alvaro_Sevilla_Design_Isla_Santa_Cruz_Galapagos_foto_tomada_desde_el_avi%C3%B3n.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Floreana1.jpg/1280px-Floreana1.jpg',
    ],
    intro: 'Darwin\'s living laboratory. More than 60 endemic species are threatened by tourist-introduced invasive species.',
    issues: [
      { tag: 'Invasive Species', icon: '🐢', detail: 'Tourist boats and cargo flights have introduced rats, ants and plants threatening 60+ endemic species, including giant tortoises.' },
      { tag: 'Population Pressure', icon: '🏠', detail: 'Resident immigration is capped, but mainland labour migration to staff hotels creates a chronic informal-housing crisis.' },
      { tag: 'Annual Visitor Cap', icon: '✈️', detail: 'Ecuador set a 200,000 annual cap in 2024; cruise day-trippers (not counted toward the cap) routinely push the real number higher.' },
      { tag: 'Fishing-to-Tour Pivot', icon: '🐟', detail: 'Local fishing economies have been almost entirely replaced by guided-tour work, eroding subsistence food sovereignty.' },
    ],
  },
  {
    id: 'auckland',
    name: 'Auckland',
    country: 'New Zealand',
    lat: -36.8485,
    lng: 174.7633,
    region: 'Other',
    bg: [
      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1600&q=80&auto=format&fit=crop',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Auckland_skyline_-_May_2024_%282%29.jpg/1280px-Auckland_skyline_-_May_2024_%282%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/00_0399_Auckland_City_Hall%2C_New_Zealand.jpg/1280px-00_0399_Auckland_City_Hall%2C_New_Zealand.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cathedral_of_Saint_Patrick_and_Saint_Joseph_%28cropped%29.jpg/1280px-Cathedral_of_Saint_Patrick_and_Saint_Joseph_%28cropped%29.jpg',
    ],
    intro: 'Gateway to Aotearoa. Cruise-ship congestion and the commodification of Māori culture are central debates.',
    issues: [
      { tag: 'Haka Commercialisation', icon: '🌿', detail: 'Sacred Māori haka ceremonies are being reduced to airport welcome shows; iwi (tribal) groups are pushing for cultural-IP protections.' },
      { tag: 'Hauraki Gulf Wildlife Stress', icon: '🌊', detail: 'Whale and dolphin tour boats in the Hauraki Gulf routinely exceed cetacean welfare guidelines on approach distance and engine noise.' },
      { tag: 'Cruise-Day Gridlock', icon: '🚢', detail: 'Up to four cruise ships dock simultaneously, effectively doubling the Auckland CBD\'s daytime population.' },
      { tag: 'Short-Term Rental Saturation', icon: '🏠', detail: 'About 25% of central Auckland\'s housing has been converted to short-term rental, deepening the regional housing crisis.' },
    ],
  },
];

// ============ Lat/Lng to 3D position ============
function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ============ Globe Component ============
function Globe({ onCitySelect }: { onCitySelect: (city: City) => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCity, setHoveredCity] = useState<City | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomingIn, setZoomingIn] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Globe — Lab-style holographic earth (white bg + cyan tech feel)
    const globeRadius = 2.5;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

    const createTechEarth = () => {
      const canvas = document.createElement('canvas');
      const W = 2048, H = 1024;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Ocean - tech blue gradient (medium saturation so it shows against white bg)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#5d8ab1');
      grad.addColorStop(0.5, '#7fa9cc');
      grad.addColorStop(1, '#5d8ab1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const xy = (lng: number, lat: number): [number, number] => [
        ((lng + 180) / 360) * W,
        ((90 - lat) / 180) * H,
      ];

      const land = '#1e3a5f';
      const landStroke = '#9cd1ec';

      const drawShape = (pts: [number, number][]) => {
        ctx.beginPath();
        pts.forEach(([lng, lat], i) => {
          const [x, y] = xy(lng, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = land;
        ctx.fill();
        ctx.strokeStyle = landStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      // North America
      drawShape([
        [-167,65],[-160,55],[-153,57],[-148,60],[-143,60],[-138,59],
        [-133,55],[-128,52],[-125,49],[-124,46],[-124,42],[-122,38],
        [-120,34],[-117,33],[-115,29],[-112,25],[-109,23],[-106,21],
        [-100,18],[-96,16],[-93,15],[-91,16],[-88,16],[-87,13],[-85,11],
        [-83,9],[-79,9],[-77,8],[-77,12],[-78,18],[-86,21],[-90,21],
        [-94,19],[-97,22],[-97,26],[-95,29],[-90,30],[-87,30],[-83,29],
        [-82,27],[-80,25],[-80,29],[-81,32],[-77,35],[-76,38],[-74,40],
        [-72,41],[-70,42],[-67,44],[-66,45],[-63,46],[-59,47],[-55,46],
        [-53,48],[-55,52],[-58,54],[-63,57],[-65,60],[-78,60],[-78,68],
        [-72,73],[-80,75],[-95,77],[-115,75],[-125,71],[-135,69],
        [-145,70],[-155,71],[-165,68]
      ]);

      // Greenland
      drawShape([
        [-52,60],[-44,60],[-38,62],[-22,68],[-15,75],[-22,82],[-32,83],
        [-45,83],[-55,80],[-58,73],[-55,65],[-52,62]
      ]);

      // Iceland
      drawShape([[-24,64],[-22,66],[-14,66],[-13,65],[-15,63],[-20,63]]);

      // Cuba
      drawShape([[-84,22],[-77,22],[-74,21],[-77,20],[-83,21]]);

      // Hispaniola
      drawShape([[-74,19],[-68,19],[-68,17],[-72,17.5]]);

      // South America
      drawShape([
        [-78,12],[-72,11],[-65,10],[-60,9],[-55,5],[-52,4],[-48,1],
        [-44,-1],[-38,-5],[-35,-8],[-35,-13],[-37,-18],[-40,-22],
        [-43,-23],[-45,-25],[-48,-28],[-53,-32],[-58,-35],[-62,-38],
        [-65,-42],[-68,-45],[-71,-48],[-73,-52],[-74,-55],[-72,-54],
        [-72,-50],[-72,-44],[-74,-40],[-75,-35],[-76,-30],[-72,-25],
        [-71,-20],[-72,-15],[-77,-10],[-80,-5],[-80,-2],[-78,2],[-78,5]
      ]);

      // Eurasia (Europe + Asia, with Italy peninsula traced)
      drawShape([
        // Iberia + W Europe
        [-9,37],[-9,43],[-1,47],[-2,49],[2,51],[4,53],[8,54],[11,55],
        // Scandinavia
        [11,58],[10,62],[13,68],[18,70],[29,71],
        // North Russia
        [33,69],[40,67],[55,68],[70,72],[85,74],[100,76],[115,76],
        [130,73],[150,72],[170,70],[178,71],
        // East Russia
        [178,66],[170,62],[165,58],[155,53],[142,47],
        // Korea
        [129,40],[126,35],
        // E China
        [122,37],[121,32],[118,25],[110,21],
        // Vietnam
        [108,16],[105,9],
        // Malay peninsula tip
        [104,1],
        // Up Andaman side
        [99,7],[98,13],[95,17],
        // Bay of Bengal
        [92,22],[88,22],[85,19],[80,13],[78,8],
        // West India
        [73,8],[73,17],[68,23],
        // Iran/Pakistan
        [60,25],[55,25],
        // Around Oman
        [58,22],[55,18],
        // Yemen
        [50,12],[44,12],
        // Saudi Red Sea
        [42,16],[38,22],[35,28],
        // Sinai north
        [33,30],[34,31],
        // Levant
        [35,35],[36,36],
        // Turkey south
        [33,36],[30,37],[27,37],
        // Greece
        [22,38],[20,40],
        // Adriatic
        [16,42],[13,45],
        // Italy peninsula
        [12,45],[13,43],[16,41],[18,40],[17,38],[15,38],[12,41],[10,44],
        // S France / Spain Med
        [7,43],[3,42],[-1,39],[-2,36],
        // Strait of Gibraltar
        [-5,36]
      ]);

      // Africa
      drawShape([
        [-17,15],[-17,21],[-12,28],[-7,33],[-3,35],[3,36],[10,33],
        [11,33],[15,32],[20,31],[25,32],[30,31],[33,31],[34,30],[35,28],
        [37,22],[39,15],[42,12],[45,11],[48,11],[51,11],
        [52,11],[51,8],[50,5],[44,1],[42,-1],[40,-5],
        [40,-10],[40,-15],[37,-18],[35,-22],[35,-25],[33,-28],[32,-29],
        [28,-33],[25,-34],[22,-34],[18,-34],[16,-29],
        [13,-23],[13,-18],[12,-15],[12,-10],[10,-5],[8,0],
        [9,4],[6,5],[3,5],[0,5],[-5,4],[-8,4],[-13,8],[-15,12]
      ]);

      // Madagascar
      drawShape([[43,-12],[48,-12],[50,-15],[50,-22],[47,-25],[44,-22],[43,-17]]);

      // Australia
      drawShape([
        [113,-22],[114,-26],[115,-32],[118,-35],[125,-32],[128,-32],
        [132,-32],[138,-35],[140,-38],[145,-39],[148,-37],[150,-35],
        [153,-30],[153,-25],[146,-19],[143,-13],[140,-12],[135,-12],
        [130,-13],[125,-15],[122,-17],[120,-18],[115,-20]
      ]);

      // Tasmania
      drawShape([[144,-41],[148,-40],[148,-43],[144,-43]]);

      // New Zealand (two islands)
      drawShape([[172,-34],[177,-37],[178,-39],[174,-41],[170,-40]]);
      drawShape([[166,-46],[171,-44],[174,-46],[170,-47],[167,-47]]);

      // Sumatra
      drawShape([[95,5],[101,3],[105,-2],[103,-5],[100,0],[97,2]]);
      // Borneo
      drawShape([[109,2],[114,6],[119,3],[118,-3],[114,-3],[110,-2]]);
      // Sulawesi
      drawShape([[120,2],[124,1],[125,-2],[123,-5],[121,-2]]);
      // Java
      drawShape([[105,-7],[114,-7],[114,-9],[106,-9]]);
      // New Guinea
      drawShape([[131,-1],[140,-3],[150,-7],[148,-10],[140,-9],[132,-5]]);
      // Philippines (rough)
      drawShape([[120,18],[124,18],[126,12],[125,7],[120,9],[118,12]]);

      // Japan: Hokkaido / Honshu / Kyushu
      drawShape([[140,42],[145,44],[145,42],[141,41]]);
      drawShape([[131,34],[136,34],[140,36],[141,38],[140,40],[135,36],[131,33]]);
      drawShape([[129,32],[131,33],[131,30],[130,30]]);

      // Great Britain
      drawShape([[-5,50],[-2,51],[1,51],[1,53],[0,55],[-3,58],[-5,58],[-6,56],[-5,52]]);
      // Ireland
      drawShape([[-10,52],[-6,52],[-6,55],[-9,55]]);

      // Sri Lanka
      drawShape([[80,9],[82,9],[82,6],[80,6]]);

      // Antarctica - white ice with natural noisy edge
      ctx.fillStyle = '#f0f6fc';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 15) {
        const noise = Math.sin(x * 0.012) * 35 + Math.sin(x * 0.04) * 18 + Math.sin(x * 0.08) * 8;
        ctx.lineTo(x, H - 90 + noise);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c5d5e5';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Subtle digital noise for tech feel
      for (let i = 0; i < 25000; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        ctx.fillRect(x, y, 2, 2);
      }

      return new THREE.CanvasTexture(canvas);
    };

    const techTexture = createTechEarth();
    const globeMaterial = new THREE.MeshBasicMaterial({
      map: techTexture,
      transparent: true,
      opacity: 0.85,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Try to upgrade with real coastline data (world-atlas TopoJSON)
    (async () => {
      const urls = [
        'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
        'https://unpkg.com/world-atlas@2/land-110m.json',
        'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const topo = await res.json();
          const obj = topo.objects.land;
          const arcs = topo.arcs;
          const { scale, translate } = topo.transform;

          const decodeArc = (a: [number, number][]): [number, number][] => {
            const pts: [number, number][] = [];
            let x = 0, y = 0;
            for (const d of a) {
              x += d[0]; y += d[1];
              pts.push([x * scale[0] + translate[0], y * scale[1] + translate[1]]);
            }
            return pts;
          };
          const expand = (idxs: number[]): [number, number][] => {
            const out: [number, number][] = [];
            for (const i of idxs) {
              const rev = i < 0;
              let a = decodeArc(arcs[rev ? ~i : i]);
              if (rev) a = a.slice().reverse();
              if (out.length) a = a.slice(1);
              out.push(...a);
            }
            return out;
          };

          const W = 2048, H = 1024;
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          const ctx = c.getContext('2d')!;

          // Ocean
          const g = ctx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, '#5d8ab1');
          g.addColorStop(0.5, '#7fa9cc');
          g.addColorStop(1, '#5d8ab1');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);

          ctx.fillStyle = '#1e3a5f';
          ctx.strokeStyle = '#9cd1ec';
          ctx.lineWidth = 2;

          const drawPoly = (rings: [number, number][][]) => {
            if (!rings || !rings[0] || rings[0].length < 3) return;
            ctx.beginPath();
            rings[0].forEach(([lng, lat]: [number, number], i: number) => {
              const x = ((lng + 180) / 360) * W;
              const y = ((90 - lat) / 180) * H;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fillStyle = '#1e3a5f';
            ctx.fill();
            ctx.strokeStyle = '#9cd1ec';
            ctx.lineWidth = 2;
            ctx.stroke();
          };

          let drawn = 0;
          const drawGeom = (geom: any) => {
            if (!geom) return;
            if (geom.type === 'MultiPolygon') {
              for (const poly of geom.arcs) {
                drawPoly(poly.map(expand));
                drawn++;
              }
            } else if (geom.type === 'Polygon') {
              drawPoly(geom.arcs.map(expand));
              drawn++;
            } else if (geom.type === 'GeometryCollection' && geom.geometries) {
              for (const g of geom.geometries) drawGeom(g);
            }
          };
          console.log('TopoJSON obj type:', obj?.type, '| has geometries:', !!obj?.geometries, '| has arcs:', !!obj?.arcs);
          drawGeom(obj);
          console.log(`Drew ${drawn} land polygons from ${url}`);

          // Subtle digital noise
          for (let i = 0; i < 18000; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
            ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
          }

          const newTex = new THREE.CanvasTexture(c);
          globeMaterial.map = newTex;
          globeMaterial.needsUpdate = true;
          console.log('Coastline upgraded from', url);
          return;
        } catch (e) {
          console.warn('Coastline source failed:', url, (e as Error)?.message);
        }
      }
      console.log('Using procedural fallback continents');
    })();

    // Clean lat/lng grid — horizontal parallels + vertical meridians (no diagonals)
    const gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.35,
    });
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.6,
    });

    // Latitude rings (parallels) every 15°
    for (let latDeg = -75; latDeg <= 75; latDeg += 15) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const lng = -180 + (i / 96) * 360;
        pts.push(latLngToVec3(latDeg, lng, globeRadius * 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, latDeg === 0 ? equatorMat : gridMat));
    }

    // Meridians (longitude lines) every 15°
    for (let lngDeg = -180; lngDeg < 180; lngDeg += 15) {
      const pts = [];
      for (let i = 0; i <= 96; i++) {
        const lat = -90 + (i / 96) * 180;
        pts.push(latLngToVec3(lat, lngDeg, globeRadius * 1.003));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridGroup.add(new THREE.Line(geo, lngDeg === 0 ? equatorMat : gridMat));
    }

    scene.add(gridGroup);

    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(globeRadius * 1.08, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Lights — bright ambient so continents are clearly visible, with directional for 3D feel
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(5, 3, 5);
    scene.add(directional);

    // City markers
    const cityGroup = new THREE.Group();
    const cityMeshes: THREE.Mesh[] = [];
    CITIES.forEach((city) => {
      const pos = latLngToVec3(city.lat, city.lng, globeRadius * 1.01);

      const dotGeo = new THREE.SphereGeometry(0.022, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { city, baseScale: 1, ring: null };

      // Pulse ring — subtler, smoother
      const ringGeo = new THREE.RingGeometry(0.035, 0.05, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { city, isPulse: true, phase: Math.random() * Math.PI * 2 };
      dot.userData.ring = ring;

      cityGroup.add(dot);
      cityGroup.add(ring);
      cityMeshes.push(dot);
    });
    scene.add(cityGroup);

    // Drag rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    const targetRotation = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    let currentHoveredCity: City | null = null;
    let zoomAnimating = false;

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      setMousePos({ x: e.clientX, y: e.clientY });
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        rotVelY = dx * 0.005;
        rotVelX = dy * 0.005;
        targetRotation.y += rotVelY;
        targetRotation.x += rotVelX;
        targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotation.x));
        prevX = e.clientX;
        prevY = e.clientY;
      }

      // Hover detection
      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(cityMeshes);
      if (intersects.length > 0) {
        const target = intersects[0].object;
        const cityPos = target.getWorldPosition(new THREE.Vector3());
        const camDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
        const cityDir = cityPos.clone().normalize();
        if (cityDir.dot(camDir) > 0) {
          currentHoveredCity = target.userData.city;
          setHoveredCity(target.userData.city);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      currentHoveredCity = null;
      setHoveredCity(null);
      renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
    };

    const onClick = (e: MouseEvent) => {
      if (zoomAnimating) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseNDC = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(cityMeshes);
      if (intersects.length > 0) {
        const target = intersects[0].object;
        const cityPos = target.getWorldPosition(new THREE.Vector3());
        const camDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
        const cityDir = cityPos.clone().normalize();
        if (cityDir.dot(camDir) > 0) {
          // Zoom-in animation + CSS blur/black overlay before transitioning
          zoomAnimating = true;
          setZoomingIn(true);
          currentHoveredCity = null;
          setHoveredCity(null);
          const startZ = camera.position.z;
          const targetZ = 3.5;
          const startTime = performance.now();
          const animateZoom = () => {
            const elapsed = performance.now() - startTime;
            const t = Math.min(1, elapsed / 600);
            const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
            camera.position.z = startZ + (targetZ - startZ) * ease;
            if (t < 1) {
              requestAnimationFrame(animateZoom);
            } else {
              onCitySelect(target.userData.city);
            }
          };
          animateZoom();
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.005;
      camera.position.z = Math.max(5, Math.min(15, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation
    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      // Auto rotation — paused when dragging, hovering, zooming, or at max zoom-in
      if (!isDragging) {
        rotVelY *= 0.95;
        rotVelX *= 0.95;
        if (!currentHoveredCity && !zoomAnimating && camera.position.z > 5.05) {
          targetRotation.y += 0.0008;
        }
      }
      globe.rotation.y = targetRotation.y;
      globe.rotation.x = targetRotation.x;
      gridGroup.rotation.y = targetRotation.y;
      gridGroup.rotation.x = targetRotation.x;
      cityGroup.rotation.y = targetRotation.y;
      cityGroup.rotation.x = targetRotation.x;

      // Pulse rings (subtler, slower)
      cityGroup.children.forEach((child) => {
        if (child.userData.isPulse) {
          const phase = (t * 1.0 + child.userData.phase) % (Math.PI * 2);
          const scale = 1 + Math.sin(phase) * 0.4;
          child.scale.set(scale, scale, scale);
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5 - Math.sin(phase) * 0.3;
        }
      });

      // Highlight hovered dot — uses closure var for live state
      cityMeshes.forEach((dot) => {
        const isHov = currentHoveredCity && dot.userData.city.id === currentHoveredCity.id;
        const target = isHov ? 1.6 : 1;
        dot.scale.x += (target - dot.scale.x) * 0.2;
        dot.scale.y = dot.scale.x;
        dot.scale.z = dot.scale.x;
        (dot.material as THREE.MeshBasicMaterial).color.setHex(isHov ? 0xffffff : 0xfbbf24);
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('wheel', onWheel);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      globeGeometry.dispose();
      globeMaterial.dispose();
      gridMat.dispose();
      equatorMat.dispose();
      gridGroup.children.forEach((line) => (line as THREE.Line).geometry.dispose());
    };
  }, [onCitySelect]);

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full transition-all duration-700 ease-out"
        style={{
          cursor: 'grab',
          filter: zoomingIn ? 'blur(20px) brightness(0.4)' : 'none',
        }}
      />

      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 p-6 pointer-events-none transition-opacity duration-500 ${zoomingIn ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="w-7 h-7 text-blue-700" />
            <div>
              <h1 className="text-xl font-light tracking-wide text-blue-900">
                Global Sustainable Tourism <span className="font-semibold">AI Lab</span>
              </h1>
              <p className="text-xs text-blue-600/70 mt-0.5">Explore global sustainable tourism challenges</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700 font-medium">25 Cities</p>
            <p className="text-xs text-blue-500/70">Click a marker · Drag to rotate</p>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className={`absolute bottom-6 left-0 right-0 text-center pointer-events-none transition-opacity duration-500 ${zoomingIn ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-xs text-blue-500/60 tracking-widest">DRAG TO ROTATE · SCROLL TO ZOOM · CLICK A POINT</p>
      </div>

      {/* Hover intro card */}
      {hoveredCity && !zoomingIn && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: Math.min(mousePos.x + 20, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 312),
            top: Math.min(mousePos.y + 20, (typeof window !== 'undefined' ? window.innerHeight : 720) - 280),
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-blue-100 overflow-hidden w-72">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-cyan-600">
              <p className="text-[10px] text-cyan-100/90 tracking-[0.2em] font-medium">{hoveredCity.region.toUpperCase()}</p>
              <p className="text-lg font-semibold text-white leading-tight mt-0.5">{hoveredCity.name}</p>
              <p className="text-xs text-cyan-100 mt-0.5">{hoveredCity.country}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-700 leading-relaxed mb-3">{hoveredCity.intro}</p>
              <div className="flex flex-wrap gap-1">
                {hoveredCity.issues.map((issue, i) => (
                  <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    {issue.icon} {issue.tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-[11px] text-blue-600 text-center border-t border-blue-100">
              Click to explore →
            </div>
          </div>
        </div>
      )}

      {/* Black overlay during zoom-in transition */}
      <div
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-700 ease-out ${
          zoomingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

// ============ AI Chat ============
function AIChat({ city }: { city: City }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([]);
  }, [city.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const presetQuestions = [
    `What tourism crisis might ${city.name} face by 2030?`,
    `Which AI technologies could help reduce visitor flow in ${city.name}?`,
    `Compare ${city.name} with similar cities that successfully transitioned to sustainable tourism.`,
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const systemPrompt = `You are the AI sustainable-tourism advisor for the "Global Sustainable Tourism AI Lab," helping students analyze global tourism sustainability issues in English.

Current city the student is researching:
- City: ${city.name}, ${city.country}
- Brief: ${city.intro}
- Key challenges:
${city.issues.map((i) => `  ${i.icon} ${i.tag}: ${i.detail}`).join('\n')}

Answer in an educational, objective tone with concrete data and real cases. When you answer:
1. Always reply in English (this is an English-language learning lab).
2. Keep responses under 200 words, with clear points.
3. Cite real cases or feasible solutions where relevant.
4. End with one short follow-up question to keep the student thinking.`;

    try {
      // NOTE: Routed through a backend proxy (to be implemented) so the
      // Anthropic API key is never exposed to the browser.
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const aiText: string =
        data.content?.find((c: { type: string }) => c.type === 'text')?.text ||
        data.text ||
        'Sorry, I cannot respond right now. Please try again later.';
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            '⚠️ The /api/chat backend proxy is not running yet. Please set up the proxy endpoint (connecting to the Anthropic API) and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/20 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-300" />
        <h3 className="text-sm font-semibold text-white">AI Sustainability Diagnosis</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/70 mb-3">Pick a question to start, or ask your own:</p>
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-xs text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 border border-white/10 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-500/80 text-white rounded-br-sm'
                  : 'bg-white/20 text-white rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/20 px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/20">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask a question..."
            className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg px-3 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Student Board ============
function StudentBoard({ city, onClose }: { city: City; onClose: () => void }) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `board:${city.id}`;

  useEffect(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      const list: BoardPost[] = raw ? JSON.parse(raw) : [];
      setPosts(list.sort((a, b) => b.time - a.time));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  const submit = () => {
    if (!nickname.trim() || !content.trim() || content.length > 500) return;
    setSubmitting(true);
    const newPost: BoardPost = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      nickname: nickname.trim(),
      content: content.trim(),
      time: Date.now(),
    };
    const updated = [newPost, ...posts];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setPosts(updated);
      setContent('');
    } catch (err) {
      alert('Submission failed. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              💬 {city.name} · 24-Hour Smart Visitor Cap Plan
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Share your solution · Visible to students worldwide</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b bg-blue-50/50">
          <div className="flex gap-2 mb-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="Your nickname"
              className="w-32 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400"
            />
            <span className="text-xs text-gray-400 self-center">{content.length}/500</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="Example: 7-10 AM resident-priority entry; afternoon visitor cap of 4,000..."
            className="w-full text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submit}
              disabled={submitting || !nickname.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {submitting ? 'Submitting...' : 'Submit suggestion'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && <p className="text-sm text-gray-400 text-center">Loading...</p>}
          {!loading && posts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No posts yet — be the first to share a solution!</p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{p.nickname}</span>
                <span className="text-xs text-gray-400">{formatTime(p.time)}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ City Dashboard ============
const BG_INTERVAL_MS = 30_000;
const BG_FADE_MS = 2000;
const KENBURNS_VARIANTS = ['kenburns-a', 'kenburns-b', 'kenburns-c', 'kenburns-d'] as const;

function CityDashboard({ city, onBack }: { city: City; onBack: () => void }) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  // Reset carousel when city changes
  useEffect(() => {
    setBgIndex(0);
    setCycle(0);
  }, [city.id]);

  // Auto-advance every BG_INTERVAL_MS; resets whenever bgIndex changes (manual or auto)
  useEffect(() => {
    const id = window.setInterval(() => {
      setBgIndex((i) => (i + 1) % city.bg.length);
      setCycle((c) => c + 1);
    }, BG_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [city.id, bgIndex, city.bg.length]);

  const goTo = (i: number) => {
    setBgIndex(((i % city.bg.length) + city.bg.length) % city.bg.length);
    setCycle((c) => c + 1);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background carousel — three layered images cross-fade with a slow Ken Burns zoom */}
      {city.bg.map((url, i) => (
        <div
          key={`${city.id}-${i}-${cycle}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${url})`,
            opacity: i === bgIndex ? 1 : 0,
            transition: `opacity ${BG_FADE_MS}ms ease-out`,
            animation:
              i === bgIndex
                ? `${KENBURNS_VARIANTS[i % KENBURNS_VARIANTS.length]} ${BG_INTERVAL_MS + BG_FADE_MS}ms ease-out forwards`
                : 'none',
            willChange: 'opacity, transform',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70 pointer-events-none" />

      {/* Manual prev/next */}
      <button
        onClick={() => goTo(bgIndex - 1)}
        aria-label="Previous background"
        className="absolute z-20 left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white opacity-50 hover:opacity-100 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => goTo(bgIndex + 1)}
        aria-label="Next background"
        className="absolute z-20 right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white opacity-50 hover:opacity-100 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {city.bg.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Background ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === bgIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white border border-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Globe</span>
        </button>
        <button
          onClick={() => setShowBoard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md rounded-lg text-white border border-white/20 transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Student Board</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-6 pb-6 grid grid-cols-12 gap-6 h-[calc(100%-72px)]">
        {/* Left: city info & issues */}
        <div className="col-span-7 flex flex-col gap-4 overflow-y-auto pr-2">
          <div>
            <p className="text-xs tracking-widest text-cyan-300 mb-1">{city.region.toUpperCase()}</p>
            <h2 className="text-5xl font-light text-white">{city.name}</h2>
            <p className="text-lg text-white/80 mt-1">{city.country}</p>
            <p className="text-sm text-white/70 mt-3 max-w-xl leading-relaxed">{city.intro}</p>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-semibold text-white tracking-wide">CORE CHALLENGES</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {city.issues.map((issue, i) => {
                const isOpen = expandedIssue === i;
                return (
                  <button
                    key={i}
                    onClick={() => setExpandedIssue(isOpen ? null : i)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isOpen
                        ? 'bg-white/20 border-cyan-300/50 col-span-2'
                        : 'bg-white/10 hover:bg-white/15 border-white/15'
                    } backdrop-blur-md`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{issue.icon}</span>
                      <span className="text-sm font-semibold text-white">{issue.tag}</span>
                    </div>
                    {isOpen && (
                      <p className="text-xs text-white/85 mt-3 leading-relaxed">{issue.detail}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Chat */}
        <div className="col-span-5">
          <AIChat city={city} />
        </div>
      </div>

      {showBoard && <StudentBoard city={city} onClose={() => setShowBoard(false)} />}
    </div>
  );
}

// ============ Main App ============
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleCitySelect = (city: City) => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCity(city);
      setTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedCity(null);
      setTransitioning(false);
    }, 300);
  };

  return (
    <div className="w-full h-screen overflow-hidden font-sans">
      <div className={`w-full h-full transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {selectedCity ? (
          <CityDashboard city={selectedCity} onBack={handleBack} />
        ) : (
          <Globe onCitySelect={handleCitySelect} />
        )}
      </div>
    </div>
  );
}
