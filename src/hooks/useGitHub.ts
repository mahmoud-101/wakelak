import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGitHub = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const syncChanges = async (files: any[]) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-sync', {
        body: { files, message: 'Auto-sync from Wakel Agent' }
      });

      if (error) throw error;

      toast({
        title: 'تم النشر بنجاح! ✅',
        description: 'التعديلات بقت موجودة دلوقتي على ريبو GitHub.',
      });
    } catch (err: any) {
      console.error('Sync error:', err);
      toast({
        title: 'فشل في المزامنة',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncChanges, isSyncing };
};