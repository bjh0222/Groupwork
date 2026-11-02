// 顶部导航：三图切换、成长罗盘、X-Ray 开关、主题切换、全局搜索。
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useMapStore } from '@/store/useMapStore';
import { api } from '@/lib/api';
import { TRACK_LABELS } from '@/lib/types';
import type { CareerTrack } from '@/lib/types';

const MAPS = [
  { id: 'domain', label: '领域地图', hint: '问题 · 概念 · 方法 · 工具 · 资源 · 课程' },
  { id: 'ecosystem', label: '生态地图', hint: '参与者 × 关系链：论文→模型方→社区→应用→使用者' },
  { id: 'cognition', label: '认知地图', hint: '认识方法 · 分析方法 · 真实案例 · 成长习惯 · 认识修正' }
] as const;

const TRACKS: { id: CareerTrack; label: string; glyph: string }[] = [
  { id: 'all', label: '全部', glyph: '◎' },
  { id: 'scientist', label: '科学家', glyph: '✦' },
  { id: 'engineer', label: '工程师', glyph: '⚙' },
  { id: 'designer', label: '设计师', glyph: '◈' }
];

export function AppHeader() {
  const navigate = useNavigate();
  const activeMap = useMapStore((s) => s.activeMap);
  const setActiveMap = useMapStore((s) => s.setActiveMap);
  const careerTrack = useMapStore((s) => s.careerTrack);
  const setCareerTrack = useMapStore((s) => s.setCareerTrack);
  const isXRayActive = useMapStore((s) => s.isXRayActive);
  const toggleXRay = useMapStore((s) => s.toggleXRay);
  const theme = useMapStore((s) => s.theme);
  const setTheme = useMapStore((s) => s.setTheme);
  const [q, setQ] = useState('');
  const [aiOn, setAiOn] = useState<boolean | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { api.aiStatus().then((s) => setAiOn(s.enabled)).catch(() => setAiOn(false)); }, []);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    navigate('/search?q=' + encodeURIComponent(v));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-subtle bg-[color:var(--surface-raised)]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5">
        {/* 第一行：标识 + 搜索 + 工具 */}
        <div className="flex items-center gap-3 py-2.5">
          <Link to="/" className="group flex flex-none items-baseline gap-2" aria-label="三张活地图 首页">
            <span className="font-serif text-[17px] font-semibold tracking-wide sm:text-[19px]">三张活地图</span>
            <span className="hidden text-[11px] text-muted sm:inline">LLM 应用开发与评估</span>
          </Link>

          <form onSubmit={doSearch} role="search" className="ml-auto flex min-w-0 flex-1 justify-end gap-2 sm:max-w-md sm:flex-none">
            <label htmlFor="global-q" className="sr-only">全站搜索节点、关系与来源</label>
            <input id="global-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="搜索节点 / 概念 / 来源…"
              className="min-w-0 flex-1 rounded-sm border border-strong bg-[color:var(--surface)] px-2.5 py-1.5 text-[13px] outline-none transition focus:border-[color:var(--accent)] sm:w-64" />
            <button type="submit" aria-label="搜索"
              className="flex-none rounded-sm border border-strong px-2.5 text-[13px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
              ⌕
            </button>
          </form>

          <div className="flex flex-none items-center gap-1">
            <button onClick={() => toggleXRay()} aria-pressed={isXRayActive}
              title={isXRayActive ? '关闭 X-Ray 透视连线（低性能设备或答辩现场网络不佳时可降级）' : '开启 X-Ray 透视连线'}
              className={'rounded-sm border px-2 py-1 text-[11.5px] transition ' +
                (isXRayActive
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                  : 'border-strong text-muted hover:text-secondary')}>
              <span aria-hidden="true">✧</span>
              <span className="ml-1 hidden sm:inline">X-Ray {isXRayActive ? '开' : '关'}</span>
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={'当前' + (theme === 'dark' ? '深色' : '浅色') + '主题，点击切换'}
              aria-label="切换明暗主题"
              className="rounded-sm border border-strong px-2 py-1 text-[11.5px] text-secondary transition hover:text-[color:var(--accent)]">
              <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
            </button>
            <button onClick={() => setNavOpen((v) => !v)} aria-expanded={navOpen} aria-controls="main-nav"
              className="rounded-sm border border-strong px-2 py-1 text-[12px] text-secondary md:hidden" aria-label="展开导航菜单">
              ☰
            </button>
          </div>
        </div>

        {/* 第二行：三图 + 罗盘（桌面常显；移动可折叠） */}
        <nav id="main-nav" aria-label="主导航"
          className={'flex-col gap-2 pb-2.5 md:flex md:flex-row md:items-center md:gap-4 md:pb-2 ' + (navOpen ? 'flex' : 'hidden')}>
          <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="三张地图">
            {MAPS.map((m) => (
              <NavLink key={m.id} to={'/maps/' + m.id} role="tab" aria-selected={activeMap === m.id}
                onClick={() => setActiveMap(m.id)} title={m.hint}
                className={({ isActive }) =>
                  'rounded-sm px-2.5 py-1 text-[13px] transition ' +
                  (isActive
                    ? 'bg-[color:var(--accent)] font-medium text-[color:var(--text-on-accent)]'
                    : 'text-secondary hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--text-primary)]')}>
                {m.label}
              </NavLink>
            ))}
          </div>

          {/* 成长罗盘 */}
          <div className="flex items-center gap-1.5 md:ml-auto" role="group" aria-label="成长路线罗盘">
            <span className="hidden text-[11px] text-muted sm:inline">成长罗盘</span>
            {TRACKS.map((t) => (
              <button key={t.id} onClick={() => setCareerTrack(t.id)} aria-pressed={careerTrack === t.id}
                title={TRACK_LABELS[t.id] + '：切换后仅聚焦该路线相关节点，其余节点弱化显示'}
                className={'rounded-full border px-2.5 py-0.5 text-[11.5px] transition ' +
                  (careerTrack === t.id
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                    : 'border-strong text-muted hover:text-secondary')}>
                <span aria-hidden="true" className="mr-1">{t.glyph}</span>{t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-secondary md:border-l md:border-subtle md:pl-4">
            <NavLink to="/assistant" className={({ isActive }) => isActive ? 'text-[color:var(--accent)]' : 'hover:text-[color:var(--accent)]'}>
              AI 助手{aiOn === false && <span className="ml-1 text-[10px] text-muted">(降级)</span>}
            </NavLink>
            <NavLink to="/sources" className={({ isActive }) => isActive ? 'text-[color:var(--accent)]' : 'hover:text-[color:var(--accent)]'}>来源库</NavLink>
            <NavLink to="/eval" className={({ isActive }) => isActive ? 'text-[color:var(--accent)]' : 'hover:text-[color:var(--accent)]'}>评测</NavLink>
            <NavLink to="/updates" className={({ isActive }) => isActive ? 'text-[color:var(--accent)]' : 'hover:text-[color:var(--accent)]'}>更新记录</NavLink>
            <NavLink to="/feedback" className={({ isActive }) => isActive ? 'text-[color:var(--accent)]' : 'hover:text-[color:var(--accent)]'}>反馈</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'text-[color:var(--accent)]' : 'hover:text-[color:var(--accent)]'}>关于</NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
}