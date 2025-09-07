import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { BASE_URL } from '@/src/config';
import { colors } from '@/constants/theme';
import type { AnimeCard } from '@/src/components/types';

const { width } = Dimensions.get('window');

export default function LikedScreen() {
  const [liked, setLiked] = useState<AnimeCard[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/liked`)
      .then(res => res.json())
      .then(data => {
        // Sort so most recent liked is first
        const sorted = (data.items || []).sort(
          (a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime()
        );
        setLiked(sorted);
      })
      .catch(err => console.error('Failed to fetch liked anime:', err));
  }, []);

  const renderItem = ({ item }: { item: AnimeCard }) => (
    <View style={styles.card}>
      {item.trailerId && (
        <YoutubePlayer
          height={220}
          play={false}
          videoId={item.trailerId}
          webViewStyle={{ opacity: 0.99 }} // fixes some Android rendering quirks
        />
      )}
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );

  return (
    <FlatList
      data={liked}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: colors.background,
  },
  card: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: colors.card,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    padding: 12,
    textAlign: 'center',
  },
});