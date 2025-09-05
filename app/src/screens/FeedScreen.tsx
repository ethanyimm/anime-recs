import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, ActivityIndicator, ToastAndroid, Text } from 'react-native';
import SwipeDeck from '../components/SwipeDeck';
import type { AnimeCard } from '../components/types';
import { API_BASE_URL } from '../config';
import { Link } from 'expo-router';


export default function FeedScreen() {
  const [seedTitle, setSeedTitle] = useState('Demon Slayer');
  const [input, setInput] = useState('Demon Slayer');
  const [cards, setCards] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRecommendations(title: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations?title=${encodeURIComponent(title)}`);
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
    loadRecommendations(seedTitle);
  }, []);

  async function like(anime: AnimeCard) {
    try {
      await fetch(`${API_BASE_URL}/api/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anime),
      });
      ToastAndroid.show(`❤️ Liked ${anime.title}`, ToastAndroid.SHORT);
    } catch (e) {
      console.error(e);
    }
  }

  async function watched(anime: AnimeCard) {
    try {
      await fetch(`${API_BASE_URL}/api/watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: anime.id, title: anime.title }),
      });
      ToastAndroid.show(`👀 Marked watched: ${anime.title}`, ToastAndroid.SHORT);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Enter an anime title"
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 6 }}
        />
        <Button
          title="Search"
          onPress={() => {
            setSeedTitle(input);
            loadRecommendations(input);
          }}
        />
      </View>

    <Link href="./(tabs)/liked" asChild>
      <Text>View Liked →</Text>
    </Link>


      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : cards.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No recommendations found. Try another title.</Text>
      ) : (
        <SwipeDeck
          cards={cards}
          onLike={like}
          onWatched={watched}
          onSkip={() => {}}
          onSave={(anime) => ToastAndroid.show(`📌 Saved ${anime.title}`, ToastAndroid.SHORT)}
        />
      )}
    </View>
  );
}