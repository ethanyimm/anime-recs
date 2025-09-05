import React from 'react';
import { View, Text } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import type { AnimeCard } from './SwipeDeck';

export default function TrailerCard({
  title,
  genres,
  year,
  synopsis,
  trailerId
}: AnimeCard) {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        {title} {year ? `(${year})` : ''}
      </Text>
      {genres?.length ? (
        <Text style={{ color: '#666', marginBottom: 4 }}>
          {genres.join(', ')}
        </Text>
      ) : null}
      {trailerId && (
        <YoutubePlayer height={200} play={false} videoId={trailerId} />
      )}
      {synopsis && (
        <View
          style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: '#f0f0f0',
            borderRadius: 6
          }}
        >
          <Text style={{ fontWeight: '600' }}>
            Why this was recommended:
          </Text>
          <Text style={{ marginTop: 4 }}>{synopsis}</Text>
        </View>
      )}
    </View>
  );
}