# Cloudinary Setup Guide

This document explains what you need to configure manually to use Cloudinary for image storage.

## ✅ What Has Been Implemented

The following has been automatically set up:
- ✅ Cloudinary package installed
- ✅ Cloudinary service created (`backend/src/utils/cloudinary.service.ts`)
- ✅ Cloudinary configuration provider created (`backend/src/utils/cloudinary.config.ts`)
- ✅ Alerts controller updated to handle file uploads
- ✅ Alerts service updated to delete images from Cloudinary when alerts are deleted
- ✅ Frontend API updated to send files as FormData
- ✅ CreateAlertModal updated to handle File objects
- ✅ Database schema updated to include `roadName` and `fullAddress` fields

## 📋 Manual Steps Required

### Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (or login if you already have one)
3. After registration, you'll be taken to the Dashboard

### Step 2: Get Your Cloudinary Credentials

1. In the Cloudinary Dashboard, you'll see your **Cloud Name**, **API Key**, and **API Secret**
2. Copy these three values - you'll need them for the environment variables

### Step 3: Set Environment Variables

Add the following environment variables to your backend:

#### For Local Development (`.env` file in `backend/` directory):

Create or update `backend/.env` file with:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

#### For Railway Deployment:

1. Go to your Railway project dashboard
2. Navigate to your backend service
3. Go to the **Variables** tab
4. Add these three environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

### Step 4: Restart Your Application

After setting the environment variables:
- **Local**: Restart your NestJS dev server
- **Railway**: Redeploy your service (Railway will automatically restart)

## 🔍 Verification

To verify everything is working:

1. Start your backend server
2. Try creating an alert with a photo from the frontend
3. Check the backend logs - you should see:
   ```
   ✅ [CLOUDINARY] Upload successful: https://res.cloudinary.com/...
   ```
4. Check your Cloudinary Dashboard → Media Library → `alert-photos` folder to see uploaded images

## 📝 Important Notes

### Cloudinary Free Tier Limits:
- **25 GB storage**
- **25 GB monthly bandwidth**
- **25 GB monthly transformation limit**
- Images are automatically optimized and transformed

### Security:
- **Never commit your `.env` file** to git
- Keep your `CLOUDINARY_API_SECRET` secure
- The API secret should only be used on the backend

### Image Upload Limits:
- Maximum file size: **5MB** (configured in the controller)
- Supported formats: **JPG, JPEG, PNG, GIF, WEBP**
- Images are automatically:
  - Resized to max 1200x1200px
  - Optimized for web delivery
  - Stored in the `alert-photos` folder in Cloudinary

## 🐛 Troubleshooting

### Error: "Invalid credentials"
- Check that all three environment variables are set correctly
- Verify there are no extra spaces in the values
- Restart your server after changing environment variables

### Error: "Upload failed"
- Check your internet connection
- Verify Cloudinary service status: [https://status.cloudinary.com](https://status.cloudinary.com)
- Check if you've exceeded Cloudinary free tier limits

### Images not deleting when alerts are deleted:
- This is non-critical - images will remain in Cloudinary but won't be accessible
- You can manually clean up old images from Cloudinary Dashboard
- The delete function will log warnings if it fails

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

