import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { api } from '../config/api.js';
import { queryClient, QUERY_KEYS } from '../config/queryClient.js';
import DecisionNode from '../components/graph/DecisionNode.jsx';
import DecisionEdge from '../components/graph/DecisionEdge.jsx';
import GraphToolbar from '../components/graph/GraphToolbar.jsx';
import BlameChainPanel from '../components/graph/BlameChainPanel.jsx';

const NODE_TYPES = { decisionNode: DecisionNode };
const EDGE_TYPES = { decisionEdge: DecisionEdge };

const COLUMN_GAP = 290;
const ROW_GAP = 170;

// Tidy layout: places nodes by DAG depth (topological levels) while keeping
// branch-column grouping for unconnected nodes.
function tidyLayout(decisions) {
  const idMap = {};
  decisions.forEach(d => { idMap[d.id] = d; });

  // Build adjacency: children[id] = ids that list id in their influencedBy
  const children = {};   // id → [ids that depend on it]
  const parents  = {};   // id → [ids it was influenced by]
  decisions.forEach(d => {
    children[d.id] = children[d.id] || [];
    parents[d.id]  = parents[d.id]  || [];
    (d.influencedBy || []).forEach(link => {
      children[link.decisionId] = children[link.decisionId] || [];
      children[link.decisionId].push(d.id);
      parents[d.id].push(link.decisionId);
    });
  });

  // Find nodes that are part of any edge
  const connected = new Set();
  decisions.forEach(d => {
    if ((d.influencedBy || []).length > 0) {
      connected.add(d.id);
      d.influencedBy.forEach(l => connected.add(l.decisionId));
    }
  });

  // Kahn's algorithm → assign depth level to each connected node
  const depth = {};
  const inDeg  = {};
  decisions.forEach(d => { inDeg[d.id] = (parents[d.id] || []).length; });

  const queue = decisions.filter(d => connected.has(d.id) && inDeg[d.id] === 0).map(d => d.id);
  queue.forEach(id => { depth[id] = 0; });

  while (queue.length > 0) {
    const id = queue.shift();
    (children[id] || []).forEach(cid => {
      depth[cid] = Math.max(depth[cid] ?? 0, (depth[id] ?? 0) + 1);
      inDeg[cid]--;
      if (inDeg[cid] === 0) queue.push(cid);
    });
  }

  // Group connected nodes by level, then assign x within each level
  const byLevel = {};
  connected.forEach(id => {
    const lvl = depth[id] ?? 0;
    byLevel[lvl] = byLevel[lvl] || [];
    byLevel[lvl].push(id);
  });

  const NODE_W = 260;  // approximate node width for spacing
  const positions = {};

  Object.entries(byLevel).forEach(([lvl, ids]) => {
    const y = Number(lvl) * ROW_GAP;
    const totalW = ids.length * NODE_W;
    ids.forEach((id, i) => {
      positions[id] = { x: i * NODE_W - totalW / 2 + NODE_W / 2, y };
    });
  });

  // Unconnected nodes: keep branch-column layout below the DAG
  const MAIN_BRANCH = 'main';
  const branches = [...new Set(decisions.map(d => d.branch_name))].sort();
  const otherBranches = branches.filter(b => b !== MAIN_BRANCH);
  const branchCol = { [MAIN_BRANCH]: 0 };
  otherBranches.forEach((b, i) => {
    branchCol[b] = (i % 2 === 0 ? 1 : -1) * (Math.floor(i / 2) + 1);
  });

  const maxDAGY = Object.keys(byLevel).length > 0
    ? (Math.max(...Object.keys(byLevel).map(Number)) + 2) * ROW_GAP
    : 0;

  const branchRowCounter = {};
  decisions.forEach(d => {
    if (connected.has(d.id)) return;
    const col = branchCol[d.branch_name] ?? 0;
    branchRowCounter[d.branch_name] = branchRowCounter[d.branch_name] || 0;
    positions[d.id] = { x: col * COLUMN_GAP, y: maxDAGY + branchRowCounter[d.branch_name] * ROW_GAP };
    branchRowCounter[d.branch_name]++;
  });

  return positions;
}

