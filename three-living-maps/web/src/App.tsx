// 应用外壳：主题、路由、全局联动状态、X-Ray 覆盖层、移动端抽屉降级。
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMapStore } from '@/store/useMapStore';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { NodeDrawer } from '@/components/NodeDrawer';
import { MobileDock } from '@/components/MobileDock';
import { HomePage } from '@/pages/HomePage';
import { MapPage } from '@/pages/MapPage';
import { NodePage } from '@/pages/NodePage';
import { SourcesPage } from '@/pages/SourcesPage';
import { SourcePage } from '@/pages/SourcePage';
import { SearchPage } from '@/pages/SearchPage';
import { AssistantPage } from '@/pages/AssistantPage';
import { UpdatesPage } from '@/pages/UpdatesPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { EvalPage } from '@/pages/EvalPage';
import { AboutPage } from '@/pages/AboutPage';
import { TeamPage } from '@/pages/TeamPage';
import { AdminPage } from '@/pages/AdminPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function App() {
  const theme = useMapStore((s) => s.theme);

  // 主题应用到 <html>，并跟随系统变化（用户未手动切换时）
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // 主题默认浅色；仅当用户手动切换后（localStorage 有记录）才尊重其选择。
  // 不再跟随系统深色偏好——用户已明确要求默认浅色（2026-11-01）。

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        {/* 背景水印：校徽 SVG，固定层、极低不透明度、不拦截任何交互 */}
        <div className="site-watermark" aria-hidden="true" />
        <AppHeader />
        <main className="flex-1" id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/maps/:map" element={<MapPage />} />
            <Route path="/maps" element={<Navigate to="/maps/domain" replace />} />
            <Route path="/node/:id" element={<NodePage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/source/:id" element={<SourcePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/eval" element={<EvalPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <AppFooter />
        {/* 桌面端：右侧节点抽屉；移动端由 MobileDock 承担多维标签流 */}
        <NodeDrawer />
        <MobileDock />
      </div>
    </BrowserRouter>
  );
}