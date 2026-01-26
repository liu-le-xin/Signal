/**
 * API service for communicating with Cloudflare Workers AI backend
 */

// In development, the Worker runs on port 8787
// In production, this should be your deployed Worker URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

/**
 * Analyze a single feedback text using Workers AI
 * @param {string} text - The feedback text
 * @param {string} title - Optional title
 * @returns {Promise<Object>} Analysis result with sentiment, theme, priority, etc.
 */
export async function analyzeFeedback(text, title = '') {
  try {
    const response = await fetch(`${WORKER_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze feedback');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    throw error;
  }
}

/**
 * Analyze multiple feedback texts in batch
 * @param {Array<{id: string, text: string, title?: string}>} feedbacks - Array of feedback objects
 * @returns {Promise<Object>} Batch analysis results
 */
export async function analyzeFeedbackBatch(feedbacks) {
  try {
    const response = await fetch(`${WORKER_URL}/api/analyze-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedbacks }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze feedback batch');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing feedback batch:', error);
    throw error;
  }
}

/**
 * Check if the Worker is healthy
 * @returns {Promise<boolean>} True if worker is healthy
 */
export async function checkWorkerHealth() {
  try {
    const response = await fetch(`${WORKER_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Worker health check failed:', error);
    return false;
  }
}

/**
 * Fetch all feedbacks from D1 database
 * @param {Object} filters - Optional filters { theme, type, limit }
 * @returns {Promise<Object>} Feedback list
 */
export async function getFeedbacks(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.theme) params.append('theme', filters.theme);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `${WORKER_URL}/api/feedbacks${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch feedbacks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
}

/**
 * Download feedbacks as TXT file
 * @param {Object} filters - Optional filters { theme, type }
 * @returns {Promise<Blob>} TXT file blob
 */
export async function downloadFeedbacks(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.theme) params.append('theme', filters.theme);
    if (filters.type) params.append('type', filters.type);

    const url = `${WORKER_URL}/api/feedbacks/download${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to download feedbacks');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `feedbacks_${Date.now()}.txt`;

    // Create download link
    const url_blob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_blob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url_blob);

    return { success: true, filename };
  } catch (error) {
    console.error('Error downloading feedbacks:', error);
    throw error;
  }
}