function buildLayout(decisions, savedPositions) {
  const byBranch = {};
  decisions.forEach(d => {
    if (!byBranch[d.branch_name]) byBranch[d.branch_name] = [];
    byBranch[d.branch_name].push(d);
  });
  Object.values(byBranch).forEach(arr =>
    arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  );

  // Main branch always in center (column 0).
  // What-if branches spread alternately left/right: col -1, +1, -2, +2, …
  const MAIN_BRANCH = 'main';
  const otherBranches = Object.keys(byBranch)
    .filter(b => b !== MAIN_BRANCH)
    .sort(); // stable order so layout doesn't shuffle on re-render

  const branchCol = { [MAIN_BRANCH]: 0 };
  otherBranches.forEach((b, i) => {
    const side = i % 2 === 0 ? 1 : -1;          // right first, then left
    const distance = Math.floor(i / 2) + 1;
    branchCol[b] = side * distance;
  });

  return decisions.map(d => {
    const col = branchCol[d.branch_name] ?? 0;
    const row = byBranch[d.branch_name].indexOf(d);
    const saved = savedPositions[d.id];
    return {
      id: d.id,
      type: 'decisionNode',
      position: saved || { x: col * COLUMN_GAP, y: row * ROW_GAP },
      data: { ...d },
    };
  });
}

function buildEdges(decisions) {
  const brokenIds = new Set(decisions.filter(d => d.blameStatus === 'broken').map(d => d.id));
  const edges = [];
  decisions.forEach(d => {
    (d.influencedBy || []).forEach(link => {
      edges.push({
        id: `${link.decisionId}->${d.id}`,
        source: link.decisionId,
        target: d.id,
        type: 'decisionEdge',
        data: { note: link.note, sourceBroken: brokenIds.has(link.decisionId) },
        animated: d.blameStatus === 'broken',
      });
    });
  });
  return edges;
}

function getSavedPositions(userId) {
  try { return JSON.parse(localStorage.getItem(`graph_positions_${userId}`) || '{}'); }
  catch { return {}; }
}
function savePosition(userId, nodeId, position) {
  const p = getSavedPositions(userId);
  p[nodeId] = position;
  localStorage.setItem(`graph_positions_${userId}`, JSON.stringify(p));
}
function hasSeenOnboarding() {
  return localStorage.getItem('graph_onboarding_seen') === '1';
}
function markOnboardingSeen() {
  localStorage.setItem('graph_onboarding_seen', '1');
}

// ── Onboarding overlay ──────────────────────────────────────────────────────
function OnboardingOverlay({ onDismiss }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'oklch(12% 0.02 260 / 0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: 'white', borderRadius: 18, padding: '32px 36px', maxWidth: 440,
        boxShadow: '0 24px 64px oklch(20% 0.05 260 / 0.25)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 40, marginBottom: 14 }}>◈</div>

        <div style={{ fontSize: 18, fontWeight: 800, color: 'oklch(18% 0.015 260)', marginBottom: 10 }}>
          Your Life Graph
        </div>
        <div style={{ fontSize: 13.5, color: 'oklch(44% 0.01 260)', lineHeight: 1.7, marginBottom: 24 }}>
          Every decision you've logged is a <strong>node</strong>. The goal is to draw
          edges between them — "this decision caused that one".<br /><br />
          Over time you'll see which choices were <strong>load-bearing</strong> (many
          things depend on them), which were dead ends, and trace exactly which
          past decision broke something in your life today.
        </div>

        {/* Step-by-step */}
        <div style={{ background: 'oklch(97% 0.006 260)', borderRadius: 10, padding: '14px 18px', marginBottom: 22, textAlign: 'left' }}>
          {[
            ['1', 'Click any node to select it'],
            ['2', 'In the side panel, click "Link an influence"'],
            ['3', 'Click a second node — a causal edge is drawn'],
            ['4', 'Mark decisions as "broken" to trace blame chains'],
          ].map(([n, txt]) => (
            <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: n === '4' ? 0 : 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'oklch(52% 0.2 260)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</span>
              <span style={{ fontSize: 13, color: 'oklch(30% 0.01 260)', lineHeight: 1.45 }}>{txt}</span>
            </div>
          ))}
        </div>

        <button onClick={onDismiss} style={{
          width: '100%', padding: '11px', borderRadius: 10, border: 'none',
          background: 'oklch(52% 0.2 260)', color: 'white',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px oklch(52% 0.2 260 / 0.35)',
        }}>
          Got it — show me my graph
        </button>
      </div>
    </div>
  );
}

