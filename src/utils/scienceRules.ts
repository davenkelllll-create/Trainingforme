/**
 * Evidence-based training science tips
 * Sources: ACSM Guidelines, Seiler 80/20 principle,
 * Selye's stress-adaptation model, Borg RPE scale
 */

export const SCIENCE_TIPS = [
  {
    category: 'run',
    tip: '80/20-Regel: 80% deiner Läufe sollten im leichten Bereich (Zone 1-2) stattfinden. Nur 20% intensiv. Das maximiert Ausdauergewinne und minimiert Verletzungsrisiko. (Seiler, 2010)',
  },
  {
    category: 'run',
    tip: 'Laufe mindestens einen langen Lauf pro Woche mit niedriger Intensität. Ein wöchentlicher Long Run von 25-30% des Wochenvolumens verbessert die aerobe Basis signifikant. (Noakes, 2002)',
  },
  {
    category: 'run',
    tip: 'Steigere dein Wochenvolumen nicht um mehr als 10% pro Woche – das ist die wissenschaftlich belegte Grenze zur Verletzungsprävention. (Nielsen et al., 2012)',
  },
  {
    category: 'ride',
    tip: 'Fahre 2-3x pro Woche im Sweet Spot (88-93% FTP). Diese Zone bietet das beste Verhältnis von Trainingsreiz zu Erholung für Ausdauerverbesserungen. (Allen & Coggan, 2010)',
  },
  {
    category: 'ride',
    tip: 'Eine optimale Trittfrequenz von 80-100 RPM reduziert Muskelermüdung und schont die Kniegelenke im Vergleich zu schweren Gängen mit niedrigerer Kadenz. (Lucia et al., 2001)',
  },
  {
    category: 'strength',
    tip: 'Progressive Überlastung ist das Kernprinzip für Hypertrophie. Steigere entweder Gewicht, Wiederholungen oder Sätze von Woche zu Woche. (Schoenfeld, 2010)',
  },
  {
    category: 'strength',
    tip: 'Für maximale Muskelhypertrophie sind 3-5 Sätze pro Übung mit 6-12 Wiederholungen optimal. Führe 10-20 harte Sätze pro Muskelgruppe pro Woche durch. (Schoenfeld, 2017)',
  },
  {
    category: 'strength',
    tip: 'Trainiere jede Muskelgruppe 2x pro Woche. Höhere Frequenz führt zu mehr Proteinsynthese-Zyklen und damit zu schnellerem Muskelaufbau. (Schoenfeld et al., 2016)',
  },
  {
    category: 'hike',
    tip: 'Nutze Wanderstöcke bei Aufstiegen von mehr als 500 Höhenmetern – sie reduzieren die Kniebelastung beim Abstieg um bis zu 25%. (Schwameder et al., 1999)',
  },
  {
    category: 'general',
    tip: 'Schlaf ist der wichtigste Erholungsfaktor. 7-9 Stunden Schlaf fördern Muskelreparatur, Hormonsynthese (GH, IGF-1) und reduzieren das Verletzungsrisiko um 68%. (Milewski et al., 2014)',
  },
  {
    category: 'general',
    tip: 'Eiweiß-Timing: Konsumiere 20-40g Protein innerhalb von 2h nach dem Training. Leucin-reiche Quellen (Whey, Eier, Quark) stimulieren die Muskelproteinsynthese optimal. (Phillips, 2014)',
  },
  {
    category: 'general',
    tip: 'Superkompensation: Der Körper wird nach 36-72h Erholung stärker als vor dem Training. Zu früh trainieren verhindert diesen Effekt. (Selye, 1956)',
  },
  {
    category: 'general',
    tip: 'Dehydrierung von nur 2% der Körpermasse kann die sportliche Leistung um 10-20% senken. Trinke 400-600ml pro Stunde Training. (ACSM, 2007)',
  },
  {
    category: 'general',
    tip: 'Kälte-Wärme-Kontraste (Kalt-Warm-Wechselduschen) nach intensiven Einheiten können die Laktat-Clearance beschleunigen und DOMS (Muskelkater) reduzieren. (Versey et al., 2013)',
  },
]

export function getDailyTip(activityType?: string): string {
  const dayOfYear = Math.floor(Date.now() / 86400000)
  const relevant = SCIENCE_TIPS.filter(
    t => t.category === activityType || t.category === 'general'
  )
  return relevant[dayOfYear % relevant.length].tip
}

export function getOvertrainingWarning(hardSessionsThisWeek: number): string | null {
  if (hardSessionsThisWeek >= 4) {
    return 'Du hast diese Woche bereits 4+ intensive Einheiten absolviert. Wissenschaftlich empfohlen sind max. 2-3 harte Sessions/Woche, um Übertraining zu vermeiden.'
  }
  return null
}

export function getRecoveryMessage(trimp: number): { hours: number; message: string } {
  if (trimp < 30) return { hours: 12, message: 'Leichte Einheit – du kannst morgen wieder trainieren.' }
  if (trimp < 60) return { hours: 24, message: 'Moderate Belastung – 24h Erholung empfohlen.' }
  if (trimp < 100) return { hours: 36, message: 'Intensives Training – gönne dir 36h Erholung für optimale Superkompensation.' }
  return { hours: 48, message: 'Sehr hohe Belastung – mindestens 48h Ruhe für vollständige Erholung.' }
}
