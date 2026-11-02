import urllib.request, json, os, time
k=os.environ['SUB2API_API_KEY']
for attempt in range(6):
    body={'model':'glm-4.7-flash','messages':[{'role':'user','content':'回复OK两个字'}],'max_tokens':1200,'temperature':0.2}
    r=urllib.request.Request('https://<INTERNAL-GATEWAY-REDACTED>/v1/chat/completions',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+k,'Content-Type':'application/json'})
    t0=time.time()
    try:
        j=json.loads(urllib.request.urlopen(r,timeout=120).read().decode())
        m=j['choices'][0]['message']
        print('attempt',attempt,'OK %.1fs'%(time.time()-t0),'content_len',len(m.get('content') or ''),'reasoning',j['usage'].get('completion_tokens_details',{}).get('reasoning_tokens'))
        print('  content:',(m.get('content') or '')[:120].replace('\n',' '))
        break
    except Exception as e:
        print('attempt',attempt,'ERR %.1fs'%(time.time()-t0),repr(e)[:90])
        time.sleep(20)