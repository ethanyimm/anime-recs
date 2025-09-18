import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Volume2, VolumeX } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { AnimeCard } from './types';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
// Adjust height calculation for web to prevent cutoff but still fill screen properly
const VIDEO_HEIGHT = Platform.OS === 'web' 
  ? Math.min(Math.round((width * 9) / 16), height * 0.6) // Limit to 60% of screen height on web
  : Math.round((width * 9) / 16); // Normal calculation for mobile

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
    <View style={styles.container}>
      {/* Spacer to push content down */}
      <View style={styles.topSpacer} />
      
      {/* Video Section - Takes up most of the space */}
      <View style={styles.videoSection}>
        {trailerId ? (
          <Pressable onPress={() => setMuted((m) => !m)} style={styles.videoPressable}>
            <View style={styles.videoContainer}>
              <YoutubePlayer
                height={VIDEO_HEIGHT}
                width={width}
                play={isActive}
                mute={muted}
                videoId={trailerId}
                webViewStyle={{ 
                  opacity: 0.99,
                  // Force proper sizing and remove scroll bars
                  height: VIDEO_HEIGHT,
                  width: width,
                  overflow: 'hidden',
                  border: 'none',
                  outline: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                allowsFullscreenVideo={false}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                // Additional props to control video behavior
                initialPlayerParams={{
                  controls: 1, // Show controls
                  modestbranding: 1, // Remove YouTube branding
                  rel: 0, // Don't show related videos
                  showinfo: 0, // Hide video info
                  iv_load_policy: 3, // Hide annotations
                  fs: 0, // Disable fullscreen button
                  cc_load_policy: 0, // Hide closed captions
                  playsinline: 1, // Play inline on mobile
                }}
                onFullScreenChange={(isFullScreen) => {
                  // Prevent fullscreen to avoid layout issues
                  if (isFullScreen) {
                    // Force exit fullscreen if it somehow gets triggered
                    console.log('Preventing fullscreen mode');
                  }
                }}
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
      </View>

      {/* Title Section - Separate from video */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          {title} {year ? `(${year})` : ''}
        </Text>
        {!!genres?.length && <Text style={styles.genres}>{genres.join(', ')}</Text>}
      </View>
      
      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    width: width, // Fill full width
  },
  topSpacer: {
    height: Platform.OS === 'web' ? 40 : 20, // Push content down from top
  },
  videoSection: {
    flex: 1, // Takes up most of the space
    backgroundColor: '#000',
    width: width, // Fill full width
  },
  videoPressable: {
    flex: 1,
    width: width, // Fill full width
  },
  videoContainer: {
    backgroundColor: '#000',
    position: 'relative',
    height: VIDEO_HEIGHT,
    width: width,
    overflow: 'hidden',
    // Ensure no scroll bars appear
    ...(Platform.OS === 'web' && {
      maxHeight: height * 0.6, // Limit to 60% of screen height
      minHeight: 300, // Minimum height for better visibility
    }),
  },
  muteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 18,
    padding: 6,
  },
  titleSection: {
    height: 80, // Fixed height for title area
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    width: width, // Fill full width
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
  bottomSpacer: {
    height: Platform.OS === 'web' ? 20 : 10, // Add some bottom spacing
  },
});
