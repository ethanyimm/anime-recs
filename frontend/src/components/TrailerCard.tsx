import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import type { AnimeCard } from './types';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function TrailerCard({ title, genres, year, synopsis, trailerId }: AnimeCard) {
  return (
    <View style={styles.card}>
      {/* Trailer / Thumbnail */}
      {trailerId && (
        <View style={styles.videoContainer}>
          <YoutubePlayer height={240} play={false} videoId={trailerId} />
        </View>
      )}

      {/* Info Section */}
      <ScrollView style={styles.infoContainer}>
        <Text style={styles.title}>
          {title} {year ? `(${year})` : ''}
        </Text>
        {genres?.length ? (
          <Text style={styles.genres}>{genres.join(', ')}</Text>
        ) : null}
        {synopsis && <Text style={styles.synopsis}>{synopsis}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.card,
    overflow: 'hidden',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  genres: {
    color: colors.textSecondary,
    marginVertical: 4,
    fontSize: 14,
  },
  synopsis: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});