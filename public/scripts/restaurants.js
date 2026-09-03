// The four tables. Public data only: gift card codes come from the API after login, never from this file.
export const RESTAURANTS = [
  {
    id: 'daikaya', numeral: 'I', name: 'Daikaya', neighborhood: 'Penn Quarter', cuisine: 'Ramen',
    web: 'https://daikaya.com', lat: 38.8996, lng: -77.0208,
    tip: "Rae's favorite restaurant in D.C. Get the spicy miso ramen — that's the move. Not into spicy? The plain miso is the one.",
    giftCard: { provider: 'toast', label: 'Daikaya eGift card', amount: 30 },
  },
  {
    id: 'carusos-grocery', numeral: 'II', name: "Caruso's Grocery", neighborhood: 'Capitol Hill', cuisine: 'Italian',
    web: 'https://carusosgrocery.com', lat: 38.8793, lng: -76.9860,
    tip: "Old-school Italian and one of my absolute faves. You can't go wrong here.",
    giftCard: {
      provider: 'giftrocker', label: 'Neighborhood Restaurant Group gift card', amount: 30,
      note: "Caruso's is our hope for this one, but the card is good at any Neighborhood Restaurant Group spot: Bluejacket, ChurchKey, The Sovereign, Iron Gate, The Roost, Mallard, and more.",
    },
  },
  {
    id: 'le-diplomate', numeral: 'III', name: 'Le Diplomate', neighborhood: '14th Street', cuisine: 'French brasserie',
    web: 'https://lediplomatedc.com', lat: 38.9114, lng: -77.0320,
    tip: "The quintessential D.C. restaurant. Some call it cliché — I disagree. It's an awesome institution.",
    giftCard: {
      provider: 'cashstar', label: 'STARR Restaurants eGift card', amount: 30,
      note: 'Le Diplomate is our hope for this one, but the card is good at any STARR restaurant, including St. Anselm and Pastis in D.C.',
    },
  },
  {
    id: 'perrys', numeral: 'IV', name: "Perry's", neighborhood: 'Adams Morgan', cuisine: 'Japanese & sushi',
    web: 'https://perrysadamsmorgan.com', lat: 38.9218, lng: -77.0429,
    tip: 'Japanese and sushi, one of my faves — the rooftop is a whole vibe.',
    giftCard: { provider: 'toast', label: "Perry's eGift card", amount: 30 },
  },
];

export const PRESENTED_TO = 'Jack & Anne Twiford';
