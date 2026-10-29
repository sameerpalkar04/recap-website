interface SeasonSection {
  title: string;
  points: string[];
}

function parseSections(text: string): SeasonSection[] {
  const sections: SeasonSection[] = [];
  let current: SeasonSection | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine
      .replace(/^\s*#{1,6}\s*/, '')
      .replace(/\*\*/g, '')
      .trim();
    if (!line || /^[-*_]{3,}$/.test(line)) continue;

    const season = line.match(/^season\s+(\d+)\b/i);
    if (season) {
      current = { title: `Season ${season[1]}`, points: [] };
      sections.push(current);
      continue;
    }

    const point = line.replace(/^(?:[-*•]|\d+[.)])\s+/, '').trim();
    if (!current) continue;
    current.points.push(point);
  }

  if (!sections.length) {
    const fallback = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (fallback.length) sections.push({ title: 'Story so far', points: fallback });
  }

  return sections
    .map((section) => ({ ...section, points: section.points.slice(0, 10) }))
    .filter((section) => section.points.length > 0);
}

export default function SeasonRecap({ text, throughSeason, throughEpisode }: { text: string; throughSeason?: number; throughEpisode?: number }) {
  const sections = parseSections(text);

  return (
    <div className="season-recap-list">
      {sections.map((section) => (
        <section className="season-recap" key={section.title}>
          <h4>
            {section.title}
            {section.title === 'Season ' + throughSeason && throughEpisode
              ? <span className="season-recap-range">Episodes 1–{throughEpisode}</span>
              : null}
          </h4>
          <ol>
            {section.points.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}
          </ol>
        </section>
      ))}
    </div>
  );
}
