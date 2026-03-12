import { supabase } from '@/integrations/supabase/client';

export interface PinterestImage {
  imageUrl: string;
  title: string;
  sourceUrl: string;
}

export const pinterestApi = {
  async searchAesthetic(query: string): Promise<{ success: boolean; images: PinterestImage[]; error?: string }> {
    const { data, error } = await supabase.functions.invoke('pinterest-search', {
      body: { query },
    });
    if (error) return { success: false, images: [], error: error.message };
    return data;
  },

  async importBoard(boardUrl: string): Promise<{ success: boolean; images: PinterestImage[]; error?: string }> {
    const { data, error } = await supabase.functions.invoke('pinterest-search', {
      body: { boardUrl },
    });
    if (error) return { success: false, images: [], error: error.message };
    return data;
  },
};
