import test from 'node:test';
import assert from 'node:assert/strict';
import { guideSections } from '../src/guideContent.js';
import { procurementChance, procurementQuote, procurementTime, settlements } from '../src/procurement.js';

const topics = guideSections.find(section => section.id === 'keszlet').topics;
const tableFor = title => topics.find(topic => topic.title === title).table;

test('the offline guide uses the same procurement chance and time rules as the app', () => {
  const availability = tableFor('Beszerezhetőség településméret szerint');
  const rarities = availability.headers.slice(1);
  assert.deepEqual(availability.rows.map(row => row[0]), settlements.map(settlement => settlement.label));
  availability.rows.forEach((row, settlementIndex) => {
    rarities.forEach((rarity, rarityIndex) => {
      assert.equal(row[rarityIndex + 1], `${procurementChance(rarity, settlements[settlementIndex].id)}%`);
    });
  });

  const time = tableFor('Beszerzési idő');
  time.rows.forEach(([rarity, formula]) => {
    assert.equal(formula, procurementTime(rarity, () => 0).formula);
  });
});

test('the guide surcharge table agrees with every d6 quote result', () => {
  const surcharge = tableFor('Beszerzési felár és ajánlati ár');
  const shop = { multiplier: 1, settlementSize: 'city', magicPrevalence: 'normal' };
  for (let roll = 1; roll <= 6; roll += 1) {
    const item = { rarity: 'Gyakori', price: 100 };
    const draws = [0, (roll - 1) / 6, 0];
    const quote = procurementQuote(item, shop, {}, () => draws.shift());
    const row = surcharge.rows.find(([range]) => range === '2–3' ? roll === 2 || roll === 3 : Number(range) === roll);
    assert.equal(quote.markupRoll, roll);
    assert.equal(row[1], `+${quote.markupPercent}%`);
    assert.equal(row[2], quote.markupReason);
  }
});
