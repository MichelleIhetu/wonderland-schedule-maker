const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, boardUrl } = await req.json();

    let images: { imageUrl: string; title: string; sourceUrl: string }[] = [];

    if (boardUrl) {
      let formattedUrl = boardUrl.trim();
      if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

      // Try RSS feed first - Pinterest exposes boards as RSS
      // URL format: https://www.pinterest.com/user/board/ -> https://www.pinterest.com/user/board.rss
      let rssUrl = formattedUrl.replace(/\/$/, '') + '.rss';
      console.log('Fetching Pinterest RSS:', rssUrl);

      const rssResponse = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Lovable/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (rssResponse.ok) {
        const rssText = await rssResponse.text();
        console.log('RSS response length:', rssText.length);

        // Parse image URLs from RSS XML
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let itemMatch;
        const seen = new Set<string>();

        while ((itemMatch = itemRegex.exec(rssText)) !== null) {
          const itemContent = itemMatch[1];

          // Extract image from description or media content
          const imgMatch = itemContent.match(/src=["']([^"']*pinimg\.com[^"']*)["']/i)
            || itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i)
            || itemContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);

          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)
            || itemContent.match(/<title>(.*?)<\/title>/i);

          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/i)
            || itemContent.match(/<guid>(.*?)<\/guid>/i);

          if (imgMatch) {
            let imgUrl = imgMatch[1];
            // Upgrade to higher resolution
            imgUrl = imgUrl.replace(/\/\d+x\d*\//g, '/736x/').replace(/\/\d+x$/g, '/736x');

            if (!seen.has(imgUrl)) {
              seen.add(imgUrl);
              images.push({
                imageUrl: imgUrl,
                title: titleMatch ? titleMatch[1].trim() : 'Pinterest Pin',
                sourceUrl: linkMatch ? linkMatch[1].trim() : formattedUrl,
              });
            }
          }
        }

        console.log(`Found ${images.length} images from RSS`);
      } else {
        console.log('RSS failed with status:', rssResponse.status);
        await rssResponse.text(); // consume body
      }

      // Fallback: fetch the HTML page directly
      if (images.length === 0) {
        console.log('Falling back to direct HTML fetch');
        const htmlResponse = await fetch(formattedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        if (htmlResponse.ok) {
          const html = await htmlResponse.text();

          // Extract pinimg URLs from HTML/JSON data
          const pinimgRegex = /https?:\/\/i\.pinimg\.com\/[^"'\s<>)}\]]+/g;
          let match;
          const seen = new Set<string>();

          while ((match = pinimgRegex.exec(html)) !== null) {
            let url = match[0].replace(/\\u002F/g, '/').replace(/\\/g, '');
            // Skip tiny thumbnails
            if (url.includes('75x75') || url.includes('30x30') || url.includes('50x50')) continue;
            // Upgrade resolution
            url = url.replace(/\/\d+x\d*\//g, '/736x/');

            if (!seen.has(url) && url.match(/\.(jpg|jpeg|png|webp)/i)) {
              seen.add(url);
              images.push({
                imageUrl: url,
                title: 'Pinterest Pin',
                sourceUrl: formattedUrl,
              });
            }
          }
          console.log(`Found ${images.length} images from HTML`);
        } else {
          console.log('HTML fetch failed:', htmlResponse.status);
          await htmlResponse.text();
        }
      }

      if (images.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Could not extract images from this board. Make sure the board is public.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else if (query) {
      // For search queries, use Firecrawl search (non-Pinterest sites work fine)
      const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Search not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Searching for:', query);
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${query} aesthetic inspiration moodboard images`,
          limit: 10,
          scrapeOptions: { formats: ['html'] },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const seen = new Set<string>();
        for (const result of (data.data || [])) {
          const html = result.html || '';
          const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/)
            || html.match(/content="([^"]+)"[^>]*property="og:image"/);
          if (ogMatch && !seen.has(ogMatch[1])) {
            seen.add(ogMatch[1]);
            images.push({
              imageUrl: ogMatch[1],
              title: result.title || query,
              sourceUrl: result.url || '',
            });
          }
        }
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'query or boardUrl required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${images.length} images`);
    return new Response(
      JSON.stringify({ success: true, images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pinterest search error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
