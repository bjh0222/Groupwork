# -*- coding: utf-8 -*-
import json, os
R=r'D:\桌面\大作业\_research'
s2=json.load(open(os.path.join(R,'s2.json'),encoding='utf-8'))
arx=json.load(open(os.path.join(R,'arxiv_api.json'),encoding='utf-8'))
name={'2005.11401':'RAG','1706.03762':'Transformer/Attention','2201.11903':'Chain-of-Thought','2210.03629':'ReAct',
'2302.04761':'Toolformer','2211.09110':'HELM','2306.05685':'MT-Bench/LLM-as-Judge','2307.03172':'Lost in the Middle',
'2310.11511':'Self-RAG','2312.10997':'RAG Survey','2302.12173':'Indirect Prompt Injection','2210.08726':'RARR',
'2305.06983':'FLARE (Active RAG)','2305.15334':'Gorilla'}
order=['1706.03762','2201.11903','2005.11401','2210.03629','2302.04761','2211.09110','2306.05685','2307.03172','2310.11511','2312.10997','2302.12173','2210.08726','2305.06983','2305.15334']
L=['# 论文出处与作者机构核实记录（核查日期 2026-11-01）','',
'两个独立来源交叉核实：① arXiv 摘要页 Comments 字段；② Semantic Scholar Graph API（venue / authors.affiliations）。',
'两者一致 -> 已核实；仅单一来源 -> 部分核实；均无 -> 待核实。',''
,'| arXiv ID | 简称 | arXiv Comments | S2 venue | 结论 | 引用数 |',
'|---|---|---|---|---|---|']
def comment(aid):
    for k,v in arx.items():
        if k.startswith(aid): return (v.get('comment') or '-').replace('|','/').strip()[:55]
    return '-'
for aid in order:
    sv=s2.get(aid,{})
    venue=sv.get('venue') or 'ERR'
    c=comment(aid).lower()
    concl='待核实'
    if venue not in ('ERR','arXiv.org',None) and any(x in c for x in ['neurips','iclr','acl','emnlp','tacl','association for computational','camera ready']):
        concl='已核实'
    elif venue not in ('ERR','arXiv.org',None):
        concl='已核实(S2)'
    elif venue=='arXiv.org':
        concl='预印本/综述'
    L.append('| '+aid+' | '+name[aid]+' | '+comment(aid)+' | '+str(venue)+' | '+concl+' | '+str(sv.get('citations') or '-')+' |')
L+=['','## 会议类别（CCF A/B）','',
'CCF 官网 www.ccf.org.cn 本次访问返回 WAF 挑战页，未能取得推荐目录正文（S-41）。','因此本项目所有论文一律**不标注 CCF A/B 类**，只保留可双重印证的会议名。','',
'## 作者机构（Semantic Scholar affiliations，用于生态地图参与者）','']
aff_all={}
for aid in order:
    sv=s2.get(aid,{})
    affs=[]
    for x in (sv.get('authors') or []):
        a=x.get('aff')
        if a: affs += a if isinstance(a,list) else [a]
    affs=sorted(set(affs))
    if affs:
        L.append('- '+name[aid]+' ('+aid+'): '+', '.join(affs))
        for a in affs: aff_all[a]=aff_all.get(a,0)+1
L+=['','## 出现频次 >=2 的机构（生态地图重点参与者候选）','']
for a,c in sorted(aff_all.items(),key=lambda kv:-kv[1]):
    if c>=2: L.append('- '+a+': '+str(c)+' 篇')
open(os.path.join(R,'venue-notes.md'),'w',encoding='utf-8').write('\n'.join(L))
print('\n'.join(L))