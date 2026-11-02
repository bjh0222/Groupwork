// 评测页：展示评测集与真实运行结果。分数只能来自实际运行，未运行则显示「尚未运行」。
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { EmptyState, ErrorState, Loading, Tag } from '@/lib/ui';

export function EvalPage() {
  const { data, loading, error, retry } = useAsync(() => api.eval(), []);
  const items = data?.items || [];
  const latest = data?.latest || null;
  const runs = data?.runs || [];

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="font-serif text-[22px] sm:text-[26px]">评测集与真实评测报告</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-secondary">
          围绕中枢任务「基于课程资料的知识问答」自建 {items.length} 道评测题，覆盖七类考点。
          每题记录问题、参考答案要点、依据来源、预期引用节点与评分标准。
          <b>分数只能来自实际运行</b>（<code className="rounded-sm bg-[color:var(--surface-sunken)] px-1 font-mono text-[11.5px]">npm run eval</code>），禁止预填虚构分数。
        </p>
      </header>

      {/* 最新运行结果 */}
      <section className="card mb-5 p-4">
        <h2 className="mb-2 font-serif text-[16px]">最新一次真实运行</h2>
        {!latest ? (
          <EmptyState title="尚未运行评测"
            hint={<>
              当前数据库中没有评测运行记录。执行 <code className="mx-1 rounded-sm bg-[color:var(--surface-sunken)] px-1 font-mono text-[11px]">npm run eval</code> 后，
              真实结果（含运行时间、模型渠道、Node 版本、逐题耗时与 token 用量）会显示在这里。
              本站不会展示未经实际运行产生的分数。
            </>} />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
              <Tag tone="accent">通过 {latest.passed} / {latest.total}</Tag>
              <time dateTime={latest.run_at} className="font-mono text-muted">{latest.run_at.replace('T', ' ').slice(0, 19)}</time>
              {latest.model && <Tag tone="muted">{latest.model}</Tag>}
              {latest.channel && <Tag tone="muted">渠道 {latest.channel}</Tag>}
              {latest.node_version && <Tag tone="muted">Node {latest.node_version}</Tag>}
            </div>
            {latest.scores && Object.keys(latest.scores).length > 0 && (
              <dl className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                {Object.entries(latest.scores).map(([k, v]) => (
                  <div key={k} className="rounded-sm bg-[color:var(--surface-sunken)] px-2 py-1.5 text-center">
                    <dt className="text-[10.5px] text-muted">{k}</dt>
                    <dd className="font-mono text-[15px] text-[color:var(--text-primary)]">{typeof v === 'number' ? v.toFixed(2) : String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {latest.notes && <p className="mb-3 rounded-sm bg-[color:var(--ev-partial-bg)] px-2.5 py-2 text-[12px] leading-snug text-secondary">{latest.notes}</p>}

            {/* 逐题结果 */}
            {Array.isArray(latest.items) && latest.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[12px]">
                  <caption className="sr-only">逐题评测结果</caption>
                  <thead>
                    <tr className="border-b border-strong text-left text-[11px] text-muted">
                      <th className="py-1.5 pr-2 font-medium">题号</th>
                      <th className="py-1.5 pr-2 font-medium">考点</th>
                      <th className="py-1.5 pr-2 font-medium">要点命中</th>
                      <th className="py-1.5 pr-2 font-medium">引用命中</th>
                      <th className="py-1.5 pr-2 font-medium">判定</th>
                      <th className="py-1.5 pr-2 font-medium">耗时</th>
                      <th className="py-1.5 font-medium">tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(latest.items as any[]).map((it, i) => (
                      <tr key={it.id || i} className="border-b border-subtle align-top">
                        <td className="py-1.5 pr-2 font-mono text-[11px] text-muted">{it.id}</td>
                        <td className="py-1.5 pr-2 text-secondary">{it.category || '—'}</td>
                        <td className="py-1.5 pr-2 font-mono">{it.points_hit ?? '—'}/{it.points_total ?? '—'}</td>
                        <td className="py-1.5 pr-2 font-mono">{it.citation_hit ?? '—'}</td>
                        <td className="py-1.5 pr-2">
                          <span className={it.pass ? 'text-[color:var(--ev-verified)]' : 'text-[color:var(--ev-partial)]'}>
                            {it.pass ? '✓ 通过' : '✗ 未通过'}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 font-mono text-muted">{it.latency_ms ? (it.latency_ms / 1000).toFixed(1) + 's' : '—'}</td>
                        <td className="py-1.5 font-mono text-muted">{it.tokens ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* 评测集题目 */}
      <section className="mb-5">
        <h2 className="mb-2 font-serif text-[16px]">评测集（{items.length} 题）</h2>
        {loading && <Loading label="正在加载评测集…" />}
        {error && <ErrorState message={error} onRetry={retry} />}
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.id} className="card p-3">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                <span className="font-mono text-muted">{it.id}</span>
                <Tag tone="muted">{it.category}</Tag>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[color:var(--text-primary)]">{it.question}</p>
              <div className="mt-2">
                <div className="mb-1 text-[11px] font-medium text-muted">参考答案要点</div>
                <ul className="space-y-0.5">
                  {it.reference_points.map((p, i) => (
                    <li key={i} className="border-l-2 border-[color:var(--border-strong)] pl-2.5 text-[12px] leading-snug text-secondary">{p}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span>依据来源：</span>
                {it.source_ids.map((s) => (
                  <Link key={s} to={'/source/' + encodeURIComponent(s)} className="rounded-sm border border-subtle px-1.5 py-0.5 font-mono hover:text-[color:var(--accent)]">{s}</Link>
                ))}
                <span className="ml-2">预期引用节点：</span>
                {it.expected_nodes.map((n) => (
                  <Link key={n} to={'/node/' + encodeURIComponent(n)} className="rounded-sm border border-subtle px-1.5 py-0.5 font-mono hover:text-[color:var(--accent)]">{n}</Link>
                ))}
              </div>
              <p className="mt-2 rounded-sm bg-[color:var(--surface-sunken)] px-2.5 py-1.5 text-[11.5px] leading-snug text-secondary">
                <span className="font-medium">评分标准：</span>{it.grading}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 历史运行 */}
      {runs.length > 1 && (
        <section className="card p-4">
          <h2 className="mb-2 font-serif text-[15px]">历史运行（{runs.length}）</h2>
          <ul className="space-y-1 text-[12px]">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <time dateTime={r.run_at} className="font-mono text-muted">{r.run_at.replace('T', ' ').slice(0, 19)}</time>
                <span>通过 {r.passed}/{r.total}</span>
                {r.model && <Tag tone="muted">{r.model}</Tag>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-4 border-[color:var(--ev-partial)] p-4">
        <h2 className="mb-2 font-serif text-[15px]">评测的局限性（诚实披露）</h2>
        <ul className="space-y-1 text-[12.5px] leading-relaxed text-secondary">
          <li>· 评测集为<b>自建 14 题</b>，样本量小，结论只适用于「课程资料问答」这一窄场景，不能外推为模型通用能力评价。</li>
          <li>· 自动评分由 LLM 辅助判断，存在<b>裁判与被评模型同源导致自我偏好</b>的风险（依据 LLM-as-a-Judge 研究），故所有自动分数标注为「待人工复核」。</li>
          <li>· 服务端模型版本会更新，跨日期比较需谨慎；每次运行都记录了时间、渠道与 Node 版本以便复核。</li>
          <li>· 成本指标依赖可查询账单；本项目通过兼容网关调用，未取得独立账单，费用维度标注为「尚未采集」。</li>
        </ul>
      </section>
    </div>
  );
}