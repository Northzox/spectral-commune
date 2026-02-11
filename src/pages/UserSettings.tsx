import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Bell, Lock, Upload, Palette, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PasswordConfirmDialog from '@/components/app/PasswordConfirmDialog';
import { checkIsAdmin } from '@/lib/supabase-helpers';
import { toast } from 'sonner';

export default function UserSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [profileColor, setProfileColor] = useState('#5865F2');
  const [saving, setSaving] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showBannerUpload, setShowBannerUpload] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => () => {});
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState('account');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setUsername(data.username);
        setBio(data.bio || '');
        setCustomStatus(data.custom_status || '');
        setAvatarUrl(data.avatar_url || '');
        setBannerUrl(data.banner_url || '');
        setProfileColor(data.profile_color || '#5865F2');
      }
    });
    
    // Check admin status
    checkIsAdmin(user.id).then(setIsAdmin);
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    // Validate username
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    if (username.trim().length > 32) {
      toast.error('Username must be less than 32 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    const saveProfile = async () => {
      setSaving(true);
      const { error } = await supabase.from('profiles').update({
        username: username.trim(),
        bio: bio.trim(),
        custom_status: customStatus.trim(),
        avatar_url: avatarUrl.trim(),
        banner_url: bannerUrl.trim(),
        profile_color: profileColor,
      }).eq('id', user.id);
      if (error) toast.error(error.message);
      else toast.success('Profile updated!');
      setSaving(false);
    };

    // Require password confirmation for sensitive changes
    const originalData = { username, bio, customStatus, avatarUrl, bannerUrl, profileColor };
    const hasSensitiveChanges = 
      username !== originalData.username || 
      avatarUrl !== originalData.avatarUrl ||
      bannerUrl !== originalData.bannerUrl;

    if (hasSensitiveChanges) {
      setPendingAction(() => saveProfile);
      setShowPasswordConfirm(true);
    } else {
      saveProfile();
    }
  };

  const uploadImage = async (file: File, type: 'avatar' | 'banner') => {
    if (!user) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile_images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile_images')
      .getPublicUrl(filePath);

    if (type === 'avatar') {
      setAvatarUrl(publicUrl);
    } else {
      setBannerUrl(publicUrl);
    }

    toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded!`);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }
      uploadImage(file, 'avatar');
      setShowAvatarUpload(false);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }
      uploadImage(file, 'banner');
      setShowBannerUpload(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border p-4 flex flex-col">
        <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <nav className="space-y-1">
          {[
            { icon: User, label: 'My Account', id: 'account' },
            { icon: Shield, label: 'Privacy', id: 'privacy' },
            { icon: Bell, label: 'Notifications', id: 'notifications' },
            { icon: Lock, label: 'Security', id: 'security' },
            ...(isAdmin ? [{ icon: Shield, label: 'Admin Panel', href: '/admin' }] : []),
          ].map(item => (
            <button 
              key={item.label} 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeSection === (item as any).id 
                  ? 'bg-surface-active text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
              onClick={() => (item as any).href ? navigate((item as any).href) : setActiveSection((item as any).id)}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <Button variant="destructive" size="sm" className="w-full" onClick={async () => { await signOut(); navigate('/'); }}>
            Log Out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-2xl">
        {activeSection === 'account' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">My Account</h1>
        
            {/* Profile Banner */}
            <div className="mb-6 -mx-8 -mt-8 h-32 bg-cover bg-center relative" style={{ 
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              backgroundColor: bannerUrl ? undefined : profileColor 
            }}>
              {!bannerUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="space-y-6">
              {/* Profile Section */}
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-2xl" style={{ backgroundColor: profileColor }}>
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card hover:bg-primary/80 transition-colors"
                    >
                      <Camera className="w-3 h-3 text-primary-foreground" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{username}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    {customStatus && (
                      <p className="text-sm text-muted-foreground italic">{customStatus}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBannerUpload(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Banner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowColorPicker(true)}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Color
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="username"
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9_]+"
                  />
                  <p className="text-xs text-muted-foreground">
                    3-32 characters, letters, numbers, and underscores only
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-status">Custom Status</Label>
                  <Input 
                    id="custom-status"
                    value={customStatus} 
                    onChange={e => setCustomStatus(e.target.value)} 
                    placeholder="What are you up to?" 
                    maxLength={128}
                  />
                  <p className="text-xs text-muted-foreground">
                    {customStatus.length}/128 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio"
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder="Tell us about yourself" 
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </>
        )}
        
        {activeSection === 'privacy' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">Privacy Settings</h1>
            <div className="space-y-4">
              <div className="p-6 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">Privacy settings coming soon...</p>
              </div>
            </div>
          </>
        )}
        
        {activeSection === 'notifications' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">Notification Settings</h1>
            <div className="space-y-4">
              <div className="p-6 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">Notification settings coming soon...</p>
              </div>
            </div>
          </>
        )}
        
        {activeSection === 'security' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">Security Settings</h1>
            <div className="space-y-4">
              <div className="p-6 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">Security settings coming soon...</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a new avatar image
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <Button asChild>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max size: 5MB • JPG, PNG, GIF
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Upload Dialog */}
      <Dialog open={showBannerUpload} onOpenChange={setShowBannerUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a banner image for your profile
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
                id="banner-upload"
              />
              <Button asChild>
                <label htmlFor="banner-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max size: 10MB • Recommended: 1200x300px
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-color">Choose your profile accent color</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="profile-color"
                  type="color"
                  value={profileColor}
                  onChange={(e) => setProfileColor(e.target.value)}
                  className="w-16 h-16 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    value={profileColor}
                    onChange={(e) => setProfileColor(e.target.value)}
                    placeholder="#5865F2"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hex color code
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {[
                '#5865F2', '#ED4245', '#F47F47', '#FEE75C', '#3BA55C', '#57F287', '#5865F2', '#EB459E',
                '#992D22', '#FAA61A', '#FEE75C', '#059669', '#17F3A6', '#5865F2', '#C169EF', '#EB459E'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setProfileColor(color)}
                  className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button onClick={() => setShowColorPicker(false)}>
              Apply Color
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordConfirmDialog 
        open={showPasswordConfirm}
        onOpenChange={setShowPasswordConfirm}
        onConfirm={pendingAction}
        action="update your profile"
      />
    </div>
  );
}
