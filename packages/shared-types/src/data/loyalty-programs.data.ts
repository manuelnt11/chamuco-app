export type LoyaltyProgramCategory =
  | 'airline'
  | 'hotel'
  | 'car_rental'
  | 'cruise'
  | 'bank'
  | 'other';

export interface LoyaltyProgramSuggestion {
  name: string;
  category: LoyaltyProgramCategory;
}

export const LOYALTY_PROGRAM_SUGGESTIONS: LoyaltyProgramSuggestion[] = [
  // Airlines
  { name: 'Aeromexico Rewards', category: 'airline' },
  { name: 'Air Canada Aeroplan', category: 'airline' },
  { name: 'Air France-KLM Flying Blue', category: 'airline' },
  { name: 'Alaska Airlines Mileage Plan', category: 'airline' },
  { name: 'American Airlines AAdvantage', category: 'airline' },
  { name: 'Avianca LifeMiles', category: 'airline' },
  { name: 'British Airways Executive Club', category: 'airline' },
  { name: 'Copa Airlines ConnectMiles', category: 'airline' },
  { name: 'Delta SkyMiles', category: 'airline' },
  { name: 'Emirates Skywards', category: 'airline' },
  { name: 'Etihad Guest', category: 'airline' },
  { name: 'Frontier Miles', category: 'airline' },
  { name: 'Iberia Plus', category: 'airline' },
  { name: 'JetBlue TrueBlue', category: 'airline' },
  { name: 'LATAM Pass', category: 'airline' },
  { name: 'Lufthansa Miles & More', category: 'airline' },
  { name: 'Qatar Airways Privilege Club', category: 'airline' },
  { name: 'Singapore Airlines KrisFlyer', category: 'airline' },
  { name: 'Southwest Rapid Rewards', category: 'airline' },
  { name: 'Spirit Free Spirit', category: 'airline' },
  { name: 'TAP Miles&Go', category: 'airline' },
  { name: 'Turkish Airlines Miles&Smiles', category: 'airline' },
  { name: 'United Airlines MileagePlus', category: 'airline' },
  { name: 'Virgin Atlantic Flying Club', category: 'airline' },
  { name: 'Volaris V-Club', category: 'airline' },

  // Hotels
  { name: 'Accor Live Limitless', category: 'hotel' },
  { name: 'Best Western Rewards', category: 'hotel' },
  { name: 'Choice Privileges', category: 'hotel' },
  { name: 'Hilton Honors', category: 'hotel' },
  { name: 'IHG One Rewards', category: 'hotel' },
  { name: 'Marriott Bonvoy', category: 'hotel' },
  { name: 'Radisson Rewards', category: 'hotel' },
  { name: 'World of Hyatt', category: 'hotel' },
  { name: 'Wyndham Rewards', category: 'hotel' },

  // Car Rentals
  { name: 'Alamo Insiders', category: 'car_rental' },
  { name: 'Avis Preferred', category: 'car_rental' },
  { name: 'Budget Fastbreak', category: 'car_rental' },
  { name: 'Enterprise Plus', category: 'car_rental' },
  { name: 'Hertz Gold Plus Rewards', category: 'car_rental' },
  { name: 'National Emerald Club', category: 'car_rental' },
  { name: 'Sixt Loyalty Program', category: 'car_rental' },

  // Cruises
  { name: 'Carnival VIFP Club', category: 'cruise' },
  { name: "Celebrity Cruises Captain's Club", category: 'cruise' },
  { name: 'MSC Voyagers Club', category: 'cruise' },
  { name: 'Norwegian Latitudes Rewards', category: 'cruise' },
  { name: 'Princess Circle', category: 'cruise' },
  { name: 'Royal Caribbean Crown & Anchor Society', category: 'cruise' },

  // Banks & Credit Cards
  { name: 'American Express Membership Rewards', category: 'bank' },
  { name: 'Capital One Miles', category: 'bank' },
  { name: 'Chase Ultimate Rewards', category: 'bank' },
  { name: 'Citibank ThankYou Points', category: 'bank' },
];
