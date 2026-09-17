// Public restaurant information. Private card details are loaded only from the authenticated API.
export const RESTAURANTS = [
  {
    id: 'daikaya', numeral: 'I', name: 'Daikaya', neighborhood: 'Penn Quarter', cuisine: 'Ramen',
    web: 'https://daikaya.com', lat: 38.8996, lng: -77.0208,
    description: 'A ramen shop in Penn Quarter.',
    tip: 'A ramen shop in Penn Quarter.',
    color: 'peach',
    photo: { src: '/images/restaurants/daikaya.jpg', small: '/images/restaurants/daikaya-small.jpg', width: 1200, height: 1800, alt: 'A bowl of ramen and a beer at Daikaya’s counter.' },
    giftCard: { provider: 'toast', label: 'Daikaya eGift card', amount: 30 },
  },
  {
    id: 'carusos-grocery', numeral: 'II', name: "Caruso's Grocery", neighborhood: 'Capitol Hill', cuisine: 'Italian',
    web: 'https://carusosgrocery.com', lat: 38.8793, lng: -76.9860,
    description: 'An Italian restaurant serving old-school classics.',
    tip: 'An Italian restaurant serving old-school classics.',
    color: 'sage',
    photo: { src: '/images/restaurants/carusos-grocery.jpg', small: '/images/restaurants/carusos-grocery-small.jpg', width: 1200, height: 559, alt: 'Pasta with red sauce and ricotta at Caruso’s Grocery.' },
    giftCard: {
      provider: 'giftrocker', label: 'Neighborhood Restaurant Group gift card', amount: 30,
      note: 'We picked Caruso’s Grocery for this card. Check the provider’s current list of participating Neighborhood Restaurant Group restaurants if you want to use it elsewhere.',
    },
  },
  {
    id: 'le-diplomate', numeral: 'III', name: 'Le Diplomate', neighborhood: '14th Street', cuisine: 'French brasserie',
    web: 'https://lediplomatedc.com', lat: 38.9114, lng: -77.0320,
    description: 'A French brasserie on 14th Street.',
    tip: 'A French brasserie on 14th Street.',
    color: 'butter',
    photo: { src: '/images/restaurants/le-diplomate.jpg', small: '/images/restaurants/le-diplomate-small.jpg', width: 1200, height: 675, alt: 'A server setting a sidewalk café table at Le Diplomate.' },
    giftCard: {
      provider: 'cashstar', label: 'STARR Restaurants eGift card', amount: 30,
      note: 'We picked Le Diplomate for this card. Check the provider’s current list of participating STARR restaurants if you want to use it elsewhere.',
    },
  },
  {
    id: 'perrys', numeral: 'IV', name: "Perry's", neighborhood: 'Adams Morgan', cuisine: 'Japanese & sushi',
    web: 'https://www.perrysam.com/', lat: 38.9218, lng: -77.0429,
    description: 'Japanese food, sushi, and a rooftop in Adams Morgan.',
    tip: 'A Japanese restaurant with sushi and a rooftop in Adams Morgan.',
    color: 'lilac',
    photo: { src: '/images/restaurants/perrys.jpg', small: '/images/restaurants/perrys-small.jpg', width: 1200, height: 799, alt: 'Perry’s rooftop at dusk, with string lights above the tables.' },
    giftCard: { provider: 'toast', label: "Perry's eGift card", amount: 30 },
  },
];

export const PRESENTED_TO = 'Jack & Anne Twiford';
