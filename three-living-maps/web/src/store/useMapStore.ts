// 全局联动状态机（方案 §三.1）。
// 四个联动字段驱动三图透视、罗盘过滤与抽屉；写入均经选择器订阅，避免整树重渲染。
import { create } from 'zustand';
import type { CareerTrack, MapType } from '@/lib/types';

export type ActiveMap = MapType;

interface MapState {
  activeNodeId: string | null;
  activeMap: ActiveMap;
  careerTrack: CareerTrack;
  isXRayActive: boolean;
  // UI 局部状态
  theme: 'light' | 'dark';
  drawerOpen: boolean;
  mobileTab: 'domain' | 'ecosystem' | 'cognition';
  query: string;
  // 记录联动发生的时间戳，供性能实测使用（验收标准要求 <16ms）
  lastLinkageAt: number;

  setActiveNode: (id: string | null, opts?: { openDrawer?: boolean; map?: ActiveMap }) => void;
  setCareerTrack: (t: CareerTrack) => void;
  toggleXRay: (v?: boolean) => void;
  setActiveMap: (m: ActiveMap) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setDrawerOpen: (v: boolean) => void;
  closeOverlays: () => void;
  setMobileTab: (t: 'domain' | 'ecosystem' | 'cognition') => void;
  setQuery: (q: string) => void;
}

const LS_KEY = 'tlm.store.v1';

function loadPersisted(): Partial<MapState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const out: Partial<MapState> = {};
    if (p.theme === 'light' || p.theme === 'dark') out.theme = p.theme;
    if (typeof p.isXRayActive === 'boolean') out.isXRayActive = p.isXRayActive;
    if (p.careerTrack) out.careerTrack = p.careerTrack as CareerTrack;
    return out;
  } catch { return {}; }
}

function persist(s: Pick<MapState, 'theme' | 'isXRayActive' | 'careerTrack'>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* 隐私模式下忽略 */ }
}

// 默认主题：浅色（2026-11-01 用户明确要求「默认主题改为浅色」）。
// 原方案为「跟随系统」，现改为用户指令优先：未手动选择过主题时一律浅色；
// 手动切换后写入 localStorage，之后尊重用户选择。
const persisted = typeof window !== 'undefined' ? loadPersisted() : {};

export const useMapStore = create<MapState>((set, get) => ({
  activeNodeId: null,
  activeMap: 'domain',
  careerTrack: persisted.careerTrack ?? 'all',
  // 方案要求 X-Ray 默认开启
  isXRayActive: persisted.isXRayActive ?? true,
  theme: persisted.theme ?? 'light',
  drawerOpen: false,
  mobileTab: 'domain',
  query: '',
  lastLinkageAt: 0,

  setActiveNode: (id, opts) => set((s) => ({
    activeNodeId: id,
    lastLinkageAt: performance.now(),
    // 选中节点时，若该节点属于其他地图，联动切图（跨图跳转）
    activeMap: opts?.map ?? s.activeMap,
    // 取消选中（id=null）时必须同时关闭抽屉，否则覆盖层/抽屉会残留并拦截后续点击
    drawerOpen: id === null ? false : (opts?.openDrawer ?? s.drawerOpen),
    mobileTab: opts?.map ?? s.mobileTab
  })),

  /** 关闭所有浮层但保留选中节点（ESC 使用）：抽屉与底部面板收起，星群与 X-Ray 仍在。 */
  closeOverlays: () => set({ drawerOpen: false }),

  setCareerTrack: (t) => { set({ careerTrack: t }); persist({ theme: get().theme, isXRayActive: get().isXRayActive, careerTrack: t }); },

  toggleXRay: (v) => {
    const next = v === undefined ? !get().isXRayActive : v;
    set({ isXRayActive: next });
    persist({ theme: get().theme, isXRayActive: next, careerTrack: get().careerTrack });
  },

  setActiveMap: (m) => set({ activeMap: m, mobileTab: m }),
  setTheme: (t) => { set({ theme: t }); persist({ theme: t, isXRayActive: get().isXRayActive, careerTrack: get().careerTrack }); },
  setDrawerOpen: (v) => set({ drawerOpen: v }),
  setMobileTab: (t) => set({ mobileTab: t, activeMap: t }),
  setQuery: (q) => set({ query: q })
}));

// 常用选择器：只订阅需要的切片，保证联动响应在单帧内完成。
export const selectActiveNodeId = (s: MapState) => s.activeNodeId;
export const selectActiveMap = (s: MapState) => s.activeMap;
export const selectCareerTrack = (s: MapState) => s.careerTrack;
export const selectXRay = (s: MapState) => s.isXRayActive;
