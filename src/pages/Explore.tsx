import { IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToast, IonToolbar } from '@ionic/react';
import React, { useState } from 'react';
import { languageCounts, toMarkdown } from '../lib/snippets';
import { copyText, useSnippets } from '../state/SnippetsContext';

const Explore: React.FC = () => {
  const { snippets } = useSnippets();
  const [toast, setToast] = useState<string | null>(null);
  const tagCounts = new Map<string, number>();
  for (const s of snippets) for (const t of s.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);

  const exportAll = async () => {
    const md = snippets.map(toMarkdown).join('\n');
    setToast((await copyText(md)) ? `Copied ${snippets.length} snippets as Markdown` : 'Copy failed');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Library</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>{snippets.length} snippets</h2>
        <IonList inset aria-label="Languages">
          {languageCounts(snippets).map(([lang, count]) => (
            <IonItem key={lang}>
              <IonLabel>{lang}</IonLabel>
              <IonNote slot="end">{count}</IonNote>
            </IonItem>
          ))}
        </IonList>
        {tagCounts.size > 0 && (
          <p>
            Tags:{' '}
            {[...tagCounts.entries()]
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .map(([t, n]) => `#${t} (${n})`)
              .join('  ')}
          </p>
        )}
        <IonButton expand="block" disabled={snippets.length === 0} onClick={() => void exportAll()}>
          Copy all as Markdown
        </IonButton>
        <IonToast isOpen={toast !== null} message={toast ?? ''} duration={1500} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};
export default Explore;
