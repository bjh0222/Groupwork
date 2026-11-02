# -*- coding: utf-8 -*-
import urllib.request, re, json, html, time
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept-Language':'zh-CN,zh;q=0.9,en;q=0.8'}
def get(u,timeout=40):
    r=urllib.request.Request(u,headers=UA); return urllib.request.urlopen(r,timeout=timeout).read().decode('utf-8','ignore')
def strip(d):
    d=re.sub(r'<script[\s\S]*?</script>',' ',d); d=re.sub(r'<style[\s\S]*?</style>',' ',d)
    d=re.sub(r'<[^>]+>',' ',d); d=html.unescape(d); return re.sub(r'\s+',' ',d)
targets={
 'langchain':'https://python.langchain.com/docs/introduction/',
 'llamaindex':'https://docs.llamaindex.ai/en/stable/',
 'vllm':'https://docs.vllm.ai/en/latest/',
 'ollama':'https://ollama.com/',
 'hf_hub':'https://huggingface.co/',
 'neurips':'https://neurips.cc/',
 'iclr':'https://iclr.cc/',
 'acl':'https://acl-org.org/',
 'arxiv_list':'https://arxiv.org/list/cs.CL/recent',
 'ccf_try':'https://www.ccf.org.cn/Academic_Evaluation/CGAndMT/',
 'openai_pricing':'https://openai.com/api/pricing/',
 'zhipu_docs_llms':'https://docs.bigmodel.cn/llms.txt',
 'deepseek_models':'https://api-docs.deepseek.com/zh-cn/quick_start/model',
 'feishu_miaoda_doc':'https://open.feishu.cn/document/uYjL24iN/ukzN3eHN5YzN3lzN2cM',
 'github_langchain':'https://github.com/langchain-ai/langchain',
 'zhipu_github':'https://github.com/THUDM',
 'deepseek_github':'https://github.com/deepseek-ai',
}
res={}
for k,u in targets.items():
    try:
        d=get(u); t=strip(d)
        res[k]={'url':u,'status':'ok','len':len(t),'text':t[:2000]}
        print('OK',k,len(t),'|',t[:130])
    except Exception as e:
        res[k]={'url':u,'status':'err','error':repr(e)[:160]}
        print('ERR',k,repr(e)[:100])
    time.sleep(0.25)
json.dump(res, open(r'D:\桌面\大作业\_research\official3.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)