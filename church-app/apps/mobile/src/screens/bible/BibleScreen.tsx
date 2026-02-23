import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react-native';
import { useTheme } from '../../lib/useTheme';
import {
  getBooks,
  getChapters,
  getChapterContent,
  BibleBook,
  BibleChapter,
  ChapterContent,
} from '../../services/bibleApi';

// ── Constants ──────────────────────────────────────────────
const NT_FIRST_BOOK = 'MAT';

// Book categories for visual grouping
const OT_CATEGORIES: { label: string; bookIds: string[] }[] = [
  { label: 'Law', bookIds: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'] },
  { label: 'History', bookIds: ['JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'] },
  { label: 'Poetry & Wisdom', bookIds: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG'] },
  { label: 'Major Prophets', bookIds: ['ISA', 'JER', 'LAM', 'EZK', 'DAN'] },
  { label: 'Minor Prophets', bookIds: ['HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'] },
];

const NT_CATEGORIES: { label: string; bookIds: string[] }[] = [
  { label: 'Gospels', bookIds: ['MAT', 'MRK', 'LUK', 'JHN'] },
  { label: 'History', bookIds: ['ACT'] },
  { label: "Paul's Letters", bookIds: ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM'] },
  { label: 'General Letters', bookIds: ['HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'] },
  { label: 'Prophecy', bookIds: ['REV'] },
];

type ViewState = 'books' | 'chapters' | 'reading';

// ── Verse parsing ──────────────────────────────────────────
interface VersePart {
  type: 'number' | 'text';
  value: string;
}

function parseVerses(raw: string): VersePart[] {
  const parts: VersePart[] = [];
  // Match [1], [2], etc. and split around them
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    // Text before this verse number
    if (match.index > lastIndex) {
      const text = raw.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: 'text', value: text + ' ' });
    }
    parts.push({ type: 'number', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  // Remaining text after last verse number
  if (lastIndex < raw.length) {
    const text = raw.slice(lastIndex).trim();
    if (text) parts.push({ type: 'text', value: text });
  }

  return parts;
}

// ── Main Component ─────────────────────────────────────────
export function BibleScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [view, setView] = useState<ViewState>('books');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapterData, setChapterData] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track last read for "Continue Reading"
  const [lastRead, setLastRead] = useState<{
    book: BibleBook;
    chapterId: string;
    reference: string;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // ── Build book lookup map ──
  const bookMap = useMemo(() => {
    const map = new Map<string, BibleBook>();
    books.forEach((b) => map.set(b.id, b));
    return map;
  }, [books]);

  // ── Load books on mount ──
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch {
      setError('Unable to load books. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBookPress = useCallback(async (book: BibleBook) => {
    setSelectedBook(book);
    setLoading(true);
    setError(null);
    try {
      const data = await getChapters(book.id);
      setChapters(data.filter((c) => c.number !== 'intro'));
      setView('chapters');
    } catch {
      setError('Unable to load chapters. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChapterPress = useCallback(
    async (chapter: BibleChapter) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getChapterContent(chapter.id);
        if (!data || !data.content) {
          throw new Error('Chapter content is empty');
        }
        setChapterData(data);
        setView('reading');
        if (selectedBook) {
          setLastRead({
            book: selectedBook,
            chapterId: chapter.id,
            reference: data.reference,
          });
        }
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch (err) {
        console.error('handleChapterPress error:', err);
        setError('Unable to load this chapter. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [selectedBook],
  );

  const handlePrevNext = useCallback(
    async (chapterId: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getChapterContent(chapterId);
        if (!data || !data.content) {
          throw new Error('Chapter content is empty');
        }
        setChapterData(data);
        if (selectedBook) {
          setLastRead({
            book: selectedBook,
            chapterId,
            reference: data.reference,
          });
        }
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch {
        setError('Unable to load chapter. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [selectedBook],
  );

  const handleBack = useCallback(() => {
    if (view === 'reading') {
      setView('chapters');
      setChapterData(null);
    } else if (view === 'chapters') {
      setView('books');
      setSelectedBook(null);
      setChapters([]);
    }
  }, [view]);

  const handleContinueReading = useCallback(async () => {
    if (!lastRead) return;
    setSelectedBook(lastRead.book);
    setLoading(true);
    setError(null);
    try {
      // Load chapters for the book first
      const chapData = await getChapters(lastRead.book.id);
      setChapters(chapData.filter((c) => c.number !== 'intro'));
      // Then load the chapter content
      const content = await getChapterContent(lastRead.chapterId);
      if (!content || !content.content) {
        throw new Error('Chapter content is empty');
      }
      setChapterData(content);
      setView('reading');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch {
      setError('Unable to resume reading. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lastRead]);

  // ── Pre-compute reading view data (must be above all returns) ──
  const verseParts = useMemo(
    () => parseVerses(chapterData?.content ?? ''),
    [chapterData?.content],
  );

  const prevRef = chapterData?.previous
    ? `${selectedBook?.name ?? ''} ${chapterData.previous.number}`
    : null;
  const nextRef = chapterData?.next
    ? `${selectedBook?.name ?? ''} ${chapterData.next.number}`
    : null;

  // ── Shared header ──
  function Header({
    title,
    subtitle,
    showBack,
    rightIcon,
  }: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightIcon?: React.ReactNode;
  }) {
    return (
      <View
        style={{
          backgroundColor: colors.primary,
          paddingTop: insets.top + 8,
          paddingBottom: 18,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBack && (
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={{
                marginRight: 12,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={22} color="#f8fafc" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 28,
                color: '#f8fafc',
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 13,
                  color: colors.accent,
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {rightIcon && (
            <View style={{ marginLeft: 12, opacity: 0.4 }}>{rightIcon}</View>
          )}
        </View>
      </View>
    );
  }

  // ── Error + retry state ──
  if (error && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header
          title={
            view === 'books'
              ? 'Bible'
              : view === 'chapters'
                ? selectedBook?.name ?? 'Bible'
                : chapterData?.reference ?? 'Bible'
          }
          showBack={view !== 'books'}
        />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <RotateCcw size={28} color={colors.mutedForeground} />
          </View>
          <Text
            style={{
              fontFamily: 'OpenSans_600SemiBold',
              fontSize: 17,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 14,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={() => {
              if (view === 'books') loadBooks();
              else if (view === 'chapters' && selectedBook) handleBookPress(selectedBook);
              else if (view === 'reading' && chapterData) handlePrevNext(chapterData.id);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 24,
              ...Platform.select({
                ios: {
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
                android: { elevation: 4 },
              }),
            }}
          >
            <RotateCcw size={16} color="#fff" />
            <Text
              style={{
                fontFamily: 'OpenSans_700Bold',
                fontSize: 15,
                color: '#fff',
                marginLeft: 8,
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // BOOKS VIEW
  // ══════════════════════════════════════════════════════════
  if (view === 'books') {
    // Build categorized list data
    type ListItem =
      | { type: 'testament'; title: string }
      | { type: 'category'; title: string }
      | { type: 'book'; book: BibleBook }
      | { type: 'continueReading' };

    const listData: ListItem[] = [];

    // Continue Reading card
    if (lastRead) {
      listData.push({ type: 'continueReading' });
    }

    // Old Testament
    listData.push({ type: 'testament', title: 'Old Testament' });
    for (const cat of OT_CATEGORIES) {
      listData.push({ type: 'category', title: cat.label });
      for (const bookId of cat.bookIds) {
        const book = bookMap.get(bookId);
        if (book) listData.push({ type: 'book', book });
      }
    }

    // New Testament
    listData.push({ type: 'testament', title: 'New Testament' });
    for (const cat of NT_CATEGORIES) {
      listData.push({ type: 'category', title: cat.label });
      for (const bookId of cat.bookIds) {
        const book = bookMap.get(bookId);
        if (book) listData.push({ type: 'book', book });
      }
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header
          title="Bible"
          subtitle="King James Version"
          rightIcon={<BookOpen size={28} color="#f8fafc" />}
        />
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item, i) => {
              if (item.type === 'testament') return `t-${item.title}`;
              if (item.type === 'category') return `c-${item.title}-${i}`;
              if (item.type === 'book') return item.book.id;
              return 'continue';
            }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: insets.bottom + 96,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              // ── Continue Reading card ──
              if (item.type === 'continueReading' && lastRead) {
                return (
                  <Pressable
                    onPress={handleContinueReading}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 16,
                      padding: 18,
                      marginBottom: 20,
                      marginTop: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      ...Platform.select({
                        ios: {
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.25,
                          shadowRadius: 8,
                        },
                        android: { elevation: 4 },
                      }),
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <BookOpen size={22} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: 'OpenSans_400Regular',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.6)',
                          marginBottom: 2,
                        }}
                      >
                        Continue Reading
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'OpenSans_700Bold',
                          fontSize: 17,
                          color: '#f8fafc',
                        }}
                      >
                        {lastRead.reference}
                      </Text>
                    </View>
                  </Pressable>
                );
              }

              // ── Testament header ──
              if (item.type === 'testament') {
                return (
                  <View
                    style={{
                      marginTop: 24,
                      marginBottom: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 4,
                        height: 24,
                        borderRadius: 2,
                        backgroundColor: colors.accent,
                        marginRight: 10,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: 'PlayfairDisplay_700Bold',
                        fontSize: 20,
                        color: colors.foreground,
                      }}
                    >
                      {item.title}
                    </Text>
                  </View>
                );
              }

              // ── Category sub-header ──
              if (item.type === 'category') {
                return (
                  <Text
                    style={{
                      fontFamily: 'OpenSans_600SemiBold',
                      fontSize: 12,
                      color: colors.accent,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginTop: 18,
                      marginBottom: 8,
                      marginLeft: 4,
                    }}
                  >
                    {item.title}
                  </Text>
                );
              }

              // ── Book row ──
              if (item.type === 'book') {
                return (
                  <Pressable
                    onPress={() => handleBookPress(item.book)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? colors.muted : colors.card,
                      borderRadius: 14,
                      paddingVertical: 15,
                      paddingHorizontal: 16,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.04,
                          shadowRadius: 2,
                        },
                        android: { elevation: 1 },
                      }),
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'OpenSans_700Bold',
                          fontSize: 13,
                          color: colors.accent,
                        }}
                      >
                        {item.book.abbreviation}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: 'OpenSans_600SemiBold',
                          fontSize: 16,
                          color: colors.foreground,
                        }}
                      >
                        {item.book.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: 'OpenSans_400Regular',
                          fontSize: 12,
                          color: colors.mutedForeground,
                          marginTop: 1,
                        }}
                      >
                        {item.book.nameLong}
                      </Text>
                    </View>
                  </Pressable>
                );
              }

              return null;
            }}
          />
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // CHAPTERS VIEW
  // ══════════════════════════════════════════════════════════
  if (view === 'chapters') {
    const COLS = 4;
    const GAP = 10;
    const HORIZONTAL_PAD = 24;
    const cellSize = (screenWidth - HORIZONTAL_PAD * 2 - GAP * (COLS - 1)) / COLS;

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header
          title={selectedBook?.name ?? ''}
          subtitle={`${chapters.length} Chapters`}
          showBack
        />
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: HORIZONTAL_PAD,
              paddingTop: 20,
              paddingBottom: insets.bottom + 96,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: GAP,
            }}
            showsVerticalScrollIndicator={false}
          >
            {chapters.map((ch) => (
              <Pressable
                key={ch.id}
                onPress={() => handleChapterPress(ch)}
                style={({ pressed }) => ({
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: pressed ? colors.accent : colors.card,
                  borderRadius: 16,
                  borderWidth: pressed ? 0 : 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 3,
                    },
                    android: { elevation: 2 },
                  }),
                })}
              >
                <Text
                  style={{
                    fontFamily: 'OpenSans_700Bold',
                    fontSize: 20,
                    color: colors.foreground,
                  }}
                >
                  {ch.number}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════
  // READING VIEW
  // ══════════════════════════════════════════════════════════

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={chapterData?.reference ?? ''} showBack />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Scripture card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingHorizontal: 24,
              paddingVertical: 28,
              borderWidth: 1,
              borderColor: colors.border,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                },
                android: { elevation: 2 },
              }),
            }}
          >
            {/* Chapter title inside card */}
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_700Bold',
                fontSize: 24,
                color: colors.foreground,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {chapterData?.reference}
            </Text>

            {/* Decorative divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  height: 1,
                  flex: 1,
                  backgroundColor: colors.border,
                }}
              />
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.accent,
                  marginHorizontal: 12,
                }}
              />
              <View
                style={{
                  height: 1,
                  flex: 1,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            {/* Verse text with styled numbers */}
            <Text
              style={{
                fontFamily: 'OpenSans_400Regular',
                fontSize: 18,
                lineHeight: 32,
                color: colors.foreground,
              }}
            >
              {verseParts.map((part, i) => {
                if (part.type === 'number') {
                  return (
                    <Text
                      key={i}
                      style={{
                        fontFamily: 'OpenSans_700Bold',
                        fontSize: 12,
                        color: colors.accent,
                        lineHeight: 32,
                      }}
                    >
                      {part.value}{' '}
                    </Text>
                  );
                }
                // Remove pilcrow marks for cleaner display
                const cleaned = part.value.replace(/¶\s*/g, '\n\n');
                return <Text key={i}>{cleaned}</Text>;
              })}
            </Text>
          </View>

          {/* Prev / Next navigation */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 24,
              gap: 12,
            }}
          >
            {chapterData?.previous ? (
              <Pressable
                onPress={() => chapterData?.previous?.id && handlePrevNext(chapterData.previous.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.muted : colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                    },
                    android: { elevation: 1 },
                  }),
                })}
              >
                <ChevronLeft size={18} color={colors.accent} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 11,
                      color: colors.mutedForeground,
                    }}
                  >
                    Previous
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: 'OpenSans_600SemiBold',
                      fontSize: 14,
                      color: colors.foreground,
                    }}
                  >
                    {prevRef}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {chapterData?.next ? (
              <Pressable
                onPress={() => chapterData?.next?.id && handlePrevNext(chapterData.next.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  backgroundColor: pressed ? colors.muted : colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                    },
                    android: { elevation: 1 },
                  }),
                })}
              >
                <View style={{ marginRight: 8, flex: 1, alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontFamily: 'OpenSans_400Regular',
                      fontSize: 11,
                      color: colors.mutedForeground,
                    }}
                  >
                    Next
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: 'OpenSans_600SemiBold',
                      fontSize: 14,
                      color: colors.foreground,
                    }}
                  >
                    {nextRef}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.accent} />
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
