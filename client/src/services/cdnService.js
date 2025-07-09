import axios from 'axios';
import { getCdnConfig } from '../utils/constants';

const cdnConfig = getCdnConfig();

export const uploadToCDN = async (file, options = {}) => {
  const { type = 'image', prefix = '', metadata = {} } = options;
  
  try {
    // Get upload URL and form data from your server
    const response = await axios.post(`${cdnConfig.apiUrl}/upload`, {
      type,
      prefix,
      metadata,
    });

    const { uploadUrl, publicUrl, formData } = response.data;

    // Prepare the actual form data for CDN
    const uploadFormData = new FormData();
    Object.entries(formData.fields).forEach(([key, value]) => {
      uploadFormData.append(key, value);
    });
    uploadFormData.append('file', file);

    // Upload to CDN
    const uploadResponse = await axios.post(uploadUrl, uploadFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      url: publicUrl,
      response: uploadResponse.data,
    };
  } catch (error) {
    console.error('CDN upload error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload to CDN');
  }
};

export const deleteFromCDN = async (url) => {
  try {
    const response = await axios.delete(`${cdnConfig.apiUrl}/delete`, {
      data: { url },
    });
    return response.data;
  } catch (error) {
    console.error('CDN delete error:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete from CDN');
  }
};

export const generateSignedUrl = async (url, expiresIn = 3600) => {
  try {
    const response = await axios.post(`${cdnConfig.apiUrl}/sign`, {
      url,
      expiresIn,
    });
    return response.data.signedUrl;
  } catch (error) {
    console.error('CDN sign URL error:', error);
    throw new Error(error.response?.data?.message || 'Failed to generate signed URL');
  }
};

export const optimizeImage = async (url, options = {}) => {
  try {
    const response = await axios.post(`${cdnConfig.apiUrl}/optimize`, {
      url,
      options,
    });
    return response.data.optimizedUrl;
  } catch (error) {
    console.error('CDN optimize error:', error);
    throw new Error(error.response?.data?.message || 'Failed to optimize image');
  }
};