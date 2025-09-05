import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  ActivityIndicator
} from 'react-native';
import SwipeDeck, { AnimeCard } from '../components/SwipeDeck';

export default function FeedScreen() {
  const [seedTitle, setSeedTitle] = useState('Demon Slayer');
  const [input, setInput] = useState('Demon Slayer');
  const [cards, setCards] = useState<AnimeCard[]>([]);
  const [watchlist, setWatchlist] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRecommendations(title: string) {
    setLoading(true);
    try {
      const recs = await fetch(
        `http://localhost:4000/api/recommendations?title=${encodeURIComponent(
          title
        )}`
      ).then((res) => res.json());

      const withTrailers: AnimeCard[] = await Promise.all(
        recs.items.map(async (item: AnimeCard) => {
          const trailerRes = await fetch(
            `http://localhost:4000/api/trailer?title=${encodeURIComponent(
              item.title
            )}`
          ).then((res) => res.json());
          return { ...item, trailerId: trailerRes.trailerId };
        })
      );

      setCards(withTrailers);
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

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Enter an anime title"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 8,
          marginBottom: 8,
          borderRadius: 6
        }}
      />
      <Button
        title="Search"
        onPress={() => {
          setSeedTitle(input);
          loadRecommendations(input);
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <SwipeDeck
          cards={cards}
          onSave={(anime) => {
            setWatchlist((prev) => [...prev, anime]);
            console.log('📌 Saved to watchlist:', anime.title);
          }}
        />
      )}
    </View>
  );
}