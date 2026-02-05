'use client';

import React, { useMemo } from 'react';
import { FileCode, Folder, FileText, FileJson, Image, Settings, Package, Database, Lock, FileType } from 'lucide-react';
import { Tree, Folder as TreeFolder, File as TreeFile, TreeViewElement } from '@/components/ui/file-tree';
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern';

interface FileTreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileTreeNode[];
}

interface FileStructureProps {
  tree: FileTreeNode[];
  maxDepth?: number;
}

// Get appropriate icon based on file type
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const fileName = name.toLowerCase();
  
  if (fileName.startsWith('.') || ['config', 'rc', 'env'].some(c => fileName.includes(c))) {
    return <Settings className="size-4 text-slate-400" />;
  }
  if (fileName.includes('lock') || ext === 'lock') {
    return <Lock className="size-4 text-amber-400" />;
  }
  if (['package', 'cargo', 'gemfile', 'requirements'].some(p => fileName.includes(p))) {
    return <Package className="size-4 text-green-400" />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'rb', 'php'].includes(ext)) {
    return <FileCode className="size-4 text-blue-400" />;
  }
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) {
    return <FileJson className="size-4 text-yellow-400" />;
  }
  if (['sql', 'db', 'sqlite'].includes(ext)) {
    return <Database className="size-4 text-purple-400" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) {
    return <Image className="size-4 text-pink-400" />;
  }
  if (['md', 'mdx', 'txt', 'rst', 'doc'].includes(ext)) {
    return <FileText className="size-4 text-emerald-400" />;
  }
  
  return <FileType className="size-4 text-slate-400" />;
}

// Convert our file tree format to MagicUI TreeViewElement format
function convertToTreeElements(nodes: FileTreeNode[]): TreeViewElement[] {
  return nodes.map((node) => ({
    id: node.path,
    name: node.name,
    isSelectable: true,
    children: node.children ? convertToTreeElements(node.children) : undefined,
  }));
}

// Render tree nodes recursively
function RenderTree({ nodes, depth = 0 }: { nodes: FileTreeNode[]; depth?: number }) {
  return (
    <>
      {nodes.map((node) => {
        if (node.type === 'dir') {
          return (
            <TreeFolder key={node.path} element={node.name} value={node.path}>
              {node.children && <RenderTree nodes={node.children} depth={depth + 1} />}
            </TreeFolder>
          );
        }
        return (
          <TreeFile key={node.path} value={node.path} fileIcon={getFileIcon(node.name)}>
            {node.name}
          </TreeFile>
        );
      })}
    </>
  );
}

export function FileStructure({ tree, maxDepth = 6 }: FileStructureProps) {
  const stats = useMemo(() => {
    const countItems = (nodes: FileTreeNode[]): { files: number; dirs: number } => {
      let files = 0, dirs = 0;
      for (const node of nodes) {
        if (node.type === 'file') files++;
        else {
          dirs++;
          if (node.children) {
            const sub = countItems(node.children);
            files += sub.files;
            dirs += sub.dirs;
          }
        }
      }
      return { files, dirs };
    };
    return countItems(tree);
  }, [tree]);

  const treeElements = useMemo(() => convertToTreeElements(tree), [tree]);
  const initialExpanded = useMemo(() => {
    // Expand first level folders by default
    return tree.filter(n => n.type === 'dir').map(n => n.path);
  }, [tree]);

  return (
    <div className="w-full">
      {/* Stats header */}
      <div className="flex items-center gap-6 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <FileCode size={18} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.files}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Files</div>
          </div>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Folder size={18} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.dirs}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Directories</div>
          </div>
        </div>
      </div>

      {/* Tree visualization with interactive grid background */}
      <div className="relative rounded-2xl border border-white/10 overflow-hidden">
        {/* Interactive grid background */}
        <div className="absolute inset-0 overflow-hidden">
          <InteractiveGridPattern 
            width={30} 
            height={30} 
            squares={[20, 20]} 
            className="opacity-30"
            squaresClassName="stroke-white/5"
          />
        </div>

        {/* Tree content */}
        <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-800/70 backdrop-blur-sm">
          <Tree
            className="p-4 h-[400px] overflow-auto scrollbar-none"
            initialExpandedItems={initialExpanded}
            elements={treeElements}
          >
            {tree.length > 0 ? (
              <RenderTree nodes={tree} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Folder size={48} className="mb-4 opacity-30" />
                <p>No files found</p>
              </div>
            )}
          </Tree>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-500/50" />
          <span>Folders</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50" />
          <span>Code</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50" />
          <span>Data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
          <span>Package</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
          <span>Docs</span>
        </div>
      </div>
    </div>
  );
}
