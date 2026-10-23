import { useMemo, useRef, useState } from 'react';
import { BookOpen, MagnifyingGlass, X } from '@phosphor-icons/react';
import { guideSections } from './guideContent.js';
import { APP_VERSION } from './appVersion.js';

const searchable = value => value.toLocaleLowerCase('hu-HU').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const topicText = topic => [topic.title, topic.text, ...(topic.steps ?? []), topic.note ?? '', ...(topic.table?.headers ?? []), ...(topic.table?.rows ?? []).flat()].join(' ');

export function UserGuide({ onClose }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(guideSections[0].id);
  const searchRef = useRef(null);
  const contentRef = useRef(null);
  const needle = searchable(query.trim());
  const visibleSections = useMemo(() => guideSections.map(section => {
    if (!needle || searchable(`${section.title} ${section.summary}`).includes(needle)) return section;
    const topics = section.topics.filter(topic => searchable(topicText(topic)).includes(needle));
    return topics.length ? { ...section, topics } : null;
  }).filter(Boolean), [needle]);
  const activeId = visibleSections.some(section => section.id === selectedId) ? selectedId : visibleSections[0]?.id;

  function changeQuery(value) {
    setQuery(value);
    setSelectedId(guideSections[0].id);
    contentRef.current?.scrollTo({ top: 0 });
  }

  function jumpTo(id) {
    setSelectedId(id);
    contentRef.current?.querySelector(`#guide-${id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  return <div className="user-guide">
    <header className="guide-header">
      <span className="guide-kicker"><BookOpen size={19} aria-hidden="true" /> Hacsi's magic shops <span className="guide-version">v{APP_VERSION}</span></span>
      <h2 id="guide-title">Útmutató</h2>
      <p>Rövid segítség a bolt előkészítéséhez és a játék közbeni műveletekhez.</p>
      <button type="button" className="guide-close" aria-label="Útmutató bezárása" onClick={onClose}><X size={26} /></button>
    </header>
    <div className="guide-search"><MagnifyingGlass size={22} aria-hidden="true" /><input ref={searchRef} autoFocus type="search" aria-label="Keresés az útmutatóban" placeholder="Keress témára vagy műveletre…" value={query} onChange={event => changeQuery(event.target.value)} />{query && <button type="button" onClick={() => { changeQuery(''); searchRef.current?.focus(); }}>Törlés</button>}</div>
    <div className={`guide-layout ${visibleSections.length ? '' : 'is-empty'}`}>
      <nav className="guide-nav" aria-label="Útmutató fejezetei">
        {visibleSections.map(section => <button type="button" key={section.id} className={section.id === activeId ? 'is-active' : ''} aria-current={section.id === activeId ? 'location' : undefined} onClick={() => jumpTo(section.id)}><span>{String(guideSections.findIndex(entry => entry.id === section.id) + 1).padStart(2, '0')}</span>{section.title}</button>)}
      </nav>
      <div ref={contentRef} className="guide-content" tabIndex={0} aria-label="Útmutató tartalma">
        {visibleSections.length ? visibleSections.map(section => <section id={`guide-${section.id}`} className="guide-section" key={section.id}>
          <div className="guide-section-heading"><span>{String(guideSections.findIndex(entry => entry.id === section.id) + 1).padStart(2, '0')}</span><div><h3>{section.title}</h3><p>{section.summary}</p></div></div>
          {section.topics.map(topic => <article className="guide-topic" key={topic.title}><h4>{topic.title}</h4><p>{topic.text}</p>{topic.steps && <ol>{topic.steps.map(step => <li key={step}>{step}</li>)}</ol>}{topic.table && <div className="guide-table-wrap"><table className={`guide-table guide-table-${topic.table.headers.length}`} aria-label={topic.title}><thead><tr>{topic.table.headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{topic.table.rows.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th>{row.slice(1).map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>}{topic.note && <aside className="guide-note">{topic.note}</aside>}</article>)}
        </section>) : <p className="guide-no-results" role="status">Nincs találat. Próbálj másik kifejezést, például „ár”, „készlet” vagy „felhő”.</p>}
      </div>
    </div>
  </div>;
}
