/**
 * RSS / Atom Feed Parser for LaraPush-style RSS-to-Push & Push-on-Publish
 * Supports WordPress feeds, Blogger, Medium, YouTube XML feeds, and custom RSS.
 */

// Simple XML/RSS tag extractor without heavy external dependencies
function extractTagContent(xml, tag) {
  // Handle namespaced tags e.g. <media:thumbnail url="..." /> or <dc:creator>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  if (match) return match[1].trim();
  return null;
}

function extractAttr(xml, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i');
  const match = xml.match(regex);
  if (match) return match[1].trim();
  return null;
}

function cleanCdataAndHtml(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const rssService = {
  /**
   * Fetch and parse an RSS or Atom feed URL
   */
  async fetchFeed(feedUrl) {
    if (!feedUrl || !feedUrl.startsWith('http')) {
      throw new Error('Valid HTTP/HTTPS RSS feed URL is required');
    }

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LaraPush-Pulse/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed (HTTP ${response.status})`);
    }

    const text = await response.text();
    return this.parseXml(text, feedUrl);
  },

  /**
   * Parse RSS / Atom XML string into structured articles list
   */
  parseXml(xml, feedUrl = '') {
    const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');
    
    // Extract Channel Title
    let channelTitle = extractTagContent(xml, 'title') || 'Website Feed';
    channelTitle = cleanCdataAndHtml(channelTitle);

    const items = [];
    const itemTag = isAtom ? 'entry' : 'item';
    const itemRegex = new RegExp(`<${itemTag}[^>]*>([\\s\\S]*?)<\\/${itemTag}>`, 'gi');

    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const itemXml = match[1];

      // Title
      const rawTitle = extractTagContent(itemXml, 'title') || 'New Post';
      const title = cleanCdataAndHtml(rawTitle);

      // Link
      let link = '';
      if (isAtom) {
        link = extractAttr(itemXml, 'link', 'href') || extractTagContent(itemXml, 'link') || '';
      } else {
        link = extractTagContent(itemXml, 'link') || '';
      }
      link = cleanCdataAndHtml(link);

      // Description / Summary
      const rawDesc = extractTagContent(itemXml, 'description') || 
                       extractTagContent(itemXml, 'summary') || 
                       extractTagContent(itemXml, 'content') || '';
      const description = cleanCdataAndHtml(rawDesc).slice(0, 180);

      // GUID / ID
      const guid = cleanCdataAndHtml(
        extractTagContent(itemXml, 'guid') || 
        extractTagContent(itemXml, 'id') || 
        link
      );

      // PubDate
      const pubDate = cleanCdataAndHtml(
        extractTagContent(itemXml, 'pubDate') || 
        extractTagContent(itemXml, 'updated') || 
        extractTagContent(itemXml, 'published') || 
        new Date().toISOString()
      );

      // Media / Thumbnail
      let image = extractAttr(itemXml, 'media:thumbnail', 'url') ||
                  extractAttr(itemXml, 'enclosure', 'url') ||
                  extractAttr(itemXml, 'media:content', 'url');

      if (!image) {
        // Search for <img src="..."> inside description or content
        const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) image = imgMatch[1];
      }

      // Check if YouTube feed
      if (!image && link && (link.includes('youtube.com') || link.includes('youtu.be'))) {
        const ytIdMatch = link.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]{11})/);
        if (ytIdMatch) {
          image = `https://img.youtube.com/vi/${ytIdMatch[1]}/maxresdefault.jpg`;
        }
      }

      items.push({
        guid,
        title,
        link,
        description,
        pubDate,
        imageUrl: image || ''
      });
    }

    return {
      feedTitle: channelTitle,
      feedUrl,
      itemCount: items.length,
      items
    };
  }
};

module.exports = rssService;
