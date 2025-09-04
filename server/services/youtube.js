import fetch from 'node-fetch';

export async function getTrailerId(title) {
  const query = `${title} anime trailer official`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}&type=video&maxResults=5`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const videos = json.items || [];

    console.log("🔍 YouTube search results:");
    videos.forEach((v, i) => {
      console.log(`${i + 1}. ${v.snippet.title} [${v.snippet.channelTitle}] → ${v.id.videoId}`);
    });

    const trustedTrailer = videos.find(v => {
      const titleText = v.snippet?.title?.toLowerCase() || '';
      const channel = v.snippet?.channelTitle?.toLowerCase() || '';
      return (
        titleText.includes('trailer') &&
        (channel.includes('viz') || channel.includes('crunchyroll'))
      );
    });

    const genericTrailer = videos.find(v =>
      v.snippet?.title?.toLowerCase().includes('trailer')
    );

    const fallback = videos[0];

    const selected = trustedTrailer || genericTrailer || fallback;
    const videoId = selected?.id?.videoId || null;

    console.log("🎯 Selected trailer ID:", videoId);
    return videoId;
  } catch (err) {
    console.warn(`⚠️ YouTube trailer fetch failed for "${title}":`, err);
    return null;
  }
}