/**
 * Document Service
 * Handles all API calls related to document upload and processing
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const UPLOAD_ENDPOINT = `${API_BASE_URL}/document/upload`
const ASK_ENDPOINT = `${API_BASE_URL}/document/ask`
const REMOVE_ENDPOINT = `${API_BASE_URL}/document/delete`
/**
 * Upload a document file to the server
 * @param {File} file - The file object to upload
 * @returns {Promise<Object>} - The response from the server
 */
export const uploadDocument = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Create FormData object to send file
    const formData = new FormData()
    formData.append('file', file)

    // Construct URL with fileName query parameter
    const uploadUrl = `${UPLOAD_ENDPOINT}?fileName=${encodeURIComponent(file.name)}`

    // Make the API request
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - browser will set it automatically with boundary
        'Accept': 'application/json',
      },
    })
    console.log('response ::', response)
    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Upload failed with status ${response.status}`
      )
    }

    // Parse and return response
    const data = await response.json()
    return {
      success: true,
      data: data,
      message: 'File uploaded successfully',
    }
  } catch (error) {
    console.error('Document upload error:', error)
    return {
      success: false,
      error: error.message,
      message: error.message || 'Failed to upload document',
    }
  }
}

/**
 * Send a chat message with document context
 * @param {string} message - The user's message
 * @param {string} doc_id - The document ID
 * @returns {Promise<Object>} - The response from the server
 */
export const sendChatMessage = async (message, doc_id) => {
  try {
    if (!message.trim()) {
      throw new Error('Message cannot be empty')
    }

    const payload = {
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      doc_id: doc_id,
    }

    const response = await fetch(`${ASK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Chat request failed with status ${response.status}`
      )
    }

    const data = await response.json()
    return {
      success: true,
      data: data.answer,
      message: data.response || 'Response received',
    }
  } catch (error) {
    console.error('Chat message error:', error)
    return {
      success: false,
      error: error.message,
      message: error.message || 'Failed to send message',
    }
  }
}

/**
 * Remove a document from the server
 * @param {string} doc_id - The document ID to remove
 * @returns {Promise<Object>} - The response from the server
 */
export const removeDocument = async (doc_id) => {
  try {
    if (!doc_id) {
      throw new Error('Document ID is required')
    }

    const response = await fetch(`${REMOVE_ENDPOINT}/${doc_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `Remove failed with status ${response.status}`
      )
    }

    const data = await response.json()
    return {
      success: true,
      data: data,
      message: 'Document removed successfully',
    }
  } catch (error) {
    console.error('Document remove error:', error)
    return {
      success: false,
      error: error.message,
      message: error.message || 'Failed to remove document',
    }
  }
}

/**
 * Get upload status or document information
 * @param {string} documentId - The ID of the document
 * @returns {Promise<Object>} - Document information
 */
export const getDocumentInfo = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error('Document ID is required')
    }

    const response = await fetch(`${API_BASE_URL}/document/${documentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document info with status ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error('Get document info error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export default {
  uploadDocument,
  sendChatMessage,
  getDocumentInfo,
}
