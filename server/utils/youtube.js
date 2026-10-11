/**
 * Helper to extract YouTube Video ID and thumbnail links
 */
function parseYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    const videoId = match[1];
    return {
      isYouTube: true,
      videoId,
      maxResThumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      hqThumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      sdThumbnail: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  // Check if it's general youtube domain without video ID (e.g. channel or homepage)
  const isYouTubeDomain = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(trimmed);
  if (isYouTubeDomain) {
    return {
      isYouTube: true,
      videoId: null,
      maxResThumbnail: null,
      hqThumbnail: null,
      videoUrl: trimmed
    };
  }

  return {
    isYouTube: false,
    videoId: null,
    maxResThumbnail: null,
    hqThumbnail: null,
    videoUrl: trimmed
  };
}

module.exports = {
  parseYouTubeUrl
};
