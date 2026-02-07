/**
 * Comprehensive Nigerian States, Cities, and Skills Data
 * Used for location and skill selection across the app
 */

// All 36 Nigerian States + FCT
export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

// Cities/LGAs by State
export const NIGERIAN_CITIES: Record<NigerianState, string[]> = {
  'Abia': [
    'Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende', 'Isiala Ngwa', 'Osisioma',
  ],
  'Adamawa': [
    'Yola', 'Mubi', 'Jimeta', 'Numan', 'Ganye', 'Gombi', 'Mayo Belwa',
  ],
  'Akwa Ibom': [
    'Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak', 'Ikot Abasi', 'Itu',
  ],
  'Anambra': [
    'Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Obosi', 'Ogidi', 'Ozubulu', 'Ihiala',
  ],
  'Bauchi': [
    'Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum', 'Ningi', 'Tafawa Balewa',
  ],
  'Bayelsa': [
    'Yenagoa', 'Ogbia', 'Nembe', 'Brass', 'Sagbama', 'Ekeremor', 'Southern Ijaw',
  ],
  'Benue': [
    'Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya', 'Oturkpo', 'Adikpo',
  ],
  'Borno': [
    'Maiduguri', 'Biu', 'Damboa', 'Bama', 'Konduga', 'Gwoza', 'Dikwa',
  ],
  'Cross River': [
    'Calabar', 'Ogoja', 'Ikom', 'Ugep', 'Obudu', 'Akamkpa', 'Odukpani',
  ],
  'Delta': [
    'Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor', 'Effurun', 'Ozoro', 'Kwale', 'Oleh',
  ],
  'Ebonyi': [
    'Abakaliki', 'Afikpo', 'Onueke', 'Ezza', 'Ikwo', 'Ishielu', 'Ohaozara',
  ],
  'Edo': [
    'Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Ubiaja', 'Igarra', 'Sabongida-Ora',
  ],
  'Ekiti': [
    'Ado-Ekiti', 'Ikere', 'Ikole', 'Oye', 'Ijero', 'Emure', 'Efon', 'Aramoko',
  ],
  'Enugu': [
    'Enugu', 'Nsukka', 'Agbani', 'Awgu', 'Udi', 'Oji River', 'Ezeagu',
  ],
  'FCT': [
    'Abuja Central', 'Wuse', 'Garki', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa',
    'Bwari', 'Gwagwalada', 'Kuje', 'Nyanya', 'Lugbe', 'Jabi', 'Utako', 'Wuye',
  ],
  'Gombe': [
    'Gombe', 'Kumo', 'Billiri', 'Kaltungo', 'Bajoga', 'Dukku', 'Nafada',
  ],
  'Imo': [
    'Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise', 'Nkwerre', 'Mbano',
  ],
  'Jigawa': [
    'Dutse', 'Hadejia', 'Gumel', 'Kazaure', 'Birnin Kudu', 'Ringim', 'Babura',
  ],
  'Kaduna': [
    'Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Kachia', 'Saminaka', 'Birnin Gwari',
  ],
  'Kano': [
    'Kano', 'Wudil', 'Gwarzo', 'Rano', 'Bichi', 'Ungogo', 'Fagge', 'Tarauni', 'Nassarawa',
  ],
  'Katsina': [
    'Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Dutsin-Ma', 'Kankia', 'Mani',
  ],
  'Kebbi': [
    'Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Jega', 'Bagudo', 'Koko',
  ],
  'Kogi': [
    'Lokoja', 'Okene', 'Kabba', 'Idah', 'Ankpa', 'Anyigba', 'Dekina',
  ],
  'Kwara': [
    'Ilorin', 'Offa', 'Jebba', 'Lafiagi', 'Pategi', 'Omu-Aran', 'Erin-Ile',
  ],
  'Lagos': [
    'Lagos Island', 'Lagos Mainland', 'Ikeja', 'Lekki', 'Victoria Island', 'Ikoyi',
    'Surulere', 'Yaba', 'Ikorodu', 'Ajah', 'Epe', 'Badagry', 'Alimosho', 'Oshodi',
    'Mushin', 'Apapa', 'Festac', 'Agege', 'Ifako-Ijaiye', 'Ojodu', 'Ogba', 'Maryland',
    'Gbagada', 'Ogudu', 'Kosofe', 'Magodo', 'Ojota', 'Ketu', 'Berger', 'Sangotedo',
  ],
  'Nasarawa': [
    'Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Doma', 'Karu', 'Kokona',
  ],
  'Niger': [
    'Minna', 'Bida', 'Suleja', 'Kontagora', 'New Bussa', 'Lapai', 'Agaie',
  ],
  'Ogun': [
    'Abeokuta', 'Ijebu Ode', 'Sagamu', 'Ota', 'Ifo', 'Ilaro', 'Sango', 'Owode', 'Ogere',
  ],
  'Ondo': [
    'Akure', 'Ondo', 'Owo', 'Ikare', 'Ore', 'Okitipupa', 'Idanre',
  ],
  'Osun': [
    'Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Iwo', 'Ikire', 'Ejigbo', 'Modakeke',
  ],
  'Oyo': [
    'Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki', 'Eruwa', 'Igboho', 'Fiditi',
  ],
  'Plateau': [
    'Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Langtang', 'Barkin Ladi', 'Mangu',
  ],
  'Rivers': [
    'Port Harcourt', 'Obio-Akpor', 'Bonny', 'Eleme', 'Okrika', 'Degema', 'Ahoada',
    'Omoku', 'Opobo', 'Rumuokoro', 'Trans Amadi', 'GRA', 'Diobu',
  ],
  'Sokoto': [
    'Sokoto', 'Tambuwal', 'Wurno', 'Wamakko', 'Bodinga', 'Gwadabawa', 'Illela',
  ],
  'Taraba': [
    'Jalingo', 'Wukari', 'Bali', 'Takum', 'Gembu', 'Zing', 'Ibi',
  ],
  'Yobe': [
    'Damaturu', 'Potiskum', 'Nguru', 'Gashua', 'Geidam', 'Bade', 'Fika',
  ],
  'Zamfara': [
    'Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Bungudu', 'Maru', 'Shinkafi',
  ],
};

