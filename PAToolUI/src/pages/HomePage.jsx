import { useState, useRef, useEffect } from 'react'
import '../styles/HomePage.css'
import { uploadDocument, sendChatMessage, removeDocument } from '../services/documentService'

export default function HomePage() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [documentId, setDocumentId] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    // Show uploading message
    const uploadingMessage = {
      id: Date.now(),
      type: 'system',
      text: `Uploading file: ${file.name}...`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, uploadingMessage])

    // Call the upload service
    const result = await uploadDocument(file)
    if (result.success) {
      setUploadedFile(file)
      setDocumentId(result.data?.docId || result.data?.docId)

      const successMessage = {
        id: Date.now() + 1,
        type: 'system',
        text: `✓ File uploaded successfully: ${file.name} and DocumentID : ${result.data?.docId}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } else {
      setUploadError(result.message)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'system',
        text: `✗ Upload failed: ${result.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsUploading(false)
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    }

    const messageText = inputValue
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Call the chat service
    const result = await sendChatMessage(messageText,documentId)

    if (result.success) {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.data,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } else {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Error: ${result.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveDocument = async () => {
    if (!documentId) return

    setIsUploading(true)
    const result = await removeDocument(documentId)

    if (result.success) {
      setUploadedFile(null)
      setDocumentId(null)
      const successMessage = {
        id: Date.now(),
        type: 'system',
        text: '✓ Document removed successfully',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, successMessage])
    } else {
      setUploadError(result.message)
      const errorMessage = {
        id: Date.now(),
        type: 'system',
        text: `✗ Failed to remove document: ${result.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsUploading(false)
  }

  return (
    <div className="home-page">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1>PDF Analyzer</h1>
            <p>Upload your PDF and chat about its content</p>
          </div>
        </header>

        {/* Main Content */}
        <div className="main-content">
          {/* Chatbox */}
          <div className="chat-container">
            <div className="chat-header">
              <h2>Chat Assistant</h2>
              {uploadedFile && (
                <span className="file-badge">{uploadedFile.name}</span>
              )}
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <p>No messages yet</p>
                  <p className="hint">
                    Upload a file and start asking questions
                  </p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message message-${message.type}`}
                    >
                      <div className="message-content">
                        <p dangerouslySetInnerHTML={{ __html: message.text }}></p>
                        <span className="message-time">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="message message-bot">
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="message-input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || inputValue.trim() === ''}
                  className="send-btn"
                  title="Send message"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>

          {/* File Uploader */}
          <aside className="uploader-sidebar">
            <div className="uploader-card">
              <h3>Upload Document</h3>

              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                  hidden
                  disabled={isUploading}
                />
                <div
                  className={`drop-zone ${isUploading ? 'uploading' : ''}`}
                  onClick={() => !isUploading && triggerFileInput()}
                  onDragOver={(e) => {
                    if (!isUploading) {
                      e.preventDefault()
                      e.currentTarget.classList.add('drag-over')
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over')
                  }}
                  onDrop={(e) => {
                    if (!isUploading) {
                      e.preventDefault()
                      e.currentTarget.classList.remove('drag-over')
                      const files = e.dataTransfer.files
                      if (files.length > 0) {
                        fileInputRef.current.files = files
                        handleFileUpload({ target: fileInputRef.current })
                      }
                    }
                  }}
                >
                  <div className="upload-icon">{isUploading ? '⏳' : '📄'}</div>
                  <p>{isUploading ? 'Uploading...' : 'Drag and drop your file'}</p>
                  <p className="or-text">{isUploading ? '' : 'or'}</p>
                  <button 
                    type="button" 
                    className="browse-btn"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Browse Files'}
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="error-message">
                  ⚠️ {uploadError}
                </div>
              )}

              {uploadedFile && (
                <div className="uploaded-file">
                  <div className="file-info">
                    <span className="file-icon">✓</span>
                    <div>
                      <p className="file-name">{uploadedFile.name}</p>
                      <p className="file-size">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveDocument}
                    disabled={isUploading}
                    className="remove-btn"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}

              <p className="supported-formats">
                Supported: PDF, DOC, DOCX, TXT
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
