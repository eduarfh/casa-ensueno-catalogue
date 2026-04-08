# Storage Image Deletion Fix

## Problem
Images were not being deleted from Supabase Storage bucket when removed from products. The issue was:

1. Upload API returned both `url` (full public URL) and `path` (relative path)
2. Product form was storing the full URL in the database
3. Deletion logic tried to extract paths from URLs but failed
4. Images remained in storage bucket even after being removed from database

## Solution

### 1. Created Storage Utility (`lib/storage-utils.ts`)
- `getStoragePublicUrl()`: Converts storage paths to public URLs
- `extractPathFromStorageUrl()`: Extracts paths from full URLs (for migration)

### 2. Updated Database Storage
- Now consistently stores **paths** (e.g., `products/1234-image.jpg`) instead of full URLs
- Paths are converted to URLs only when displaying images

### 3. Updated Components

#### Product Form (`components/product-form.tsx`)
- Stores `path` from upload response instead of `url`
- Converts paths to URLs for display using `getStoragePublicUrl()`
- Sends paths to API when saving products

#### Display Components
- `app/product/[id]/page.tsx`: Uses `getStoragePublicUrl()` to convert paths to URLs
- `app/catalog/page.tsx`: Uses `getStoragePublicUrl()` for image display
- `app/admin/page.tsx`: Uses `getStoragePublicUrl()` for admin product list
- `app/admin/products/[id]/page.tsx`: Uses `getStoragePublicUrl()` for edit form

### 4. Updated API Endpoints

#### PUT `/api/products/[id]` 
- Simplified image comparison logic (now compares paths directly)
- Removed URL extraction logic (no longer needed)
- Deletes images from storage using paths

#### POST `/api/products`
- Simplified to only handle `path` field
- Removed URL extraction fallback

#### DELETE `/api/products/[id]`
- Already working correctly with paths

## Benefits

1. **Consistent Data**: Database always stores paths, never full URLs
2. **Reliable Deletion**: Storage deletion works correctly with paths
3. **Cleaner Code**: Removed complex URL extraction logic
4. **Future-Proof**: If Supabase URL changes, only need to update utility function

## Migration Notes

For existing products with full URLs in database:
- The `getStoragePublicUrl()` function handles both paths and URLs
- Existing URLs will continue to work
- New uploads will use paths
- Gradual migration happens as products are edited

## Testing

To test the fix:
1. Create a new product with images
2. Edit the product and remove an image
3. Check Supabase Storage bucket - image should be deleted
4. Verify remaining images still display correctly
5. Check storage usage card displays correctly on admin dashboard

## Additional Fixes

### Storage Usage API
The storage usage API was also updated to handle paths correctly. It now converts paths to full URLs before making HEAD requests to check file sizes.
