export function bargainSuccessPercent(response, rollTotal, dc) {
  if (response === 'willing') return 5;
  if (response !== 'hesitant' || rollTotal === '' || rollTotal == null || dc === '' || dc == null) return 0;
  const total = Number(rollTotal);
  const target = Number(dc);
  if (!Number.isFinite(total) || !Number.isFinite(target) || total < target) return 0;
  const margin = total - target;
  if (margin >= 10) return 15;
  if (margin >= 5) return 10;
  return 5;
}

export function suggestedBargainPrice(openingOffer, percent, direction) {
  if (openingOffer === '' || openingOffer == null || !Number.isFinite(Number(openingOffer)) || Number(openingOffer) < 0) return '';
  const factor = direction === 'sell' ? 1 - percent / 100 : 1 + percent / 100;
  return Math.max(0, Math.round(Number(openingOffer) * factor));
}
