# -*- coding: utf-8 -*-
import urllib.request, re, json, html, time, sys
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36','Accept-Language':'zh-CN,zh;q=0.9'}
def get(u,timeout=45):
    r=urllib.request.Request(u,headers=UA)
    return urllib.request.urlopen(r,timeout=timeout).read().decode('utf-8','ignore')
def strip(d):
    d=re.sub(r'<script[\s\S]*?</script>',' ',d); d=re.sub(r'<style[\s\S]*?</style>',' ',d)
    d=re.sub(r'<[^>]+>',' ',d); d=html.unescape(d); return re.sub(r'\s+',' ',d)
targets={
 'deepseek_pricing':'https://api-docs.deepseek.com/zh-cn/quick_start/pricing',
 'zhipu_pricing_doc':'https://docs.bigmodel.cn/cn/guide/start/pricing',
 'zhipu_models':'https://docs.bigmodel.cn/cn/guide/models/text/glm-4.6',
 'deepseek_api':'https://api-docs.deepseek.com/zh-cn/quick_start/basic_usage',
 'feishu_base_api':'https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview',
 'feishu_miaoda':'https://www.feishu.cn/product/miaoda',
 'ccf':'https://www.ccf.org.cn/Academic_Evaluation/By_category/',
}
res={}
for k,u in targets.items():
    try:
        d=get(u); t=strip(d)
        res[k]={'url':u,'status':'ok','len':len(t),'text':t[:4000]}
        print('=== OK',k,u,len(t))
    except Exception as e:
        res[k]={'url':u,'status':'err','error':repr(e)[:200]}
        print('=== ERR',k,repr(e)[:150])
    time.sleep(0.4)
json.dump(res, open(r'D:\桌面\大作业\_research\official.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)