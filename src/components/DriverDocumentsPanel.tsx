import { useRef, useState } from 'react';
import {
  CheckCircle2, Download, Eye, Loader2, AlertTriangle, Upload, X, ZoomIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatDateArabic, getDaysUntil } from '@/lib/dateUtils';
import {
  useDriverDocuments,
  useUpsertDriverDocument,
  uploadDocumentFile,
} from '@/hooks/useDriverDocuments';
import { toast } from 'sonner';
import type { DocType, DriverDocument } from '@/types';
import { DOC_TYPE_LABELS } from '@/types';

interface Props { driverId: string }

const DOC_TYPES: DocType[] = [
  'iqama_doc', 'license_doc', 'driver_card', 'ajeer_permit',
  'operation_card', 'registration', 'insurance_doc', 'medical_doc',
];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function statusStyle(status: string) {
  switch (status) {
    case 'expired':       return { cls: 'bg-red-500/15 text-red-400',   icon: AlertTriangle, label: 'منتهي' };
    case 'expiring_soon': return { cls: 'bg-amber-500/15 text-amber-400', icon: AlertTriangle, label: 'ينتهي قريباً' };
    case 'valid':         return { cls: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2, label: 'ساري' };
    default:              return { cls: 'bg-white/10 text-muted-foreground', icon: Upload, label: 'غير مرفوع' };
  }
}

function computeStatus(expiry: string | null): string {
  if (!expiry) return 'missing';
  const days = getDaysUntil(expiry);
  if (days === null) return 'missing';
  if (days <= 0)  return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'valid';
}

export function DriverDocumentsPanel({ driverId }: Props) {
  const { data: docs = [], isLoading } = useDriverDocuments(driverId);
  const upsert  = useUpsertDriverDocument();
  const [uploading, setUploading] = useState<string | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [editExpiry, setEditExpiry] = useState<{ type: string; value: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docMap = Object.fromEntries(docs.map((d) => [d.doc_type, d]));

  const handleFileUpload = async (docType: DocType, file: File) => {
    setUploading(docType);
    try {
      const url = await uploadDocumentFile(driverId, docType, file);
      const existing = docMap[docType];
      await upsert.mutateAsync({
        id:          existing?.id,
        driver_id:   driverId,
        doc_type:    docType,
        file_url:    url,
        file_name:   file.name,
        file_size:   file.size,
        mime_type:   file.type,
        expiry_date: existing?.expiry_date ?? null,
        status:      computeStatus(existing?.expiry_date ?? null),
      });
    } catch (error: unknown) {
      toast.error('فشل الرفع: ' + getErrorMessage(error, 'Unexpected upload error'));
    } finally {
      setUploading(null);
    }
  };

  const handleExpiryUpdate = async (docType: DocType, expiry: string) => {
    const existing = docMap[docType];
    await upsert.mutateAsync({
      id:          existing?.id,
      driver_id:   driverId,
      doc_type:    docType,
      file_url:    existing?.file_url ?? null,
      file_name:   existing?.file_name ?? null,
      expiry_date: expiry || null,
      status:      computeStatus(expiry),
    });
    setEditExpiry(null);
  };

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">جارٍ تحميل الوثائق...</div>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DOC_TYPES.map((docType) => {
          const doc = docMap[docType] as DriverDocument | undefined;
          const st  = statusStyle(doc?.status ?? 'missing');
          const StatusIcon = st.icon;
          const isUploadingThis = uploading === docType;
          const isPDF = doc?.mime_type === 'application/pdf';

          return (
            <div key={docType} className="flex flex-col rounded-[20px] border border-white/8 bg-white/[0.03] overflow-hidden">
              {/* Preview */}
              <div className="relative h-32 bg-white/5">
                {doc?.file_url ? (
                  isPDF ? (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                  ) : (
                    <img src={doc.file_url} alt={DOC_TYPE_LABELS[docType]} className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Upload className="h-8 w-8 text-white/20" />
                  </div>
                )}

                {/* Zoom button */}
                {doc?.file_url && !isPDF && (
                  <button
                    onClick={() => setPreview(doc.file_url!)}
                    className="absolute left-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-3 text-right">
                <div className="text-xs font-semibold text-white">{DOC_TYPE_LABELS[docType]}</div>

                <span className={cn('inline-flex items-center gap-1 self-end rounded-full px-2 py-0.5 text-[10px] font-semibold', st.cls)}>
                  <StatusIcon className="h-3 w-3" />
                  {st.label}
                </span>

                {/* Expiry */}
                {editExpiry?.type === docType ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                      onClick={() => handleExpiryUpdate(docType, editExpiry.value)}>حفظ</Button>
                    <Input type="date" className="h-6 flex-1 text-[10px]"
                      value={editExpiry.value}
                      onChange={(e) => setEditExpiry({ type: docType, value: e.target.value })} />
                  </div>
                ) : (
                  <button className="text-right text-[10px] text-muted-foreground hover:text-white"
                    onClick={() => setEditExpiry({ type: docType, value: doc?.expiry_date ?? '' })}>
                    {doc?.expiry_date ? `ينتهي: ${formatDateArabic(doc.expiry_date)}` : 'تاريخ الانتهاء'}
                  </button>
                )}

                {/* Actions — min 36px height for touch accessibility */}
                <div className="mt-auto flex gap-1 pt-1">
                  <input
                    ref={(el) => { fileRefs.current[docType] = el; }}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    aria-label={`رفع وثيقة ${DOC_TYPE_LABELS[docType]}`}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(docType, e.target.files[0])}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 min-h-[36px] text-[11px] gap-1"
                    onClick={() => fileRefs.current[docType]?.click()}
                    disabled={isUploadingThis}
                    aria-label={isUploadingThis ? 'جارٍ الرفع...' : doc?.file_url ? `تحديث ${DOC_TYPE_LABELS[docType]}` : `رفع ${DOC_TYPE_LABELS[docType]}`}
                  >
                    {isUploadingThis
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Upload className="h-3 w-3" />}
                    {isUploadingThis ? 'جارٍ...' : doc?.file_url ? 'تحديث' : 'رفع'}
                  </Button>
                  {doc?.file_url && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-[36px] min-w-[36px] p-0"
                        onClick={() => setPreview(doc.file_url!)}
                        aria-label={`معاينة ${DOC_TYPE_LABELS[docType]}`}
                        title="معاينة"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <a
                        href={doc.file_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`تحميل ${DOC_TYPE_LABELS[docType]}`}
                        title="تحميل"
                      >
                        <Button size="sm" variant="ghost" className="min-h-[36px] min-w-[36px] p-0">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-slate-950 p-2">
          <div className="relative">
            <Button size="icon" variant="ghost" className="absolute right-2 top-2 z-10"
              onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
            {preview && (
              <img src={preview} alt="معاينة الوثيقة"
                className="max-h-[80vh] w-full rounded-[16px] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
