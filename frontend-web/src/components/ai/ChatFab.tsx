'use client';

import { Bot, GripHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAIAssistantStore } from '@/store/aiAssistantStore';
import { ChatPanel } from './ChatPanel';
import styles from './ChatFab.module.css';

const FAB_SIZE = 52;
const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 560;
const PANEL_GAP = 12;
const VIEWPORT_MARGIN = 16;
const MOBILE_BOTTOM_MARGIN = 88;

type Position = { x: number; y: number };
type PanelMetrics = Position & { width: number; height: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function viewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function bottomMargin() {
  if (typeof window === 'undefined') return VIEWPORT_MARGIN;
  return window.innerWidth <= 820 ? MOBILE_BOTTOM_MARGIN : 24;
}

function defaultFabPosition(): Position {
  if (typeof window === 'undefined') return { x: 24, y: 24 };
  const size = viewport();
  return {
    x: size.width - FAB_SIZE - 24,
    y: size.height - FAB_SIZE - bottomMargin(),
  };
}

function constrain(position: Position): Position {
  if (typeof window === 'undefined') return position;
  const size = viewport();
  return {
    x: clamp(position.x, VIEWPORT_MARGIN, size.width - FAB_SIZE - VIEWPORT_MARGIN),
    y: clamp(position.y, VIEWPORT_MARGIN, size.height - FAB_SIZE - bottomMargin()),
  };
}

function panelMetrics(fab: Position): PanelMetrics {
  const size = viewport();
  const width = Math.min(PANEL_WIDTH, size.width - VIEWPORT_MARGIN * 2);
  const height = Math.min(PANEL_HEIGHT, size.height - VIEWPORT_MARGIN * 2 - FAB_SIZE - PANEL_GAP);
  return {
    x: clamp(fab.x + FAB_SIZE - width, VIEWPORT_MARGIN, size.width - width - VIEWPORT_MARGIN),
    y: clamp(fab.y - height - PANEL_GAP, VIEWPORT_MARGIN, size.height - height - bottomMargin()),
    width,
    height,
  };
}

function openFabPosition(panel: PanelMetrics): Position {
  const size = viewport();
  const rightX = panel.x + panel.width + PANEL_GAP;
  if (rightX <= size.width - FAB_SIZE - VIEWPORT_MARGIN) {
    return { x: rightX, y: clamp(panel.y, VIEWPORT_MARGIN, size.height - FAB_SIZE - bottomMargin()) };
  }
  return {
    x: clamp(panel.x + panel.width - FAB_SIZE - 8, VIEWPORT_MARGIN, size.width - FAB_SIZE - VIEWPORT_MARGIN),
    y: clamp(panel.y + 8, VIEWPORT_MARGIN, size.height - FAB_SIZE - bottomMargin()),
  };
}

export function ChatFab() {
  const pathname = usePathname();
  const open = useAIAssistantStore((state) => state.open);
  const setOpen = useAIAssistantStore((state) => state.setOpen);
  const [fab, setFab] = useState<Position | null>(null);
  const draggedRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const hidden = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  useEffect(() => {
    const onResize = () => setFab((position) => (position ? constrain(position) : null));
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  if (hidden) return null;

  const fabPosition = fab ?? defaultFabPosition();
  const panel = panelMetrics(fabPosition);
  const button = open ? openFabPosition(panel) : fabPosition;

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const origin = fab ?? { x: rect.left, y: rect.top };
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
    };
    draggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) draggedRef.current = true;
    setFab(constrain({ x: drag.originX + deltaX, y: drag.originY + deltaY }));
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <>
      {open && (
        <div className={styles.panel} style={{ left: panel.x, top: panel.y }} role="dialog" aria-label="Taoyuan Air AI">
          <div
            className={styles.dragHandle}
            title="拖曳移動"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <GripHorizontal size={18} />
          </div>
          <ChatPanel />
        </div>
      )}
      <button
        className={styles.fab}
        type="button"
        style={open || fab ? { left: button.x, top: button.y } : undefined}
        aria-label={open ? '關閉 AI 對話' : '開啟 AI 對話'}
        aria-expanded={open}
        title={open ? '關閉 AI 對話' : '開啟 AI 對話'}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          setOpen(!open);
        }}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </>
  );
}
