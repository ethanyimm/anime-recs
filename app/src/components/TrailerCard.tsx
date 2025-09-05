import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import type { AnimeCard } from './types';

export default function TrailerCard({ title, genres, year, synopsis, trailerId }: AnimeCard) {
  return (
    <View style={{ flex: 0.75, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', elevation: 5 }}>
      {trailerId && <YoutubePlayer height={220} play={false} videoId={trailerId} />}
      <ScrollView style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>
          {title} {year ? `(${year})` : ''}
        </Text>
        {genres?.length ? (
          <Text style={{ color: '#666', marginVertical: 4 }}>{genres.join(', ')}</Text>
        ) : null}
        {synopsis && <Text style={{ marginTop: 8, fontSize: 14, color: '#333' }}>{synopsis}</Text>}
      </ScrollView>
    </View>
  );
}
