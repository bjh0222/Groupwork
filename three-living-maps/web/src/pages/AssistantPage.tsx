// AI 助手全屏页：地图约束的概念查询与解释。
import { useEffect, useState } from 'react';
import { AIAssistantLens } from '@/components/AIAssistantLens';
import { api } from '@/lib/api';
import { Tag } from '@/lib/ui';

export function AssistantPage() {
  const [status, setStatus] = useState<{ enabled: boolean; channels: { id: string; name: string; model: string }[]; note: string | null } | null>(null);
  useEffect(() => { api.aiStatus().then(setStatus).catch(() => setStatus(null)); }, []);

  return (
    <div className="mx-auto max-w-[820px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="font-serif text-[22px] sm:text-[26px]">AI 概念助手</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-secondary">
          这不是一个独立聊天框，而是<b>与三张地图数据集成</b>的检索问答：先检索正式节点、关系与来源，再把命中内容作为上下文交给模型，
          生成的回答必须附可点击的节点引用；引用经过服务端校验，不在检索结果内的 ID 会被剔除；无命中或证据不足时明确说明，不编造。
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11.5px]">
          {status?.enabled ? (
            <>
              <Tag tone="accent">模型渠道已配置</Tag>
              {status.channels.map((c) => <Tag key={c.id} tone="muted">{c.name} · {c.model}</Tag>)}
            </>
          ) : (
            <Tag tone="muted">降级模式：非生成式检索直出（不调用模型，网站核心功能不受影响）</Tag>
          )}
        </div>
      </header>

      <section className="card mb-4 p-3 text-[12px] leading-relaxed text-secondary">
        <div className="mb-1 font-medium text-[color:var(--text-primary)]">回答会区分三类内容</div>
        <ul className="space-y-0.5">
          <li>· <b>【资料事实】</b>地图中已核实的内容，附来源 ID</li>
          <li>· <b>【基于资料的解释】</b>据资料做出的合理推论</li>
          <li>· <b>【资料未覆盖】</b>地图当前没有覆盖的内容——此时会说明缺口并给出补充入口</li>
        </ul>
        <div className="mt-2 border-t border-subtle pt-2 text-[11.5px] text-muted">
          安全与边界：输入长度上限 500 字；每 IP 限流；系统提示与检索资料结构隔离，资料中出现的任何指令都不执行；
          密钥只存服务端，任何情况下不会出现在回答或前端。越界问题（与课程资料无词汇重叠）直接走「知识边界雾化」拒答，不调用模型。
        </div>
      </section>

      <AIAssistantLens />
    </div>
  );
}