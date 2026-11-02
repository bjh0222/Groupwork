# -*- coding: utf-8 -*-
import urllib.request, json, os, time
k=os.environ['SUB2API_API_KEY']
def call(label, extra, maxt=800, model='glm-4.7-flash'):
    body={'model':model,'messages':[{'role':'user','content':'用一句话解释什么是RAG。'}],'max_tokens':maxt,'temperature':0.2}
    body.update(extra)
    r=urllib.request.Request('https://<INTERNAL-GATEWAY-REDACTED>/v1/chat/completions',data=json.dumps(body).encode(),
        headers={'Authorization':'Bearer '+k,'Content-Type':'application/json'})
    t0=time.time()
    try:
        j=json.loads(urllib.request.urlopen(r,timeout=180).read().decode())
        m=j['choices'][0]['message']
        print(label,'-> %.1fs'%(time.time()-t0),'| content_len',len(m.get('content') or ''),'| reasoning_len',len(m.get('reasoning_content') or ''),'| usage',json.dumps(j.get('usage',{}).get('completion_tokens_details'),ensure_ascii=False))
        print('   CONTENT:', (m.get('content') or '')[:220].replace('\n',' '))
    except Exception as e:
        print(label,'ERR',repr(e)[:160])
    time.sleep(3)
call('A baseline', {})
call('B thinking.disabled', {'thinking':{'type':'disabled'}})
call('C enable_thinking=false', {'enable_thinking':False})
call('D chat_template_kwargs', {'chat_template_kwargs':{'enable_thinking':False}})