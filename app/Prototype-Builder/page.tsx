'use client'

import { useState, useRef, useEffect } from 'react'
import Header from '@/components/Header'
import { Sparkles, Send, Loader, Code, Eye, ChevronDown } from 'lucide-react'
import { useModel } from '@/contexts/ModelContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type GenerationMode = 'new' | 'refinement'

export default function PrototypeBuilder() {
  const { selectedModel } = useModel()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [generationMode, setGenerationMode] = useState<GenerationMode>('new')
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)
  const modeDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false)
      }
    }

    if (isModeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModeDropdownOpen])

  // Reset to 'new' mode if no HTML exists
  useEffect(() => {
    if (!generatedHtml && generationMode === 'refinement') {
      setGenerationMode('new')
    }
  }, [generatedHtml, generationMode])

  // Function to inject navigation prevention script into HTML
  const injectNavigationPrevention = (html: string): string => {
    const preventionScript = `
      <script>
        (function() {
          // Prevent all link navigation
          document.addEventListener('click', function(e) {
            const target = e.target.closest('a, button[type="submit"], form');
            if (target) {
              // If it's a link, prevent navigation
              if (target.tagName === 'A' && target.href) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Navigation prevented:', target.href);
                return false;
              }
              // If it's a form, prevent submission
              if (target.tagName === 'FORM') {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
              // If it's a submit button, prevent form submission
              if (target.tagName === 'BUTTON' && target.type === 'submit') {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }
          }, true);
          
          // Prevent form submissions
          document.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }, true);
        })();
      </script>
    `
    
    // Insert script before closing body tag, or before closing head if no body
    if (html.includes('</body>')) {
      return html.replace('</body>', preventionScript + '</body>')
    } else if (html.includes('</head>')) {
      return html.replace('</head>', preventionScript + '</head>')
    } else {
      // If no body or head, append at the end
      return html + preventionScript
    }
  }

  const handleGenerate = async () => {
    if (!currentPrompt.trim() || isGenerating) return

    const promptToSend = currentPrompt.trim()
    const isRefinement = generationMode === 'refinement' && generatedHtml
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: isRefinement ? `[Refinement] ${promptToSend}` : promptToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setCurrentPrompt('')
    setIsGenerating(true)
    
    // Only clear HTML if it's a new generation
    if (!isRefinement) {
      setGeneratedHtml('')
    }

    try {
      const response = await fetch('/api/generate-prototype', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: promptToSend, 
          model: selectedModel,
          mode: generationMode,
          existingHtml: isRefinement ? generatedHtml : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prototype')
      }

      const data = await response.json()
      // Inject script to prevent navigation on links and buttons
      const htmlWithNavigationPrevention = injectNavigationPrevention(data.html)
      setGeneratedHtml(htmlWithNavigationPrevention)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isRefinement 
          ? 'I&apos;ve refined your prototype! Check the updated preview on the right.'
          : 'I&apos;ve generated your prototype! Check the preview on the right.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Error generating prototype:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setViewMode('preview')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <>
      <div className="main-wrapper prototype-builder-layout">
        <Header />
        <div className="prototype-split-container">
          {/* Left Side - Chat */}
          <div className="prototype-chat-panel">
            <div className="chat-header">
              <div className="chat-header-content">
                <Sparkles className="chat-header-icon" />
                <div>
                  <h2 className="chat-title">Prototype Builder</h2>
                  <p className="chat-subtitle">Describe what you want to build</p>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty-state">
                  <div className="empty-state-icon">
                    <Sparkles className="empty-icon" />
                  </div>
                  <h3 className="empty-state-title">Start Building</h3>
                  <p className="empty-state-text">
                    Describe your prototype idea and I&apos;ll generate the HTML code for you.
                  </p>
                  <div className="example-prompts">
                    <p className="example-title">Try examples like:</p>
                    <div className="example-tag" onClick={() => setCurrentPrompt('A modern landing page for a SaaS product with a hero section, features grid, and pricing table')}>
                      SaaS Landing Page
                    </div>
                    <div className="example-tag" onClick={() => setCurrentPrompt('An e-commerce product page with image gallery, product details, and add to cart button')}>
                      E-commerce Page
                    </div>
                    <div className="example-tag" onClick={() => setCurrentPrompt('A dashboard with charts, statistics cards, and a sidebar navigation')}>
                      Dashboard
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="chat-message assistant-message">
                  <div className="message-content">
                    <div className="generating-indicator">
                      <Loader className="generating-spinner" />
                      <span>Generating your prototype...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-container">
              <div className="mode-selector-wrapper" ref={modeDropdownRef}>
                <button
                  className="mode-selector-button"
                  onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                  disabled={isGenerating}
                >
                  <span className="mode-selector-label">
                    {generationMode === 'new' ? 'New' : 'Refinement'}
                  </span>
                  <ChevronDown className={`mode-selector-icon ${isModeDropdownOpen ? 'rotated' : ''}`} />
                </button>
                {isModeDropdownOpen && (
                  <div className="mode-selector-dropdown">
                    <button
                      className={`mode-selector-item ${generationMode === 'new' ? 'active' : ''}`}
                      onClick={() => {
                        setGenerationMode('new')
                        setIsModeDropdownOpen(false)
                      }}
                    >
                      New
                    </button>
                    <button
                      className={`mode-selector-item ${generationMode === 'refinement' ? 'active' : ''} ${!generatedHtml ? 'disabled' : ''}`}
                      onClick={() => {
                        if (generatedHtml) {
                          setGenerationMode('refinement')
                          setIsModeDropdownOpen(false)
                        }
                      }}
                      disabled={!generatedHtml}
                    >
                      Refinement
                      {!generatedHtml && <span className="mode-hint">(Generate first)</span>}
                    </button>
                  </div>
                )}
              </div>
              <div className="chat-input-box">
                <textarea
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    generationMode === 'refinement'
                      ? "Describe what you want to change... (Press Enter to send, Shift+Enter for new line)"
                      : "Describe your prototype... (Press Enter to send, Shift+Enter for new line)"
                  }
                  className="chat-input"
                  rows={3}
                  disabled={isGenerating}
                />
                <button
                  onClick={handleGenerate}
                  disabled={!currentPrompt.trim() || isGenerating}
                  className="chat-send-button"
                >
                  {isGenerating ? (
                    <Loader className="send-icon spinning" />
                  ) : (
                    <Send className="send-icon" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="prototype-preview-panel">
            <div className="preview-header">
              <h2 className="preview-title">Preview</h2>
              {generatedHtml && (
                <div className="view-mode-toggle">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`view-mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
                  >
                    <Eye className="view-icon" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`view-mode-btn ${viewMode === 'code' ? 'active' : ''}`}
                  >
                    <Code className="view-icon" />
                    <span>Code</span>
                  </button>
                </div>
              )}
            </div>

            <div className="preview-content">
              {!generatedHtml && !isGenerating && (
                <div className="preview-empty-state">
                  <div className="preview-empty-icon">
                    <Eye className="empty-preview-icon" />
                  </div>
                  <h3 className="preview-empty-title">No Preview Yet</h3>
                  <p className="preview-empty-text">
                    Your generated prototype will appear here
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="preview-loading">
                  <Loader className="preview-loading-spinner" />
                  <p className="preview-loading-text">Generating your prototype...</p>
                  <p className="preview-loading-subtext">This may take a few moments</p>
                </div>
              )}

              {generatedHtml && !isGenerating && (
                <>
                  {viewMode === 'preview' ? (
                    <iframe
                      srcDoc={generatedHtml}
                      className="prototype-iframe"
                      title="Prototype Preview"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <pre className="code-view">
                      <code>{generatedHtml}</code>
                    </pre>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
