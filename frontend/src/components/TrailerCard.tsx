import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Volume2, VolumeX } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { AnimeCard } from './types';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round((width * 9) / 16); // true 16:9 ratio

type Props = AnimeCard & {
  isActive?: boolean;
  autoplayMuted?: boolean;
};

export default function TrailerCard({
  title,
  genres,
  year,
  trailerId,
  isActive = false,
  autoplayMuted = true,
}: Props) {
  const [muted, setMuted] = useState(autoplayMuted);
  const [showIcon, setShowIcon] = useState(false);

  useEffect(() => {
    setShowIcon(isActive);
  }, [isActive]);

  return (
    <View style={styles.card}>
      {/* Video */}
      {trailerId ? (
        <Pressable onPress={() => setMuted((m) => !m)}>
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={VIDEO_HEIGHT}
              width={width}
              play={isActive}
              mute={muted}
              videoId={trailerId}
              webViewStyle={{ opacity: 0.99 }}
            />
            {showIcon && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.muteIcon}>
                {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
              </Animated.View>
            )}
          </View>
        </Pressable>
      ) : (
        <View style={[styles.videoContainer, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#fff' }}>No trailer</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          {title} {year ? `(${year})` : ''}
        </Text>
        {!!genres?.length && <Text style={styles.genres}>{genres.join(', ')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  videoContainer: {
    backgroundColor: '#000',
    position: 'relative',
  },
  muteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 18,
    padding: 6,
  },
  infoContainer: {
    height: 70, // matches INFO_HEIGHT in SwipeDeck
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  genres: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
