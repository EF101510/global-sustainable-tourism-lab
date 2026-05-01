/**
 * Carrying-capacity defaults per city. Picked so that the formula
 *   C = A × U_f / R_t
 * produces a value near each site's real-world capacity benchmark, and
 * `actualVisitors` reflects an observed peak. Numbers are educational
 * approximations — the AI "estimate" button can pull live values.
 *
 * `siteName` is the focal landmark we're modelling, not the whole city.
 */
export interface CarryingCapacityDefaults {
  area: number; // A — m² of the focal tourist site
  spacePerPerson: number; // U_f — m² per person (lower = more crowded)
  stayTime: number; // R_t — hours, typical visit duration
  actualVisitors: number; // observed peak daily visitor count
  siteName: string;
}

const FALLBACK: CarryingCapacityDefaults = {
  area: 10000,
  spacePerPerson: 5,
  stayTime: 4,
  actualVisitors: 15000,
  siteName: 'Generic site',
};

// Area values are based on published site dimensions / official figures
// where available, otherwise calculated from satellite measurements of the
// pedestrian-accessible portion (not the wider conservation area).
const DATA: Record<string, CarryingCapacityDefaults> = {
  venice: {
    // ~175 m × ~82 m trapezoid bordered by the Procuratie and Basilica
    area: 12_300,
    spacePerPerson: 1.5,
    stayTime: 4,
    actualVisitors: 80_000,
    siteName: "St. Mark's Square (Piazza San Marco)",
  },
  barcelona: {
    // Sagrada Família footprint (~95 × 60 m) plus Plaça de Gaudí
    area: 11_500,
    spacePerPerson: 2,
    stayTime: 3,
    actualVisitors: 20_000,
    siteName: 'Sagrada Família precinct',
  },
  amsterdam: {
    // Dam Square — approx. 200 × 100 m irregular paved plaza
    area: 19_500,
    spacePerPerson: 2,
    stayTime: 3,
    actualVisitors: 25_000,
    siteName: 'Dam Square',
  },
  santorini: {
    // Oia main pedestrian spine along the caldera (~600 × 60 m active zone)
    area: 34_800,
    spacePerPerson: 1.2,
    stayTime: 4,
    actualVisitors: 14_000,
    siteName: 'Oia village',
  },
  dubrovnik: {
    // Inside the city walls — ~350 × 250 m irregular footprint
    area: 87_500,
    spacePerPerson: 0.2,
    stayTime: 4,
    actualVisitors: 8_000,
    siteName: 'Old town inside walls',
  },
  reykjavik: {
    // Hallgrímskirkja interior (~1,500 m²) + Skólavörðustígur top plaza
    area: 4_200,
    spacePerPerson: 1.5,
    stayTime: 1.5,
    actualVisitors: 5_500,
    siteName: 'Hallgrímskirkja',
  },
  paris: {
    // Eiffel Tower base — 125 × 125 m square footprint
    area: 15_625,
    spacePerPerson: 1.5,
    stayTime: 2,
    actualVisitors: 25_000,
    siteName: 'Eiffel Tower base',
  },
  florence: {
    // Piazza del Duomo + Piazza San Giovanni — ~150 × 75 m
    area: 11_250,
    spacePerPerson: 1.5,
    stayTime: 4,
    actualVisitors: 12_000,
    siteName: 'Piazza del Duomo',
  },
  kyoto: {
    // Kiyomizu-dera entire hillside complex
    area: 130_000,
    spacePerPerson: 0.4,
    stayTime: 2,
    actualVisitors: 18_000,
    siteName: 'Kiyomizu-dera complex',
  },
  bali: {
    // Tanah Lot temple platform + ocean overlook + cliff-walk approach
    area: 11_800,
    spacePerPerson: 2,
    stayTime: 2,
    actualVisitors: 12_000,
    siteName: 'Tanah Lot temple',
  },
  phuket: {
    // Maya Bay beach — 250 × 30 m (Phi Phi Leh, accessed via Phuket)
    area: 7_500,
    spacePerPerson: 2,
    stayTime: 1,
    actualVisitors: 4_000,
    siteName: 'Maya Bay (Phi Phi Leh)',
  },
  boracay: {
    // White Beach — 4 km long, average 24 m wide above high-tide line
    area: 96_000,
    spacePerPerson: 1.5,
    stayTime: 8,
    actualVisitors: 20_000,
    siteName: 'White Beach',
  },
  bangkok: {
    // Official Grand Palace + Wat Phra Kaew complex area
    area: 218_400,
    spacePerPerson: 0.4,
    stayTime: 2,
    actualVisitors: 40_000,
    siteName: 'Grand Palace & Wat Phra Kaew',
  },
  siemreap: {
    // Angkor Wat temple platform — 187 × 215 m core structure
    area: 40_200,
    spacePerPerson: 0.5,
    stayTime: 1.5,
    actualVisitors: 8_000,
    siteName: 'Angkor Wat temple platform',
  },
  seoul: {
    // Bukchon Hanok Village main pedestrian alleys (~30 ha district)
    area: 65_000,
    spacePerPerson: 1,
    stayTime: 2.5,
    actualVisitors: 22_000,
    siteName: 'Bukchon Hanok Village',
  },
  newyork: {
    // Times Square pedestrian plaza ("bowtie" closed-street zone)
    area: 10_400,
    spacePerPerson: 1,
    stayTime: 1.5,
    actualVisitors: 20_000,
    siteName: 'Times Square pedestrian plaza',
  },
  machupicchu: {
    // Inca citadel core ridge — UNESCO heritage site visitor circuit
    area: 53_000,
    spacePerPerson: 0.34,
    stayTime: 4,
    actualVisitors: 5_600,
    siteName: 'Inca citadel',
  },
  cusco: {
    // Plaza de Armas — 110 × 120 m colonial-era main square
    area: 13_200,
    spacePerPerson: 2,
    stayTime: 3,
    actualVisitors: 8_000,
    siteName: 'Plaza de Armas',
  },
  rio: {
    // Sugarloaf upper cable-car station + 360° viewing platforms
    area: 4_800,
    spacePerPerson: 1.5,
    stayTime: 1.5,
    actualVisitors: 10_000,
    siteName: 'Sugarloaf summit deck',
  },
  cancun: {
    // Representative public-access beach segment, Hotel Zone
    area: 72_000,
    spacePerPerson: 2,
    stayTime: 6,
    actualVisitors: 18_000,
    siteName: 'Hotel Zone public beach',
  },
  cairo: {
    // Giza pyramids tourist walking circuit (subset of 1.6×1.1 km plateau)
    area: 210_000,
    spacePerPerson: 0.5,
    stayTime: 3,
    actualVisitors: 25_000,
    siteName: 'Giza pyramids tourist circuit',
  },
  capetown: {
    // Table Mountain summit visitor zone around upper cable station
    area: 6_400,
    spacePerPerson: 2,
    stayTime: 2,
    actualVisitors: 8_000,
    siteName: 'Table Mountain summit',
  },
  sydney: {
    // Bennelong Point — Opera House podium and forecourt
    area: 21_800,
    spacePerPerson: 1.5,
    stayTime: 1.5,
    actualVisitors: 22_000,
    siteName: 'Opera House precinct',
  },
  galapagos: {
    // Bartolomé Island boardwalk + Pinnacle Rock viewpoint summit
    area: 5_200,
    spacePerPerson: 8,
    stayTime: 2,
    actualVisitors: 600,
    siteName: 'Bartolomé visitor trail',
  },
  auckland: {
    // Sky Tower base + Viaduct Harbour pedestrian precinct
    area: 24_500,
    spacePerPerson: 2,
    stayTime: 2.5,
    actualVisitors: 10_000,
    siteName: 'Sky Tower & Viaduct Harbour',
  },
};

export function getCarryingCapacityDefaults(
  cityId: string
): CarryingCapacityDefaults {
  return DATA[cityId] ?? FALLBACK;
}
