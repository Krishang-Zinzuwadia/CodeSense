'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  diagramCode: string;
  title?: string;
}

declare global {
  interface Window {
    mermaid?: any;
  }
}

// Sanitize diagram code for Mermaid v10.9.5 compatibility
function sanitizeMermaidCode(code: string): string {
  if (!code) return 'flowchart TD\n  A["No diagram"]';
  
  return code
    // Remove HTML tags that cause syntax errors
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    // Remove emojis
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    // Restore newlines after arrow definitions
    .replace(/\s+(-->|---)/g, '\n  $1')
    .replace(/(-->|---)\s+/g, '$1 ')
    // Make sure flowchart starts on its own line
    .replace(/^(flowchart|graph)\s+(TD|LR|TB|BT)/i, '$1 $2\n  ')
    .trim();
}

export function MermaidDiagram({ diagramCode, title = 'Architecture' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [sanitizedCode, setSanitizedCode] = useState<string>('');

  useEffect(() => {
    // Sanitize on client side as final safeguard
    const cleaned = sanitizeMermaidCode(diagramCode);
    setSanitizedCode(cleaned);
    setError(null);
  }, [diagramCode]);

  useEffect(() => {
    if (!containerRef.current || !sanitizedCode) return;

    const loadMermaid = async () => {
      // Dynamically load mermaid if not already loaded
      if (!window.mermaid) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.async = true;
        script.onload = () => {
          if (window.mermaid) {
            window.mermaid.initialize({ 
              startOnLoad: false, 
              theme: 'dark',
              securityLevel: 'strict',
              flowchart: {
                htmlLabels: false,
                useMaxWidth: true,
                curve: 'basis'
              },
              // Disable the menu/toolbar
              maxTextSize: 90000,
              suppressErrorRendering: true
            });
            renderDiagram();
          }
        };
        document.head.appendChild(script);
      } else {
        renderDiagram();
      }
    };

    const renderDiagram = async () => {
      if (!window.mermaid || !containerRef.current) return;
      
      try {
        // Clear previous content
        const mermaidDiv = containerRef.current.querySelector('.mermaid');
        if (mermaidDiv) {
          mermaidDiv.innerHTML = sanitizedCode;
          mermaidDiv.removeAttribute('data-processed');
        }
        
        await window.mermaid.run({
          nodes: containerRef.current.querySelectorAll('.mermaid'),
        });
        setError(null);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(err?.message || 'Failed to render diagram');
      }
    };

    loadMermaid();
  }, [sanitizedCode]);

  return (
    <div className="w-full">
      {/* Hide mermaid's menu icons */}
      <style jsx global>{`
        .mermaid-menu, 
        .mermaid svg > g.label foreignObject,
        [id*="mermaid"] .menu,
        .mermaid .node .label foreignObject > div > span > button,
        #mermaid-zoom-reset, 
        #mermaid-zoom-in, 
        #mermaid-zoom-out,
        .mermaid svg foreignObject button {
          display: none !important;
        }
      `}</style>
      
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400">AI-generated architecture visualization</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="rounded-xl border border-white/10 bg-black/30 p-6 overflow-x-auto scrollbar-none [&_.mermaid-menu]:hidden [&_foreignObject_button]:hidden"
        style={{ minHeight: '400px' }}
      >
        {error ? (
          <div className="text-red-400 p-4">
            <p className="font-semibold">Diagram rendering error:</p>
            <p className="text-sm mt-1">{error}</p>
            <details className="mt-4 text-xs text-slate-500">
              <summary>Show raw code</summary>
              <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto max-h-64">
                {sanitizedCode}
              </pre>
            </details>
          </div>
        ) : (
          <div className="mermaid [&_button]:hidden [&_.menu]:hidden">
            {sanitizedCode}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Generated by analyzing the repository structure and code
      </p>
    </div>
  );
}
