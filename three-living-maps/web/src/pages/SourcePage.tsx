// 单个来源详情：深链接可刷新，展示完整字段与引用它的节点。
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { ErrorState, ExternalLink, Loading, Tag } from '@/lib/ui';

const TYPE_LABEL: Record<string, string> = {
  paper: '论文', official_doc: '官方文档', pricing: '官方定价', curriculum: '培养方案',
  project_doc: '项目资料', community: '社区/机构', benchmark: '运行记录', tool_doc: '工具文档'
};

export function SourcePage() {
  const { id } = useParams();
  const { data, loading, error, retry } = useAsync(() => api.source(id || ''), [id]);

  if (loading && !data) return <div className="mx-auto max-w-[900px] px-4 py-10"><Loading /></div>;
  if (error || !data?.source) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-10">
        <ErrorState message={error || '来源不存在'} onRetry={retry} />
        <div className="mt-4 text-center"><Link to="/sources" className="text-[13px] underline decoration-dotted">返回来源库</Link></div>
      </div>
    );
  }
  const s = data.source;

  return (
    <div className="mx-auto max-w-[900px] px-3 py-5 sm:px-5">
      <nav aria-label="面包屑" className="mb-3 text-[11.5px] text-muted">
        <Link to="/" className="hover:text-[color:var(--accent)]">首页</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/sources" className="hover:text-[color:var(--accent)]">来源库</Link>
        <span aria-hidden="true"> / </span>
        <span className="font-mono">{s.id}</span>
      </nav>

      <article className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] text-muted">{s.id}</span>
          <Tag tone="muted">{TYPE_LABEL[s.source_type] || s.source_type}</Tag>
        </div>
        <h1 className="mt-1 font-serif text-[20px] leading-snug sm:text-[23px]">{s.title}</h1>

        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
          {s.publisher && <><dt className="text-muted">发布机构</dt><dd className="text-secondary">{s.publisher}</dd></>}
          {s.author && <><dt className="text-muted">作者</dt><dd className="text-secondary">{s.author}</dd></>}
          <dt className="text-muted">原始 URL</dt>
          <dd>{s.url ? <ExternalLink href={s.url} className="text-[color:var(--accent)]">{s.url}</ExternalLink> : <span className="text-muted">无（本地项目资料）</span>}</dd>
          {s.published_at && <><dt className="text-muted">发布日期</dt><dd className="text-secondary">{s.published_at}</dd></>}
          <dt className="text-muted">访问日期</dt><dd className="text-secondary">{s.accessed_at}</dd>
          {(s.source_type === 'pricing' || s.source_type === 'official_doc') && (
            <><dt className="text-muted">快变量</dt><dd className="text-[color:var(--ev-partial)]">是 · 超过 4 周未复核将提示「信息可能过期」</dd></>
          )}
        </dl>

        {s.supports && s.supports.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-1.5 font-serif text-[15px]">支持的具体结论（{s.supports.length}）</h2>
            <ul className="space-y-1.5">
              {s.supports.map((sp, i) => (
                <li key={i} className="border-l-2 border-[color:var(--border-strong)] pl-2.5 text-[13px] leading-relaxed text-secondary">{sp}</li>
              ))}
            </ul>
          </section>
        )}

        {s.notes && (
          <section className="mt-4 rounded-sm bg-[color:var(--surface-sunken)] p-3">
            <h2 className="mb-1 font-serif text-[14px]">备注与证据限制</h2>
            <p className="text-[12.5px] leading-relaxed text-secondary">{s.notes}</p>
          </section>
        )}
      </article>

      <section className="card mt-4 p-4">
        <h2 className="mb-2 font-serif text-[15px]">引用该来源的节点（{(data.used_by || []).length}）</h2>
        {(data.used_by || []).length === 0 ? (
          <p className="text-[12.5px] text-muted">暂无节点引用该来源。</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {(data.used_by || []).map((u) => (
              <li key={u.id}>
                <Link to={'/node/' + encodeURIComponent(u.id)}
                  className="inline-flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-[12px] text-secondary transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  <span className="font-mono text-[10px] opacity-60">{u.id}</span>{u.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}