import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyInfo: any;
  onUpdate: () => void;
}

export const CompanyInfoModal = ({ isOpen, onClose, companyInfo, onUpdate }: CompanyInfoModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    legal_name: "",
    commercial_register: "",
    tax_number: "",
    official_email: "",
    phone_numbers: "",
    headquarters_location: "",
  });

  const handleEdit = () => {
    if (companyInfo) {
      setFormData({
        company_name: companyInfo.company_name || "",
        legal_name: companyInfo.legal_name || "",
        commercial_register: companyInfo.commercial_register || "",
        tax_number: companyInfo.tax_number || "",
        official_email: companyInfo.official_email || "",
        phone_numbers: Array.isArray(companyInfo.phone_numbers) ? companyInfo.phone_numbers.join(", ") : "",
        headquarters_location: companyInfo.headquarters_location || "",
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const phoneArray = formData.phone_numbers
        .split(",")
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);

      const updateData = {
        ...formData,
        phone_numbers: phoneArray,
      };

      let result;
      if (companyInfo?.id) {
        result = await supabase
          .from("company_settings")
          .update(updateData)
          .eq("id", companyInfo.id);
      } else {
        result = await supabase
          .from("company_settings")
          .insert([updateData]);
      }

      if (result.error) throw result.error;

      toast.success("تم حفظ بيانات الشركة بنجاح");
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error("فشل في حفظ البيانات: " + error.message);
    }
  };

  const handleCopy = () => {
    const info = `
الاسم: ${companyInfo?.company_name || ""}
الاسم القانوني: ${companyInfo?.legal_name || ""}
السجل التجاري: ${companyInfo?.commercial_register || ""}
الرقم الضريبي: ${companyInfo?.tax_number || ""}
الإيميل الرسمي: ${companyInfo?.official_email || ""}
أرقام التواصل: ${Array.isArray(companyInfo?.phone_numbers) ? companyInfo.phone_numbers.join(", ") : ""}
موقع المقر: ${companyInfo?.headquarters_location || ""}
    `.trim();

    navigator.clipboard.writeText(info);
    toast.success("تم نسخ معلومات الشركة");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            معلومات الشركة
            {!isEditing && (
              <div className="flex gap-2 mr-auto">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل البيانات
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ معلومات
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">اسم الشركة</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="legal_name">الاسم القانوني</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                    className="glass"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commercial_register">رقم السجل التجاري</Label>
                  <Input
                    id="commercial_register"
                    value={formData.commercial_register}
                    onChange={(e) => setFormData({...formData, commercial_register: e.target.value})}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_number">الرقم الضريبي</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                    className="glass"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="official_email">الإيميل الرسمي</Label>
                <Input
                  id="official_email"
                  type="email"
                  value={formData.official_email}
                  onChange={(e) => setFormData({...formData, official_email: e.target.value})}
                  className="glass"
                />
              </div>

              <div>
                <Label htmlFor="phone_numbers">أرقام التواصل (مفصولة بفواصل)</Label>
                <Input
                  id="phone_numbers"
                  value={formData.phone_numbers}
                  onChange={(e) => setFormData({...formData, phone_numbers: e.target.value})}
                  placeholder="0501234567, 0567890123"
                  className="glass"
                />
              </div>

              <div>
                <Label htmlFor="headquarters_location">موقع المقر</Label>
                <Textarea
                  id="headquarters_location"
                  value={formData.headquarters_location}
                  onChange={(e) => setFormData({...formData, headquarters_location: e.target.value})}
                  className="glass"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 ml-2" />
                  إلغاء
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">اسم الشركة</h4>
                    <p className="font-medium">{companyInfo?.company_name || "—"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">الاسم القانوني</h4>
                    <p className="font-medium">{companyInfo?.legal_name || "—"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">رقم السجل التجاري</h4>
                    <p className="font-medium">{companyInfo?.commercial_register || "—"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">الرقم الضريبي</h4>
                    <p className="font-medium">{companyInfo?.tax_number || "—"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">الإيميل الرسمي</h4>
                    <p className="font-medium">{companyInfo?.official_email || "—"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">أرقام التواصل</h4>
                    <p className="font-medium">
                      {Array.isArray(companyInfo?.phone_numbers) 
                        ? companyInfo.phone_numbers.join(", ") 
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">موقع المقر</h4>
                <p className="font-medium">{companyInfo?.headquarters_location || "—"}</p>
              </div>
            </div>
           )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};