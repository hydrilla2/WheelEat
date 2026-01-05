# How to Upload Ad Banner Images

## Step 1: Locate the Ads Folder

Navigate to: `frontend/public/images/ads/`

## Step 2: Add Your Images

Place your images in the `ads` folder with these exact file names:

### Required Files:

1. **nls-restaurant.jpg** 
   - Restaurant interior photo (Shop profile - First picture)
   - This will be the first slide showing the restaurant

2. **nasi-lemak.jpg**
   - Nasi Lemak dish photo (Dish 1)

3. **rendang.jpg**
   - Rendang dish photo (Dish 2)

4. **laksa.jpg**
   - Laksa dish photo (Dish 3)

5. **laksa-2.jpg**
   - Laksa Special dish photo (Dish 4)

6. **lontong.jpg**
   - Lontong Sayur dish photo (Dish 5)

## Step 3: Image Specifications

- **Format**: JPG, JPEG, or PNG
- **Recommended size**: 400x400px to 800x800px (square format works best)
- **File size**: Keep under 500KB per image for fast loading
- **Aspect ratio**: 1:1 (square) is recommended, but the component will crop to fit

## Step 4: Verify

After adding the images:
1. Restart your development server if running
2. The ad banner will automatically display the images
3. If images are missing, you'll see colorful gradient placeholders

## Current Configuration

The ad banner is configured with:
- **Slide 1**: Restaurant profile (NLS Nasi Lemak Shop)
- **Slides 2-6**: Five dish images (Nasi Lemak, Rendang, Laksa, Laksa Special, Lontong Sayur)
- **Auto-advance**: Every 3 seconds
- **Location**: Only in the result modal popup (removed from main page)

## Troubleshooting

If images don't appear:
1. Check file names match exactly (case-sensitive)
2. Verify images are in `frontend/public/images/ads/` folder
3. Check browser console for 404 errors
4. Ensure file extensions are correct (.jpg, .jpeg, or .png)

