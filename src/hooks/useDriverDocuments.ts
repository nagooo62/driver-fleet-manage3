import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  deleteDemoDocument,
  DEMO_MODE,
  getDemoDocuments,
  readFileAsDataUrl,
  upsertDemoDocument,
} from '@/lib/demoMode';
import type { DriverDocument, DriverDocumentInsert } from '@/types';

const getErrorMessage = (error: unknown, fallback = 'حدث خطأ غير متوقع') =>
  error instanceof Error ? error.message : fallback;

export function useDriverDocuments(driverId: string | undefined) {
  return useQuery({
    queryKey: ['driver-documents', driverId],
    enabled: !!driverId,
    queryFn: async () => {
      if (DEMO_MODE) {
        return getDemoDocuments(driverId).sort((left, right) => left.doc_type.localeCompare(right.doc_type));
      }

      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId!)
        .order('doc_type');
      if (error) throw error;
      return (data ?? []) as DriverDocument[];
    },
  });
}

export function useUpsertDriverDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DriverDocumentInsert) => {
      if (DEMO_MODE) {
        return upsertDemoDocument(doc);
      }

      const { data, error } = await supabase
        .from('driver_documents')
        .upsert(doc, { onConflict: 'driver_id,doc_type' })
        .select('*')
        .single();
      if (error) throw error;
      return data as DriverDocument;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['driver-documents', data.driver_id] });
      toast.success('تم حفظ الوثيقة بنجاح');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteDriverDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, driverId }: { id: string; driverId: string }) => {
      if (DEMO_MODE) {
        deleteDemoDocument(id);
        return driverId;
      }

      const { error } = await supabase.from('driver_documents').delete().eq('id', id);
      if (error) throw error;
      return driverId;
    },
    onSuccess: (driverId) => {
      qc.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      toast.success('تم حذف الوثيقة');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export async function uploadDocumentFile(
  driverId: string,
  docType: string,
  file: File,
): Promise<string> {
  if (DEMO_MODE) {
    return readFileAsDataUrl(file);
  }

  const ext = file.name.split('.').pop();
  const path = `${driverId}/${docType}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('driver-documents')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from('driver-documents')
    .getPublicUrl(path);
  return publicUrl;
}
