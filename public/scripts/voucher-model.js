// Pure view-model for the voucher panel. No DOM here so it can be unit tested.

const PROVIDER_COPY = {
  toast: 'Show the code and PIN at the register, or add the card to your phone wallet.',
  cashstar: 'Open the eGift card and show the barcode when you pay.',
  giftrocker: 'Show the QR code from the PDF or your Apple Wallet pass when you check out.',
};

const FINE_PRINT = 'Show this gift card when you arrive. One redemption per table.';

function formatAmount(amount) {
  return `$${Number(amount).toFixed(0)}`;
}

function fieldsFor(secrets) {
  switch (secrets.kind) {
    case 'toast':
      return [
        { label: 'Gift card code', value: secrets.code },
        { label: 'PIN', value: secrets.pin },
      ];
    case 'giftrocker':
      return [{ label: 'Reference', value: secrets.reference }];
    case 'cashstar':
    default:
      return [];
  }
}

function linksFor(secrets) {
  const links = [];
  if (secrets.view) links.push({ label: 'Open eGift card', href: secrets.view, primary: true });
  if (secrets.appleWallet) links.push({ label: 'Add to Apple Wallet', href: secrets.appleWallet, primary: !secrets.view });
  if (secrets.googleWallet) links.push({ label: 'Add to Google Wallet', href: secrets.googleWallet, primary: false });
  if (secrets.balance) links.push({ label: 'Check balance', href: secrets.balance, primary: false });
  return links;
}

/**
 * @param {object} restaurant  entry from RESTAURANTS
 * @param {{status: 'loading'|'error'|'ready', byId?: object}} cards  gift card fetch state
 */
export function buildVoucherView(restaurant, cards) {
  if (!restaurant) throw new TypeError('restaurant is required');
  if (!cards || !['loading', 'error', 'ready'].includes(cards.status)) throw new TypeError('cards.status must be loading, error, or ready');

  const base = {
    id: restaurant.id,
    numeral: restaurant.numeral,
    name: restaurant.name,
    neighborhood: restaurant.neighborhood,
    cuisine: restaurant.cuisine,
    tip: restaurant.tip,
    webHref: restaurant.web,
    fine: FINE_PRINT,
  };

  if (!restaurant.giftCard) throw new TypeError(`${restaurant.id} has no giftCard metadata`);

  const { provider, label, amount, note } = restaurant.giftCard;
  const card = { provider, label, amount: formatAmount(amount), howTo: PROVIDER_COPY[provider] ?? '', note: note ?? '' };

  if (cards.status !== 'ready') return { ...base, card: { ...card, status: cards.status } };

  const secrets = cards.byId && cards.byId[restaurant.id];
  if (!secrets) return { ...base, card: { ...card, status: 'missing' } };
  if (secrets.kind !== provider) {
    throw new Error(`Gift card entry for ${restaurant.id} is kind "${secrets.kind}" but the restaurant expects "${provider}".`);
  }
  return { ...base, card: { ...card, status: 'ready', fields: fieldsFor(secrets), links: linksFor(secrets) } };
}
