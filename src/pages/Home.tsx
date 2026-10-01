import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { add, copyOutline, star, starOutline, trashOutline } from 'ionicons/icons';
import React, { useMemo, useState } from 'react';
import {
  type Snippet,
  LANGUAGES,
  detectLanguage,
  languageCounts,
  searchSnippets,
  tagCounts,
  validateSnippet,
} from '../lib/snippets';
import { type SnippetDraft, copyText, useSnippets } from '../state/SnippetsContext';

const EMPTY: SnippetDraft = { title: '', code: '', language: '', tags: '' };

/** IonChip is click-only; this makes filter chips focusable and keyboard-operable. */
const FilterChip: React.FC<{ pressed: boolean; label: string; onToggle: () => void; children: React.ReactNode }> = ({
  pressed,
  label,
  onToggle,
  children,
}) => (
  <IonChip
    aria-label={label}
    aria-pressed={pressed}
    onClick={onToggle}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    }}
    outline={!pressed}
    role="button"
    tabIndex={0}
  >
    {children}
  </IonChip>
);

const Home: React.FC = () => {
  const { snippets, save, remove, toggleFavorite } = useSnippets();
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; draft: SnippetDraft } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const results = useMemo(
    () => searchSnippets(snippets, { text, language, tag, favoritesOnly }),
    [snippets, text, language, tag, favoritesOnly],
  );
  const languages = useMemo(() => languageCounts(snippets), [snippets]);
  const tags = useMemo(() => tagCounts(snippets), [snippets]);

  const open = (s?: Snippet) => {
    setError(null);
    setEditing(
      s ? { id: s.id, draft: { title: s.title, code: s.code, language: s.language, tags: s.tags.join(', ') } } : { draft: EMPTY },
    );
  };

  const submit = () => {
    if (!editing) return;
    const problem = validateSnippet(editing.draft.title, editing.draft.code);
    if (problem) {
      setError(problem);
      return;
    }
    save(editing.draft, editing.id);
    setEditing(null);
  };

  const copy = async (s: Snippet) => setToast((await copyText(s.code)) ? `Copied “${s.title}”` : 'Copy failed');

  const draft = editing?.draft;
  const setDraft = (patch: Partial<SnippetDraft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Snippets</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar value={text} onIonInput={(e) => setText(e.detail.value ?? '')} placeholder="Search title, tags, code" />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding-horizontal" role="group" aria-label="Filters">
          <FilterChip label="Favourites only" pressed={favoritesOnly} onToggle={() => setFavoritesOnly((v) => !v)}>
            <IonIcon icon={star} />
            <IonLabel>Favourites</IonLabel>
          </FilterChip>
          {languages.map(([lang, count]) => (
            <FilterChip
              key={lang}
              label={`Language ${lang}, ${count}`}
              pressed={language === lang}
              onToggle={() => setLanguage(language === lang ? null : lang)}
            >
              <IonLabel>
                {lang} ({count})
              </IonLabel>
            </FilterChip>
          ))}
          {tags.map(([t, count]) => (
            <FilterChip key={`tag-${t}`} label={`Tag ${t}, ${count}`} pressed={tag === t} onToggle={() => setTag(tag === t ? null : t)}>
              <IonLabel>
                #{t} ({count})
              </IonLabel>
            </FilterChip>
          ))}
        </div>

        <IonList>
          {results.map((s) => (
            <IonItem key={s.id} button detail={false} onClick={() => open(s)}>
              <IonLabel>
                <h2>{s.title}</h2>
                <p>
                  <code>{s.code.split('\n')[0]}</code>
                </p>
                <IonNote>
                  {s.language}
                  {s.tags.length > 0 && ` · #${s.tags.join(' #')}`}
                </IonNote>
              </IonLabel>
              <IonButtons slot="end">
                <IonButton
                  aria-label={s.favorite ? `Unfavourite ${s.title}` : `Favourite ${s.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(s.id);
                  }}
                >
                  <IonIcon slot="icon-only" icon={s.favorite ? star : starOutline} />
                </IonButton>
                <IonButton
                  aria-label={`Copy code of ${s.title}`}

                  onClick={(e) => {
                    e.stopPropagation();
                    void copy(s);
                  }}
                >
                  <IonIcon slot="icon-only" icon={copyOutline} />
                </IonButton>
              </IonButtons>
            </IonItem>
          ))}
        </IonList>
        {results.length === 0 && (
          <p className="ion-padding ion-text-center">
            {snippets.length ? 'No snippets match your search.' : 'No snippets yet — tap + to save your first one.'}
          </p>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => open()} aria-label="New snippet">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={editing !== null} onDidDismiss={() => setEditing(null)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setEditing(null)}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>{editing?.id ? 'Edit snippet' : 'New snippet'}</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={submit}>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          {draft && (
            <IonContent className="ion-padding">
              <IonInput label="Title" labelPlacement="stacked" value={draft.title} onIonInput={(e) => setDraft({ title: e.detail.value ?? '' })} />
              <IonTextarea
                label="Code"
                labelPlacement="stacked"
                autoGrow
                rows={6}
                spellcheck={false}
                autocapitalize="off"
                style={{ fontFamily: 'monospace' }}
                value={draft.code}
                onIonInput={(e) => setDraft({ code: e.detail.value ?? '' })}
              />
              <IonSelect
                label="Language"
                labelPlacement="stacked"
                value={draft.language}
                onIonChange={(e) => setDraft({ language: e.detail.value })}
              >
                <IonSelectOption value="">Auto-detect ({detectLanguage(draft.code)})</IonSelectOption>
                {LANGUAGES.map((l) => (
                  <IonSelectOption key={l} value={l}>
                    {l}
                  </IonSelectOption>
                ))}
              </IonSelect>
              <IonInput
                label="Tags (comma or space separated)"
                labelPlacement="stacked"
                value={draft.tags}
                onIonInput={(e) => setDraft({ tags: e.detail.value ?? '' })}
              />
              {error && (
                <p role="alert" style={{ color: 'var(--ion-color-danger)' }}>
                  {error}
                </p>
              )}
              {editing?.id && (
                <IonButton
                  color="danger"
                  fill="clear"
                  expand="block"
                  onClick={() => {
                    remove(editing.id!);
                    setEditing(null);
                  }}
                >
                  <IonIcon slot="start" icon={trashOutline} />
                  Delete snippet
                </IonButton>
              )}
            </IonContent>
          )}
        </IonModal>

        <IonToast isOpen={toast !== null} message={toast ?? ''} duration={1500} onDidDismiss={() => setToast(null)} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
