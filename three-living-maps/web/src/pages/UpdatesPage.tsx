// 更新记录：日期、对象、依据、变更内容、原因、执行者。课程要求「记录更新日期、对象、依据、内容及原因」。
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { EmptyState, ErrorState, Loading, Tag } from '@/lib/ui';

const OBJ_LABEL: Record<string, string> = {
  node: '节点', relation: '关系', source: '来源', eval: '评测',
  feedback: '反馈', candidate: '候选内容', system: '系统'
};

export function UpdatesPage() {
  const { data, loading, error, retry } = useAsync(() => api.updates({ limit: 300 }), []);
  const updates = data?.updates || [];

  return (
    <div className="mx-auto max-w-[900px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="font-serif text-[22px] sm:text-[26px]">更新记录</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-secondary">
          课程要求地图「能够持续更新」，并记录<b>更新日期、对象、依据、变更内容与原因</b>。
          下列记录由数据维护操作自动写入（新增/修改节点、关系、来源，处理反馈，审核候选内容），
          因此反映的是真实修改，而不是事后补写的说明。
        </p>
        <p className="mt-2 text-[12px] text-muted">
          快变量复核要求：价格、模型版本、平台功能等信息超过 4 周未复核时，节点会显示「信息可能过期」提示；
          复核后应通过管理端更新 last_checked 并写入一条更新记录。
        </p>
      </header>

      {loading && <Loading label="正在加载更新记录…" />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && updates.length === 0 && (
        <EmptyState title="尚无更新记录"
          hint="数据初始化后，任何通过管理端做出的修改都会记录在这里。" />
      )}

      {updates.length > 0 && (
        <ol className="relative space-y-3 border-l border-subtle pl-4">
          {updates.map((u) => (
            <li key={u.id} className="relative">
              <span aria-hidden="true" className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-[color:var(--accent)]" />
              <div className="card p-3">
                <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                  <time dateTime={u.date} className="font-mono text-secondary">{u.date}</time>
                  <Tag tone="muted">{OBJ_LABEL[u.object_type] || u.object_type}</Tag>
                  {u.object_id && (
                    <Link to={(u.object_type === 'source' ? '/source/' : '/node/') + encodeURIComponent(u.object_id)}
                      className="font-mono text-muted underline decoration-dotted hover:text-[color:var(--accent)]">
                      {u.object_id}
                    </Link>
                  )}
                  <span className="ml-auto text-muted">执行者：{u.updated_by}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--text-primary)]">{u.change}</p>
                {u.reason && (
                  <p className="mt-1 text-[12px] leading-snug text-secondary">
                    <span className="text-muted">原因：</span>{u.reason}
                  </p>
                )}
                {u.evidence && (
                  <p className="mt-1 text-[12px] leading-snug text-secondary">
                    <span className="text-muted">依据：</span>{u.evidence}
                  </p>
                )}
                {u.source_ids && u.source_ids.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {u.source_ids.map((s) => (
                      <Link key={s} to={'/source/' + encodeURIComponent(s)}
                        className="rounded-sm border border-subtle px-1.5 py-0.5 font-mono text-[10px] text-muted hover:text-[color:var(--accent)]">{s}</Link>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}