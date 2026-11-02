# -*- coding: utf-8 -*-
import urllib.request, re, json, time, html
ids=['2005.11401','2210.03629','2306.05685','2211.09110','2307.03172','2302.12173','2210.08726','2305.06983','2310.11511','2312.10997','2302.04761','2305.15334','2201.11903','1706.03762']
u='http://export.arxiv.org/api/query?id_list='+','.join(ids)+'&max_results=20'
d=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'research'}),timeout=60).read().decode('utf-8','ignore')
entries=re.findall(r'<entry>([\s\S]*?)</entry>', d)
res={}
for e in entries:
    eid=re.search(r'<id>http://arxiv.org/abs/(.*?)v?\d*</id>', e)
    aid=re.search(r'<id>http://arxiv.org/abs/(.*?)</id>', e).group(1)
    title=html.unescape(re.sub(r'\s+',' ',re.search(r'<title>([\s\S]*?)</title>',e).group(1))).strip()
    authors=re.findall(r'<author>([\s\S]*?)</author>', e)
    aa=[]
    for a in authors:
        nm=html.unescape(re.search(r'<name>(.*?)</name>',a).group(1)).strip()
        aff=re.search(r'<arxiv:affiliation[^>]*>(.*?)</arxiv:affiliation>',a,re.S)
        aa.append({'name':nm,'aff':html.unescape(aff.group(1)).strip() if aff else None})
    prim=re.search(r'<arxiv:primary_category[^>]*term="(.*?)"',e)
    com=re.search(r'<arxiv:comment[^>]*>([\s\S]*?)</arxiv:comment>',e)
    pub=re.search(r'<published>(.*?)</published>',e)
    res[aid]={'title':title,'authors':aa,'primary':prim.group(1) if prim else None,
              'comment':html.unescape(com.group(1)).strip() if com else None,
              'published':pub.group(1) if pub else None}
    affs=[x['aff'] for x in aa if x['aff']]
    print(aid,'|',title[:60],'| authors',len(aa),'| affs',len(affs))
    for x in aa[:4]:
        if x['aff']: print('     ',x['name'],'=>',x['aff'])
    if com: print('     comment:', html.unescape(com.group(1)).strip()[:120])
json.dump(res, open(r'D:\桌面\大作业\_research\arxiv_api.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)