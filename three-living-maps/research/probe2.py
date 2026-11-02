# -*- coding: utf-8 -*-
import urllib.request,json,os,time
k=os.environ['SUB2API_API_KEY']
def call(model,prompt,maxt,extra=None):
    u='https://<INTERNAL-GATEWAY-REDACTED>/v1/chat/completions'
    body={'model':model,'messages':[{'role':'user','content':prompt}],'max_tokens':maxt,'temperature':0.2}
    if extra: body.update(extra)
    r=urllib.request.Request(u,data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+k,'Content-Type':'application/json'})
    t0=time.time()
    try:
        j=json.loads(urllib.request.urlopen(r,timeout=180).read().decode())
        m=j['choices'][0]['message']
        print('MODEL',model,'%.1fs'%(time.time()-t0))
        print('  keys:',sorted(m.keys()))
        print('  content_len:',len(m.get('content') or ''),'reasoning_len:',len(m.get('reasoning_content') or ''))
        print('  usage:',json.dumps(j.get('usage'),ensure_ascii=False))
        print('  CONTENT>>',(m.get('content') or '')[:600].replace('\n',' | '))
    except Exception as e:
        print('ERR',model,repr(e)[:250])
call('glm-4.7-flash','用一句话解释什么是RAG。',1200)
call('glm-4.7-flash','用一句话解释什么是RAG。',300,{'thinking':{'type':'disabled'}})