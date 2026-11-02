# -*- coding: utf-8 -*-
import urllib.request, json, time
p=r'D:\桌面\大作业\_research\s2.json'
prev=json.load(open(p,encoding='utf-8'))
for i in ['2310.11511','2302.04761','2305.15334','2201.11903']:
    u='https://api.semanticscholar.org/graph/v1/paper/arXiv:'+i+'?fields=title,venue,year,authors.name,authors.affiliations'
    for a in range(5):
        try:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'r'}),timeout=40).read().decode())
            prev[i]={'title':d.get('title'),'venue':d.get('venue'),'year':d.get('year'),
                     'authors':[{'name':x.get('name'),'aff':x.get('affiliations')} for x in (d.get('authors') or [])][:8]}
            affs=[]
            for x in prev[i]['authors']:
                if x['aff']: affs+= x['aff'] if isinstance(x['aff'],list) else [x['aff']]
            print(i,'|',prev[i]['venue'],'|',prev[i]['year'],'|',sorted(set(affs)),flush=True)
            break
        except Exception as e:
            if a==4: print(i,'ERR',repr(e)[:50],flush=True)
            time.sleep(15)
    json.dump(prev,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    time.sleep(6)
print('DONE',flush=True)