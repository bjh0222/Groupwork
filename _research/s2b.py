# -*- coding: utf-8 -*-
import urllib.request, json, time
ids=['2005.11401','2302.04761','2310.11511','2302.12173','2305.06983','2211.09110','2306.05685','2312.10997','2201.11903']
prev=json.load(open(r'D:\桌面\大作业\_research\s2.json',encoding='utf-8'))
for i in ids:
    if prev.get(i,{}).get('title') and not prev.get(i,{}).get('error'): continue
    u='https://api.semanticscholar.org/graph/v1/paper/arXiv:'+i+'?fields=title,venue,year,publicationVenue,authors.name,authors.affiliations,citationCount'
    for a in range(4):
        try:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'research'}),timeout=40).read().decode())
            prev[i]={'title':d.get('title'),'venue':d.get('venue'),'year':d.get('year'),
                     'pubvenue':(d.get('publicationVenue') or {}).get('name'),'citations':d.get('citationCount'),
                     'authors':[{'name':x.get('name'),'aff':x.get('affiliations')} for x in (d.get('authors') or [])][:8]}
            print(i,'|',prev[i]['venue'],'|',prev[i]['year'],'| cites',prev[i]['citations'])
            for x in prev[i]['authors'][:5]:
                if x['aff']: print('    ',x['name'],'=>',x['aff'])
            break
        except Exception as e:
            if a==3: print(i,'STILL ERR',repr(e)[:80])
            time.sleep(8)
    time.sleep(4)
json.dump(prev, open(r'D:\桌面\大作业\_research\s2.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('done')