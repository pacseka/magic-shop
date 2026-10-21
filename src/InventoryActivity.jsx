const money = value => new Intl.NumberFormat('hu-HU').format(value);
const signed = value => `${value > 0 ? '+' : ''}${value}`;

function activityTitle(event) {
  if (event.type === 'random') return `Véletlen készlet · ${event.changes.length} tárgy`;
  const change = event.changes[0];
  return `${event.type === 'sale' ? 'Eladás' : 'Készletkorrekció'} · ${change.itemName}`;
}

function activityDetail(event) {
  if (event.type === 'random') return event.changes.map(change => `${change.itemName} ${signed(change.after - change.before)} db`).join(' · ');
  const change = event.changes[0];
  const quantity = `${signed(change.after - change.before)} db`;
  if (event.type === 'sale') return `${quantity} · ${money(event.unitPrice)} gp/db · összesen ${money(event.totalPrice)} gp`;
  return `${quantity}${event.reason ? ` · ${event.reason}` : ''}`;
}

export function ActivityJournal({ shop, canUndo, onUndo }) {
  const activity = [...(shop.activity ?? [])].reverse();
  return <div className="activity-journal">
    <p className="dialog-intro">{shop.name} eladásai és készletváltozásai. A legutóbbi műveletet visszavonhatod.</p>
    {activity.length ? <div className="activity-list">{activity.map(event => <article className={`activity-entry ${event.undoneAt ? 'is-undone' : ''}`} key={event.id}>
      <div><strong>{activityTitle(event)}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString('hu-HU')}</time></div>
      <p>{activityDetail(event)}</p>
      {event.undoneAt && <small>Visszavonva</small>}
    </article>)}</div> : <p className="empty-results">Ebben a boltban még nincs naplózott művelet.</p>}
    <div className="dialog-actions"><button className="button button-secondary" onClick={onUndo} disabled={!canUndo}>Utolsó művelet visszavonása</button></div>
  </div>;
}
