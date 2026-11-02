import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center px-4 py-20 text-center">
      <div className="font-serif text-[40px] text-[color:var(--accent)]">404</div>
      <h1 className="mt-2 font-serif text-[20px]">页面不存在</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-secondary">
        你访问的地址没有对应内容。可能是链接有误，或该节点已下架。
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/" className="rounded-sm bg-[color:var(--accent)] px-4 py-2 text-[13px] text-[color:var(--text-on-accent)] transition hover:bg-[color:var(--accent-strong)]">返回首页</Link>
        <Link to="/maps/domain" className="rounded-sm border border-strong px-4 py-2 text-[13px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">领域地图</Link>
        <Link to="/search" className="rounded-sm border border-strong px-4 py-2 text-[13px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">搜索</Link>
      </div>
    </div>
  );
}