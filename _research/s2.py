# -*- coding: utf-8 -*-
import urllib.request, json, time, sys
ids=['2005.11401','1706.03762','2201.11903','2210.03629','2302.04761','2211.09110','2306.05685','2307.03172','2310.11511','2312.10997','2302.12173','2210.08726','2305.06983','2305.15334']
out={}
for i in ids:
    u='https://api.semanticscholar.org/graph/v1/paper/arXiv:'+i+'?fields=title,venue,year,publicationVenue,authors.name,authors.affiliations,externalIds,citationCount'
    for attempt in range(3):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'research-script'})
            d=json.loads(urllib.request.urlopen(r,timeout=40).read().decode())
            out[i]={'title':d.get('title'),'venue':d.get('venue'),'year':d.get('year'),
                    'pubvenue':(d.get('publicationVenue') or {}).get('name'),
                    'citations':d.get('citationCount'),
                    'authors':[{'name':a.get('name'),'aff':a.get('affiliations')} for a in (d.get('authors') or [])][:6]}
            print(i,'|',out[i]['venue'],'|',out[i]['pubvenue'],'|',out[i]['year'],'| cites',out[i]['citations'])
            for a in out[i]['authors'][:3]:
                if a['aff']: print('    ',a['name'],'->',a['aff'])
            break
        except Exception as e:
            if attempt==2: out[i]={'error':repr(e)[:150]}; print(i,'ERR',repr(e)[:100])
            time.sleep(3)
    time.sleep(1.2)
json.dump(out, open(r'D:\桌面\大作业\_research\s2.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)