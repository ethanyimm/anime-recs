import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Text,
  StyleSheet,
} from 'react-native';
import SwipeDeck from '../components/SwipeDeck';
import type { AnimeCard } from '../components/types';
import { BASE_URL } from '../config';
import { Link } from 'expo-router';
import { colors } from '@/constants/theme';

export default function FeedScreen() {
  const [input, setInput] = useState('');
  const [cards, setCards] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRecommendations(title?: string) {
    setLoading(true);
    try {
      const url = title
        ? `${BASE_URL}/api/recommendations?title=${encodeURIComponent(title)}`
        : `${BASE_URL}/api/recommendations`;
      const res = await fetch(url);
      const json = await res.json();
      setCards(json.items || []);
    } catch (err) {
      console.error('❌ Failed to load recommendations:', err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // FYP mode if search is empty
    if (!input.trim()) {
      loadRecommendations();
    }
  }, []);

  async function like(anime: AnimeCard) {
    try {
      await fetch(`${BASE_URL}/api/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anime),
      });
      ToastAndroid.show(`❤️ Liked ${anime.title}`, ToastAndroid.SHORT);
    } catch (e) {
      console.error(e);
    }
  }

  async function dislike(anime: AnimeCard) {
    try {
      await fetch(`${BASE_URL}/api/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: anime.id, title: anime.title }),
      });
      ToastAndroid.show(`👎 Disliked ${anime.title}`, ToastAndroid.SHORT);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Search anime..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            if (input.trim()) {
              loadRecommendations(input);
            } else {
              loadRecommendations(); // FYP mode
            }
          }}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* View Liked Button */}
      <Link href="./(tabs)/liked" asChild>
        <TouchableOpacity style={styles.likedButton}>
          <Text style={styles.likedButtonText}>❤️ View Liked</Text>
        </TouchableOpacity>
      </Link>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : cards.length === 0 ? (
        <Text style={styles.emptyText}>
          No recommendations found. Try another title.
        </Text>
      ) : (
        <SwipeDeck
          cards={cards}
          onLike={like}
          onDislike={dislike}
          onSkip={() => {}}
          onSave={(anime) =>
            ToastAndroid.show(`📌 Saved ${anime.title}`, ToastAndroid.SHORT)
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },
  searchButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  likedButton: {
    backgroundColor: '#ff6b81',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  likedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textSecondary,
    fontSize: 16,
  },
});