// Skill Categories and Skills
export interface SkillCategory {
  name: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: 'Construction & Building',
    skills: [
      'Electrician',
      'Plumber',
      'Carpenter',
      'Painter',
      'Mason',
      'Tiler',
      'Welder',
      'POP Installer',
      'Aluminium Fabricator',
      'Steel Bender',
      'Scaffolder',
      'Roofer',
      'Brick Layer',
      'Plasterer',
      'Glazier',
      'Concrete Worker',
      'Surveyor',
      'Site Supervisor',
    ],
  },
  {
    name: 'Technical & Repairs',
    skills: [
      'AC Technician',
      'Generator Repair',
      'Phone Repair',
      'Laptop Repair',
      'TV Repair',
      'Refrigerator Repair',
      'Washing Machine Repair',
      'Solar Panel Installer',
      'CCTV Installer',
      'Inverter Technician',
      'Electronics Repair',
      'Printer Repair',
      'UPS Repair',
      'Water Heater Repair',
    ],
  },
  {
    name: 'Automotive',
    skills: [
      'Auto Mechanic',
      'Panel Beater',
      'Vulcanizer',
      'Auto Electrician',
      'Car Wash',
      'Car AC Repair',
      'Spray Painter',
      'Towing Service',
      'Battery Charger',
      'Wheel Alignment',
      'Car Interior',
      'Motorcycle Mechanic',
      'Tricycle Mechanic',
    ],
  },
  {
    name: 'Fashion & Beauty',
    skills: [
      'Tailor',
      'Fashion Designer',
      'Hair Stylist',
      'Barber',
      'Makeup Artist',
      'Nail Technician',
      'Lash Technician',
      'Cobbler',
      'Bag Maker',
      'Bead Maker',
      'Aso-Oke Weaver',
      'Adire Maker',
      'Hat Maker',
      'Embroidery',
      'Laundry Service',
      'Dry Cleaner',
    ],
  },
  {
    name: 'Food & Catering',
    skills: [
      'Chef',
      'Caterer',
      'Baker',
      'Cake Maker',
      'Small Chops',
      'Grill Master',
      'Shawarma Maker',
      'Local Food Vendor',
      'Fruit Juice Maker',
      'Pastry Chef',
      'Food Packaging',
      'Meal Prep Service',
    ],
  },
  {
    name: 'Home Services',
    skills: [
      'Cleaner',
      'Gardener',
      'Security',
      'Fumigation',
      'Pest Control',
      'Upholstery',
      'Furniture Maker',
      'Curtain Maker',
      'Interior Decorator',
      'Carpet Cleaner',
      'Pool Cleaner',
      'House Help',
      'Nanny',
      'Elderly Care',
    ],
  },
  {
    name: 'Transport & Logistics',
    skills: [
      'Driver',
      'Dispatch Rider',
      'Truck Driver',
      'Bus Driver',
      'Moving Service',
      'Courier Service',
      'Boat Operator',
      'Forklift Operator',
    ],
  },
  {
    name: 'Events & Entertainment',
    skills: [
      'Photographer',
      'Videographer',
      'DJ',
      'Event Planner',
      'Decorator',
      'MC/Host',
      'Live Band',
      'Sound Engineer',
      'Lighting Technician',
      'Usher Service',
      'Bouncer',
      'Rental Service',
      'Balloon Decorator',
      'Florist',
    ],
  },
  {
    name: 'Health & Wellness',
    skills: [
      'Massage Therapist',
      'Fitness Trainer',
      'Yoga Instructor',
      'Physiotherapist',
      'Home Nurse',
      'Caregiver',
      'Herbalist',
      'Traditional Medicine',
    ],
  },
  {
    name: 'Education & Training',
    skills: [
      'Home Tutor',
      'Driving Instructor',
      'Music Teacher',
      'Dance Instructor',
      'Language Teacher',
      'Computer Training',
      'Skills Acquisition',
    ],
  },
  {
    name: 'Digital & Creative',
    skills: [
      'Graphic Designer',
      'Web Developer',
      'Social Media Manager',
      'Video Editor',
      'Content Creator',
      'Logo Designer',
      'Printer/Branding',
      'Sign Writer',
    ],
  },
  {
    name: 'Agriculture',
    skills: [
      'Farmer',
      'Fisherman',
      'Livestock Farmer',
      'Poultry Farmer',
      'Crop Sprayer',
      'Agricultural Consultant',
      'Farm Manager',
    ],
  },
  {
    name: 'Professional Services',
    skills: [
      'Accountant',
      'Lawyer',
      'Agent (Property)',
      'Insurance Agent',
      'Travel Agent',
      'Clearing Agent',
      'Customs Broker',
    ],
  },
  {
    name: 'Other',
    skills: [
      'Borehole Driller',
      'Water Tank Installer',
      'Septic Tank Service',
      'Locksmith',
      'Key Cutter',
      'Shoe Shiner',
      'Bike Repairer',
      'Gas Refiller',
      'Generator Operator',
    ],
  },
];

// Flat list of all skills for quick access
export const ALL_SKILLS: string[] = SKILL_CATEGORIES.flatMap(cat => cat.skills).sort();

// Helper function to search skills
export const searchSkills = (query: string): string[] => {
  if (!query.trim()) return ALL_SKILLS;
  const lowerQuery = query.toLowerCase();
  return ALL_SKILLS.filter(skill =>
    skill.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to get cities for a state
export const getCitiesForState = (state: NigerianState): string[] => {
  return NIGERIAN_CITIES[state] || [];
};

// Helper to format location display
export const formatLocation = (state: string, city?: string): string => {
  if (city) {
    return `${city}, ${state}`;
  }
  return state;
};

// Get category for a skill
export const getSkillCategory = (skill: string): string | null => {
  for (const category of SKILL_CATEGORIES) {
    if (category.skills.includes(skill)) {
      return category.name;
    }
  }
  return null;
};
