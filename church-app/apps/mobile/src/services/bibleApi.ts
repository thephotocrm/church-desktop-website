const BASE_URL = 'https://rest.api.bible/v1';
const API_KEY = 'Ye6MOVafbPJbYkNkOhKqh';

export const DEFAULT_BIBLE_ID = 'de4e12af7f28f599-02'; // KJV

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'api-key': API_KEY },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`API.Bible ${res.status}: ${path}`, body);
    throw new Error(`API.Bible request failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json.data) {
    console.error('API.Bible returned no data:', path, JSON.stringify(json).slice(0, 200));
    throw new Error('API.Bible returned no data');
  }
  return json.data as T;
}

export interface BibleBook {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
}

export interface BibleChapter {
  id: string;
  number: string;
  reference: string;
}

export interface ChapterContent {
  id: string;
  reference: string;
  content: string;
  next: { id: string; number: string } | null;
  previous: { id: string; number: string } | null;
}

export async function getBooks(
  bibleId: string = DEFAULT_BIBLE_ID,
): Promise<BibleBook[]> {
  return apiFetch<BibleBook[]>(`/bibles/${bibleId}/books`);
}

export async function getChapters(
  bookId: string,
  bibleId: string = DEFAULT_BIBLE_ID,
): Promise<BibleChapter[]> {
  return apiFetch<BibleChapter[]>(
    `/bibles/${bibleId}/books/${bookId}/chapters`,
  );
}

export async function getChapterContent(
  chapterId: string,
  bibleId: string = DEFAULT_BIBLE_ID,
): Promise<ChapterContent> {
  return apiFetch<ChapterContent>(
    `/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-titles=true`,
  );
}

export interface SearchResult {
  query: string;
  verses: { id: string; reference: string; text: string }[];
}

export async function searchBible(
  query: string,
  bibleId: string = DEFAULT_BIBLE_ID,
): Promise<SearchResult> {
  return apiFetch<SearchResult>(
    `/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`,
  );
}