// ── Connect-mode banner ──────────────────────────────────────────────────────
function ConnectBanner({ sourceNode, onCancel }) {
  const srcText = sourceNode?.data?.decision || 'this decision';
  const truncated = srcText.length > 50 ? srcText.slice(0, 47) + '…' : srcText;
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      background: 'oklch(52% 0.2 260)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      padding: '10px 20px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
    }}>
      <span style={{ opacity: 0.8 }}>↗</span>
      <span>
        <strong>"{truncated}"</strong> was influenced by…
        <span style={{ opacity: 0.75, marginLeft: 6 }}>Click any other node to link it.</span>
      </span>
      <button onClick={onCancel} style={{
        marginLeft: 'auto', padding: '4px 12px', borderRadius: 6,
        border: '1px solid oklch(100% 0 0 / 0.35)', background: 'transparent',
        color: 'white', fontSize: 12.5, cursor: 'pointer', fontWeight: 500,
      }}>
        Cancel
      </button>
    </div>
  );
}

// ── Note popover ─────────────────────────────────────────────────────────────
function NotePopover({ source, target, onConfirm, onCancel, saving }) {
  const [note, setNote] = useState('');
  const srcText = source?.data?.decision || '';
  const tgtText = target?.data?.decision || '';
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'oklch(15% 0.02 260 / 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      backdropFilter: 'blur(5px)',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 14, padding: 24, width: 380,
        boxShadow: '0 16px 48px oklch(25% 0.05 260 / 0.2)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'oklch(18% 0.015 260)', marginBottom: 4 }}>
          Add causal link
        </div>

        {/* Visual relationship summary */}
        <div style={{ background: 'oklch(97% 0.006 260)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
          <div style={{ color: 'oklch(52% 0.2 260)', fontWeight: 600, marginBottom: 4 }}>Influence</div>
          <div style={{ color: 'oklch(28% 0.01 260)', marginBottom: 6, lineHeight: 1.4 }}>
            {srcText.length > 55 ? srcText.slice(0, 52) + '…' : srcText}
          </div>
          <div style={{ color: 'oklch(62% 0.01 260)', fontSize: 11, marginBottom: 4 }}>↓ influenced</div>
          <div style={{ color: 'oklch(28% 0.01 260)', fontWeight: 500, lineHeight: 1.4 }}>
            {tgtText.length > 55 ? tgtText.slice(0, 52) + '…' : tgtText}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'oklch(52% 0.01 260)', marginBottom: 6 }}>
          Why? <span style={{ opacity: 0.7 }}>(optional)</span>
        </div>
        <textarea
          autoFocus
          placeholder="e.g. Took this job because I'd already signed the lease…"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid oklch(88% 0.008 260)', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(20% 0.015 260)', boxSizing: 'border-box', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'}
          onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) onConfirm(note); }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 13, cursor: 'pointer', color: 'oklch(44% 0.01 260)' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(note)} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'oklch(52% 0.2 260)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Link decisions'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main canvas ──────────────────────────────────────────────────────────────
