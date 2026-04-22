import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, UserPlus } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

export function AdminUserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'employee' as const,
    department: '',
    password: ''
  });

  const roles = [
    { value: 'admin', label: 'مدير عام' },
    { value: 'manager', label: 'مدير' },
    { value: 'employee', label: 'موظف' },
    { value: 'accountant', label: 'محاسب' }
  ];

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.full_name || !formData.password) {
        toast({
          title: "بيانات ناقصة",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }

      // Call secure edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.full_name,
          role: formData.role,
          department: formData.department
        }
      });

      if (error) {
        console.error('User creation error:', error);
        toast({
          title: "خطأ في إنشاء المستخدم",
          description: error.message || 'حدث خطأ في إنشاء المستخدم',
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم إنشاء المستخدم بنجاح",
        description: "تم إنشاء المستخدم الجديد بنجاح",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProfiles();
      
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "تم تحديث بيانات المستخدم",
        description: "تم حفظ التغييرات بنجاح",
      });

      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث البيانات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "تم إلغاء تفعيل المستخدم",
        description: "لن يتمكن المستخدم من الوصول للنظام",
      });

      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "خطأ في إلغاء التفعيل",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'employee',
      department: '',
      password: ''
    });
  };

  const openEditDialog = (profile: Profile) => {
    setEditingUser(profile);
    setFormData({
      email: '',
      full_name: profile.full_name || '',
      role: profile.role as any,
      department: profile.department || '',
      password: ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getRoleLabel = (role: string) => {
    return roles.find(r => r.value === role)?.label || role;
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingUser && (
                <>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="كلمة مرور قوية"
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              <div>
                <Label htmlFor="role">الدور الوظيفي</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">القسم</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="أدخل اسم القسم"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingUser ? handleUpdateUser : handleCreateUser}
                  className="flex-1"
                >
                  {editingUser ? 'تحديث' : 'إنشاء المستخدم'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{profile.department}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                    {profile.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                  <Badge variant="outline">
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  تاريخ الإنشاء: {new Date(profile.created_at).toLocaleDateString('ar')}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(profile)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {profile.is_active && profile.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeactivateUser(profile.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}