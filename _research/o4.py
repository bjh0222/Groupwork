# -*- coding: utf-8 -*-
import urllib.request, re, json, html, time
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept-Language':'zh-CN,zh;q=0.9'}
def get(u,timeout=40):
    r=urllib.request.Request(u,headers=UA); return urllib.request.urlopen(r,timeout=timeout).read().decode('utf-8','ignore')
def strip(d):
    d=re.sub(r'<script[\s\S]*?</script>',' ',d); d=re.sub(r'<style[\s\S]*?</style>',' ',d)
    d=re.sub(r'<[^>]+>',' ',d); d=html.unescape(d); return re.sub(r'\s+',' ',d)
targets={
 'miaoda_a':'https://www.feishu.cn/product/miaoda/',
 'miaoda_b':'https://www.feishu.cn/miaoda',
 'miaoda_c':'https://open.feishu.cn/document/uYjL24iN/uYzN3eDN2cTM2YjN3iTM',
 'bitable_api':'https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/search',
 'feishu_base':'https://www.feishu.cn/base',
 'zhipu_glm46_doc':'https://docs.bigmodel.cn/cn/guide/models/text/glm-4.6.md',
 'zhipu_intro':'https://docs.bigmodel.cn/cn/guide/start/introduction.md',
 'deepseek_intro':'https://api-docs.deepseek.com/zh-cn/',
 'lmsys':'https://lmarena.ai/',
 'stanford_crfm':'https://crfm.stanford.edu/',
 'ragas':'https://docs.ragas.io/',
 'openai_eval':'https://platform.openai.com/docs/guides/evals',
}
res={}
for k,u in targets.items():
    try:
        d=get(u); t=strip(d)
        res[k]={'url':u,'status':'ok','len':len(t),'text':t[:3000]}
        print('OK',k,len(t),'|',t[:150])
    except Exception as e:
        res[k]={'url':u,'status':'err','error':repr(e)[:160]}
        print('ERR',k,repr(e)[:100])
    time.sleep(0.25)
json.dump(res, open(r'D:\桌面\大作业\_research\official4.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)