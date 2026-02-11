# Database Migrations - Apply These to Fix Issues

## 🚨 IMPORTANT: You MUST apply these database migrations to fix the profile_color error!

### Step 1: Apply Database Migrations
Run this command in your terminal:

```bash
cd c:/Users/north/Downloads/spectral-commune-main/spectral-commune-main
supabase db push
```

### Step 2: If that doesn't work, try this alternative:

```bash
cd c:/Users/north/Downloads/spectral-commune-main/spectral-commune-main
supabase migration up
```

### Step 3: Verify migrations were applied
Check that these migrations are applied:
- ✅ `20260211220000_add_missing_columns.sql` - Adds profile_color, avatar_url, banner_url
- ✅ `20260212020000_create_storage_bucket.sql` - Creates storage buckets  
- ✅ `20260212030000_server_features.sql` - Server features and custom roles
- ✅ `20260212040000_fix_channel_categories_rls.sql` - Fixes RLS policies

## 🔧 What These Migrations Fix:

### Profile Issues:
- ✅ **profile_color column** - Fixes "Could not find the 'profile_color' column" error
- ✅ **avatar_url column** - Fixes profile picture uploads
- ✅ **banner_url column** - Fixes banner uploads

### Storage Issues:
- ✅ **profile_images bucket** - Fixes "Bucket not found" error
- ✅ **server_images bucket** - Enables server icon/banner uploads
- ✅ **RLS policies** - Proper access control for storage

### Server Features:
- ✅ **Custom roles system** - Create and manage custom roles
- ✅ **Server icon/banner** - Upload server images
- ✅ **Role permissions** - Granular permission system

### RLS Policy Fixes:
- ✅ **Channel categories** - Fix "row-level security policy violation"
- ✅ **Channels** - Complete CRUD operations
- ✅ **Categories** - Create, edit, delete categories

## 🎯 After Applying Migrations:

1. **Profile customization will work** - Change colors, upload pictures
2. **Server management will work** - Create categories, custom roles
3. **Storage uploads will work** - No more "Bucket not found" errors
4. **All features will be functional** - Complete Discord-like experience

## ❓ If You Still Get Errors:

### Check migration status:
```bash
supabase migration list
```

### Reset and reapply (last resort):
```bash
supabase db reset
supabase db push
```

### Check Supabase connection:
```bash
supabase status
```

---

## 🚀 Once migrations are applied, everything will work perfectly!

The profile_color error will be gone, uploads will work, and all features will be functional.