function GraphCanvas({ decisions, currentUser }) {
  const userId = currentUser?.id || currentUser?.userId || 'anon';
  const savedPositions = getSavedPositions(userId);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildLayout(decisions, savedPositions));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(decisions));

  const [mode, setMode] = useState('graph');
  const [loadBearingOnly, setLoadBearingOnly] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Click-based connect mode
  const [connectSourceId, setConnectSourceId] = useState(null);   // node we're linking FROM (the "influenced" decision)
  const [pendingLink, setPendingLink] = useState(null);            // { source: node, target: node }
  const [savingLink, setSavingLink] = useState(false);

  const { fitView } = useReactFlow();

  // Sync nodes/edges when data reloads
  useEffect(() => {
    const pos = getSavedPositions(userId);
    setNodes(buildLayout(decisions, pos));
    setEdges(buildEdges(decisions));
  }, [decisions]);

  const onNodeDragStop = useCallback((_, node) => {
    savePosition(userId, node.id, node.position);
  }, [userId]);

  const handleTidy = useCallback(() => {
    const positions = tidyLayout(decisions);
    setNodes(prev => prev.map(n => ({
      ...n,
      position: positions[n.id] ?? n.position,
    })));
    // Persist tidy positions
    Object.entries(positions).forEach(([id, pos]) => savePosition(userId, id, pos));
    // Fit view after a brief paint delay
    setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 60);
  }, [decisions, userId, fitView]);

  // Handle node clicks — two modes: normal select vs connect-mode pick
  const handleNodeClick = useCallback((_, node) => {
    if (connectSourceId) {
      if (node.id === connectSourceId) {
        // clicked the same node — cancel
        setConnectSourceId(null);
        return;
      }
      // Target selected — open note popover
      const sourceNode = nodes.find(n => n.id === connectSourceId);
      setPendingLink({ source: sourceNode, target: node });
      setConnectSourceId(null);
      return;
    }
    // Normal mode — select/deselect
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
  }, [connectSourceId, nodes]);

  const confirmLink = async (note) => {
    if (!pendingLink) return;
    setSavingLink(true);
    try {
      // pendingLink.target was "influenced by" pendingLink.source
      await api.updateDecisionLinks(
        pendingLink.target.id,
        [{ decisionId: pendingLink.source.id, note: note.trim() || '' }],
        []
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decisionGraph });
      setPendingLink(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingLink(false);
    }
  };

  const cancelLink = () => {
    setPendingLink(null);
    setConnectSourceId(null);
  };

  // Handle-drag connect (blue dot → blue dot)
  const onConnect = useCallback((connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) return;
    // source handle is "bottom" (source position), target handle is "top" (target position)
    // Semantics: target was influenced by source
    setPendingLink({ source: sourceNode, target: targetNode });
  }, [nodes]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const connectSourceNode = connectSourceId ? nodes.find(n => n.id === connectSourceId) : null;

  // Visual: mark connecting nodes
  const displayNodes = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      isConnectSource: n.id === connectSourceId,
      isConnectTarget: connectSourceId && n.id !== connectSourceId,
      isSelected: n.id === selectedNodeId,
    },
  }));

  // Filter nodes by mode
  const visibleNodes = (() => {
    if (mode === 'blame') {
      const brokenIds = new Set(nodes.filter(n => n.data?.blameStatus === 'broken').map(n => n.id));
      if (brokenIds.size === 0) return displayNodes;
      const visible = new Set(brokenIds);
      let frontier = [...brokenIds];
      for (let i = 0; i < 10 && frontier.length > 0; i++) {
        const next = [];
        for (const id of frontier) {
          const n = nodes.find(n => n.id === id);
          for (const e of (n?.data?.influencedBy || [])) {
            if (!visible.has(e.decisionId)) { visible.add(e.decisionId); next.push(e.decisionId); }
          }
        }
        frontier = next;
      }
      return displayNodes.filter(n => visible.has(n.id));
    }
    if (loadBearingOnly) return displayNodes.filter(n => (n.data?.dependentCount || 0) >= 3);
    return displayNodes;
  })();

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));

  const hasEdges = edges.length > 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Connect mode banner */}
      {connectSourceId && (
        <ConnectBanner sourceNode={connectSourceNode} onCancel={() => setConnectSourceId(null)} />
      )}

      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onPaneClick={() => {
          if (!connectSourceId) setSelectedNodeId(null);
        }}
        connectOnClick={false}
        nodesDraggable={!connectSourceId}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        deleteKeyCode={null}
        style={{ background: 'oklch(98% 0.004 260)', paddingTop: connectSourceId ? 44 : 0, transition: 'padding-top 0.15s' }}
      >
        <Background color="oklch(86% 0.004 260)" gap={24} size={1} />
        <Controls style={{ bottom: 56, left: 16 }} />
        <MiniMap
          nodeColor={n => n.data?.blameStatus === 'broken' ? 'oklch(60% 0.18 30)' : n.data?.dependentCount >= 3 ? 'oklch(52% 0.18 290)' : 'oklch(68% 0.12 260)'}
          style={{ bottom: 12, right: selectedNodeId ? 356 : 12, transition: 'right 0.2s' }}
        />
        <GraphToolbar
          mode={mode}
          onModeChange={setMode}
          loadBearingOnly={loadBearingOnly}
          onLoadBearingToggle={() => setLoadBearingOnly(v => !v)}
          onTidy={handleTidy}
        />
      </ReactFlow>

      {/* Hint when no edges yet */}
      {!hasEdges && !connectSourceId && !selectedNodeId && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'white', borderRadius: 10, padding: '10px 18px',
          boxShadow: '0 4px 20px oklch(25% 0.05 260 / 0.14)',
          border: '1px solid oklch(90% 0.01 260)',
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'oklch(44% 0.01 260)',
          pointerEvents: 'none', zIndex: 5, whiteSpace: 'nowrap',
        }}>
          👆 Click any node to select it, then use the panel to link decisions
        </div>
      )}

      {/* Note popover */}
      {pendingLink && (
        <NotePopover
          source={pendingLink.source}
          target={pendingLink.target}
          onConfirm={confirmLink}
          onCancel={cancelLink}
          saving={savingLink}
        />
      )}

      {/* Side panel */}
      {selectedNode && !connectSourceId && (
        <BlameChainPanel
          node={{ ...selectedNode.data, id: selectedNode.id }}
          allNodes={nodes}
          onClose={() => setSelectedNodeId(null)}
          onConnectMode={() => {
            // Enter connect mode: the selected node is the TARGET (it was "influenced by" something)
            setConnectSourceId(selectedNode.id);
            setSelectedNodeId(null);
          }}
        />
      )}
    </div>
  );
}

// ── Page wrapper ─────────────────────────────────────────────────────────────
export default function GraphPage({ currentUser }) {
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding());

  const { data: decisions = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.decisionGraph,
    queryFn: () => api.getDecisionsForGraph(),
    staleTime: 30_000,
  });

  const dismissOnboarding = () => {
    markOnboardingSeen();
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(55% 0.01 260)', fontSize: 14 }}>
        Loading your decision graph…
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(52% 0.18 30)', fontSize: 14 }}>
        Failed to load graph. Please try again.
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40 }}>◈</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'oklch(28% 0.015 260)' }}>No decisions yet</div>
        <div style={{ fontSize: 13.5, color: 'oklch(55% 0.01 260)', maxWidth: 320, lineHeight: 1.65 }}>
          Make your first commit on the Feed, then come back here to connect your decisions into a causal graph.
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlowProvider>
        <GraphCanvas decisions={decisions} currentUser={currentUser} />
      </ReactFlowProvider>
      {showOnboarding && <OnboardingOverlay onDismiss={dismissOnboarding} />}
    </div>
  );
}
