# -*- coding: utf-8 -*-
import urllib.request, re, json, html, time
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'text/html,application/xhtml+xml','Accept-Language':'zh-CN,zh;q=0.9,en;q=0.8'}
def get(u,timeout=40):
    r=urllib.request.Request(u,headers=UA); return urllib.request.urlopen(r,timeout=timeout).read().decode('utf-8','ignore')
def strip(d):
    d=re.sub(r'<script[\s\S]*?</script>',' ',d); d=re.sub(r'<style[\s\S]*?</style>',' ',d)
    d=re.sub(r'<[^>]+>',' ',d); d=html.unescape(d); return re.sub(r'\s+',' ',d)
targets={
 'deepseek_home':'https://www.deepseek.com/',
 'zhipu_home':'https://www.zhipuai.cn/',
 'feishu_miaoda2':'https://www.feishu.cn/hc/zh-CN/articles/miaoda',
 'feishu_miaoda3':'https://open.feishu.cn/document/miaoda/overview',
 'feishu_home':'https://www.feishu.cn/product/base',
 'ccf2':'https://www.ccf.org.cn/Academic_Evaluation/AI/',
 'openai_gpt4':'https://platform.openai.com/docs/models',
 'hf':'https://huggingface.co/docs/hub/index',
 'node_sqlite':'https://nodejs.org/docs/latest-v24.x/api/sqlite.html',
 'vite':'https://vite.dev/guide/',
 'tailwind4':'https://tailwindcss.com/docs/installation/using-vite',
 'zustand':'https://zustand.docs.pmnd.rs/',
 'react':'https://react.dev/reference/react',
}
res={}
for k,u in targets.items():
    try:
        d=get(u); t=strip(d)
        res[k]={'url':u,'status':'ok','len':len(t),'text':t[:2500]}
        print('OK',k,len(t),'|',t[:160])
    except Exception as e:
        res[k]={'url':u,'status':'err','error':repr(e)[:160]}
        print('ERR',k,repr(e)[:110])
    time.sleep(0.3)
json.dump(res, open(r'D:\桌面\大作业\_research\official2.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)