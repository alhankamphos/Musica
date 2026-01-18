export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  try {
    // Método 1: NoEmbed
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const noembedResponse = await fetch(noembedUrl);
    
    if (noembedResponse.ok) {
      const data = await noembedResponse.json();
      if (data.title) {
        return res.status(200).json({ title: data.title, source: 'noembed' });
      }
    }

    // Método 2: YouTube oEmbed
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    
    if (oembedResponse.ok) {
      const data = await oembedResponse.json();
      if (data.title) {
        return res.status(200).json({ title: data.title, source: 'oembed' });
      }
    }

    // Método 3: Parsear la página de YouTube
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(pageUrl);
    const html = await pageResponse.text();
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].replace(' - YouTube', '').trim();
      return res.status(200).json({ title, source: 'parse' });
    }

    // Si todo falla
    return res.status(404).json({ error: 'Could not fetch video title', title: 'Mi Canción' });

  } catch (error) {
    console.error('Error fetching video title:', error);
    return res.status(500).json({ error: 'Internal server error', title: 'Mi Canción' });
  }
}
