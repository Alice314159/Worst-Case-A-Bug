"""Render separate visible language editions of the unrecorded redwood scripts."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,html
ROOT=Path(__file__).resolve().parents[1]
ZH=json.loads((ROOT/'content/podcast/redwoods-draft.json').read_text())
EN=json.loads((ROOT/'content/podcast/redwoods-draft.en.json').read_text())
PHOTOS=json.loads((ROOT/'assets/podcast/redwoods/photos.json').read_text())
def esc(t):return html.escape(str(t),quote=True)
def bi(a,b):return '<span data-l="zh" lang="zh-CN">'+esc(a)+'</span><span data-l="en" lang="en">'+esc(b)+'</span>'
def render():
 soup=BeautifulSoup((ROOT/'writing.html').read_text(),'html.parser')
 soup.html['data-current-page']='podcast';soup.html['data-title-zh']='红杉树下 · 未录制文稿';soup.html['data-title-en']='Under the Redwoods · Unrecorded scripts'
 soup.html['data-draft-description-zh']=ZH['intro'];soup.html['data-draft-description-en']=EN['intro']
 soup.title.string='红杉树下 · 未录制文稿';soup.select_one('meta[name="description"]')['content']=ZH['intro']
 for node in soup.select('[aria-current]'):del node['aria-current']
 soup.select_one('a[data-nav="stories"]')['aria-current']='true'
 for node in soup.select('[href],[src]'):
  for attr in ['href','src']:
   value=node.get(attr,'')
   if value and not re.match(r'^(?:[a-z]+:|/|#|\.\.)',value):node[attr]='../'+value
 main=soup.select_one('[data-main]');main.clear()
 body='<div class="draft-series-page" id="podcast-draft"><a class="detail-back" href="../podcast.html#manuscripts">← '+bi('返回文稿栏目','Back to scripts')+'</a><header class="draft-series-hero"><div><p class="eyebrow">'+bi('森林手记 / 新系列','A FOREST JOURNAL / NEW SERIES')+'</p><p class="draft-status">'+bi(ZH['status'],EN['status'])+'</p><h1>'+bi(ZH['title'],EN['title'])+'</h1><p class="draft-series-subtitle">'+bi(ZH['subtitle'],EN['subtitle'])+'</p><p>'+bi(ZH['intro'],EN['intro'])+'</p><p class="draft-series-meta">'+bi(ZH['format'],EN['format'])+'<br/>'+bi(ZH['plannedDuration'],EN['plannedDuration'])+'</p></div><figure class="draft-series-photo"><img src="../assets/podcast/redwoods/new-shoot.png" alt="焦黑树皮上的绿色新枝" data-alt-zh="焦黑树皮上的绿色新枝" data-alt-en="A green shoot on blackened bark" width="1200" height="853"/><figcaption>'+bi('作者提供照片 · 焦黑树皮上的新枝','Author-supplied photograph · New growth on blackened bark')+'</figcaption></figure></header><div class="draft-series-toolbar"><span>'+bi('中文版 · 五集口播稿 · 点击标题展开','English edition · Five scripts · Select a title to open')+'</span><span data-l="zh"><a download href="../downloads/redwoods-season-one-manuscript.md">下载中文文稿 ↓</a></span><span data-l="en"><a download href="../downloads/redwoods-season-one-manuscript-en.md">Download English scripts ↓</a></span></div><p class="draft-series-note">'+bi(ZH['note'],EN['note'])+'</p><section class="draft-episodes" aria-label="五集未录制文稿" data-aria-zh="五集未录制文稿" data-aria-en="Five unrecorded scripts">'
 assert len(ZH['episodes'])==len(EN['episodes'])==5
 for z,e in zip(ZH['episodes'],EN['episodes']):
  assert z['number']==e['number']
  body+='<details class="draft-episode" id="ep-'+z['number']+'"><summary><span class="draft-episode-number">EP '+z['number']+'</span><span><h2>'+bi(z['title'],e['title'])+'</h2><p>'+bi(z['summary'],e['summary'])+'</p></span><span class="draft-episode-plus" aria-hidden="true">+</span></summary><div class="draft-script"><div class="draft-script-context"><p><strong>'+bi('这一集的问题','The question')+'</strong> '+bi(z['question'],e['question'])+'</p><p><strong>'+bi('建议音效','Sound direction')+'</strong> '+bi(z['sound'],e['sound'])+'</p></div>'
  for photo in PHOTOS:
   if z['number'] not in photo['episodes']:continue
   body+='<figure class="draft-episode-photo"><a href="../assets/podcast/redwoods/'+photo['file']+'" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="../assets/podcast/redwoods/'+photo['file']+'" alt="'+esc(photo['captionZh'])+'" data-alt-zh="'+esc(photo['captionZh'])+'" data-alt-en="'+esc(photo['captionEn'])+'" width="'+str(photo['width'])+'" height="'+str(photo['height'])+'"/></a><figcaption>'+bi(photo['captionZh'],photo['captionEn'])+' <span class="photo-credit">'+bi(photo.get('creditZh','作者提供 · 点击查看原图'),photo.get('creditEn','Author-supplied · Select to view the original'))+'</span></figcaption></figure>'
  for lang,data in [('zh',z),('en',e)]:body+='<div class="draft-script-body" data-l="'+lang+'" lang="'+('zh-CN' if lang=='zh' else 'en')+'">'+''.join('<p>'+esc(p)+'</p>' for p in data['paragraphs'])+'</div>'
  body+='<p class="draft-script-end">'+bi('中文版口播稿结束 · 尚未录制','End of English script · Not yet recorded')+'</p></div></details>'
 body+='</section></div>'
 main.append(BeautifulSoup(body,'html.parser'))
 css=soup.new_tag('link',rel='stylesheet',href='../css/podcast-draft.css?v=20261030-photos');soup.head.append(css)
 js=soup.new_tag('script',src='../js/podcast-draft.js?v=20261030-editions');js['defer']='';soup.head.append(js)
 (ROOT/'podcast/redwoods.html').write_text(str(soup))
 for lang,data in [('zh',ZH),('en',EN)]:
  md='# '+data['title']+'\n\n## '+data['subtitle']+'\n\n'+data['status']+'\n\n'+data['intro']+'\n\n'+data['note']+'\n'
  for e in data['episodes']:md+='\n## EP'+e['number']+' · '+e['title']+'\n\n'+('核心问题：' if lang=='zh' else 'The question: ')+e['question']+'\n\n'+('建议音效：' if lang=='zh' else 'Sound direction: ')+e['sound']+'\n\n'+'\n\n'.join(e['paragraphs'])+'\n'
  (ROOT/('downloads/redwoods-season-one-manuscript'+('-en' if lang=='en' else '')+'.md')).write_text(md)
if __name__=='__main__':render()
