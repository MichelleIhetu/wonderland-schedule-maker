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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let images: { imageUrl: string; title: string; sourceUrl: string }[] = [];

    if (boardUrl) {
      // Scrape a Pinterest board URL
      let formattedUrl = boardUrl.trim();
      if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

      console.log('Scraping Pinterest board:', formattedUrl);

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['html', 'links'],
          waitFor: 3000,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Firecrawl scrape error:', data);
        return new Response(
          JSON.stringify({ success: false, error: data.error || 'Failed to scrape board' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract image URLs from the HTML
      const html = data.data?.html || data.html || '';
      const imgRegex = /<img[^>]+src=["']([^"']*(?:pinimg|pinterest)[^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
      let match;
      const seen = new Set<string>();

      while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1];
        if (!seen.has(url) && url.includes('pinimg.com') && !url.includes('75x75') && !url.includes('30x30')) {
          // Upgrade to higher resolution
          const hiRes = url.replace(/\/\d+x\//,'/736x/').replace(/\/\d+x$/,'/736x');
          seen.add(url);
          images.push({
            imageUrl: hiRes,
            title: match[2] || 'Pinterest Pin',
            sourceUrl: formattedUrl,
          });
        }
      }

      // Also try links for pin pages
      const links = data.data?.links || data.links || [];
      console.log(`Found ${images.length} images and ${links.length} links`);

    } else if (query) {
      // Search Pinterest via Firecrawl search
      console.log('Searching Pinterest for:', query);

      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:pinterest.com ${query} aesthetic inspiration`,
          limit: 10,
          scrapeOptions: { formats: ['html'] },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Firecrawl search error:', data);
        return new Response(
          JSON.stringify({ success: false, error: data.error || 'Search failed' }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = data.data || [];
      const seen = new Set<string>();

      for (const result of results) {
        const html = result.html || '';
        const imgRegex = /<img[^>]+src=["']([^"']*pinimg\.com[^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
          const url = match[1];
          if (!seen.has(url) && !url.includes('75x75') && !url.includes('30x30')) {
            const hiRes = url.replace(/\/\d+x\//,'/736x/').replace(/\/\d+x$/,'/736x');
            seen.add(url);
            images.push({
              imageUrl: hiRes,
              title: match[2] || result.title || query,
              sourceUrl: result.url || 'https://pinterest.com',
            });
          }
        }

        // Fallback: use OG image if available
        if (images.length === 0) {
          const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/);
          if (ogMatch && !seen.has(ogMatch[1])) {
            seen.add(ogMatch[1]);
            images.push({
              imageUrl: ogMatch[1],
              title: result.title || query,
              sourceUrl: result.url || 'https://pinterest.com',
            });
          }
        }
      }

      // If still no Pinterest images, fall back to general image search
      if (images.length < 3) {
        console.log('Falling back to general image search');
        const fallbackResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${query} aesthetic study inspiration moodboard`,
            limit: 8,
            scrapeOptions: { formats: ['html'] },
          }),
        });

        const fallbackData = await fallbackResponse.json();
        if (fallbackResponse.ok) {
          for (const result of (fallbackData.data || [])) {
            const html = result.html || '';
            const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/);
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
