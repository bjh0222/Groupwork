# -*- coding: utf-8 -*-
import urllib.request, json, time
ids=['2302.04761','2310.11511','2302.12173']
p=r'D:\桌面\大作业\_research\s2.json'
prev=json.load(open(p,encoding='utf-8'))
for i in ids:
    u='https://api.semanticscholar.org/graph/v1/paper/arXiv:'+i+'?fields=title,venue,year,publicationVenue,authors.name,authors.affiliations,citationCount'
    for a in range(6):
        try:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'research'}),timeout=40).read().decode())
            prev[i]={'title':d.get('title'),'venue':d.get('venue'),'year':d.get('year'),
                     'pubvenue':(d.get('publicationVenue') or {}).get('name'),'citations':d.get('citationCount'),
                     'authors':[{'name':x.get('name'),'aff':x.get('affiliations')} for x in (d.get('authors') or [])][:8]}
            print(i,'|',prev[i]['venue'],'|',prev[i]['year'],'| cites',prev[i]['citations'],flush=True)
            for x in prev[i]['authors'][:5]:
                if x['aff']: print('    ',x['name'],'=>',x['aff'],flush=True)
            break
        except Exception as e:
            if a==5: print(i,'STILL ERR',repr(e)[:60],flush=True)
            time.sleep(20)
    json.dump(prev, open(p,'w',encoding='utf-8'), ensure_ascii=False, indent=1)
    time.sleep(8)
print('DONE',flush=True)