# -*- coding: utf-8 -*-
import urllib.request, re, json, html, time
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
def get(u, timeout=45):
    r=urllib.request.Request(u, headers=UA)
    return urllib.request.urlopen(r, timeout=timeout).read().decode('utf-8','ignore')
def strip(d):
    d=re.sub(r'<script[\s\S]*?</script>',' ',d); d=re.sub(r'<style[\s\S]*?</style>',' ',d)
    d=re.sub(r'<[^>]+>',' ',d); d=html.unescape(d); return re.sub(r'\s+',' ',d)
ids = {
 'attention':'1706.03762','cot':'2201.11903','rag':'2005.11401','toolformer':'2302.04761',
 'react':'2210.03629','helmi':'2211.09110','mtbench':'2306.05685','rag_survey':'2312.10997',
 'lost_middle':'2307.03172','selfrag':'2310.11511','prompt_inj':'2302.12173','rarr':'2210.08726',
 'gorilla':'2305.15334','faithfulrag':'2305.06983'
}
out={}
for k,i in ids.items():
    try:
        d=get('https://arxiv.org/abs/'+i)
        title=re.search(r'<title>(.*?)</title>', d, re.S)
        au=re.findall(r'citation_author" content="(.*?)"', d)
        date=re.search(r'citation_online_date" content="(.*?)"', d)
        comment=re.search(r'<td class="tablecell comments mathjax">(.*?)</td>', d, re.S)
        out[k]={'id':i,'url':'https://arxiv.org/abs/'+i,
                'title':html.unescape(title.group(1)).strip() if title else None,
                'authors':[html.unescape(a) for a in au],
                'online_date':date.group(1) if date else None,
                'comment':strip(comment.group(1))[:300] if comment else None}
        print('OK',k,(out[k]['title'] or '')[:95],'|',out[k]['online_date'],'|',(out[k]['comment'] or '')[:100])
    except Exception as e:
        out[k]={'id':i,'error':repr(e)[:200]}
        print('ERR',k,repr(e)[:120])
    time.sleep(0.5)
json.dump(out, open(r'D:\桌面\大作业\_research\arxiv.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)