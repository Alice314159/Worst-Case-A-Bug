"""Build the focused home page and the redirect stubs for retired directory pages.

Home shows one introduction, two featured works (one app, one book) and the latest
published podcast episode, read from js/podcast-data.js. Re-run after
scripts/update_podcast.py so the latest episode stays current.
"""
import json,re
from datetime import datetime
from html import escape
from pathlib import Path
from bs4 import BeautifulSoup
from site_navigation import apply_navigation,update_all
ROOT=Path(__file__).resolve().parents[1]
# Retired directory pages: old links keep working by redirecting to the merged page.
REDIRECTS={'work.html':'products.html','stories.html':'writing.html','poems.html':'writing.html#poems'}
def bi(a,b):return '<span data-l="zh">'+a+'</span><span data-l="en">'+b+'</span>'
def make(path,route,zh,en,body):
 s=BeautifulSoup((ROOT/'writing.html').read_text(),'html.parser')
 s.html['data-current-page']=route;s.html['data-title-zh']=zh;s.html['data-title-en']=en;s.title.string=zh+' · Worst Case, a Bug'
 main=s.select_one('[data-main]');footer=main.select_one('footer').extract();main.clear()
 wrapper=s.new_tag('div');wrapper['class']=['focused-page'];wrapper.append(BeautifulSoup(body,'html.parser'));wrapper.append(footer);main.append(wrapper)
 for script in list(s.select('script[src*="legacy-routes.js"]')):script.decompose()
 if route=='home':s.head.append(s.new_tag('script',src='js/legacy-routes.js'))
 apply_navigation(s)
 (ROOT/path).write_text(str(s))
def redirect(path,target):
 (ROOT/path).write_text('<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta http-equiv="refresh" content="0; url='+target+'">\n  <link rel="canonical" href="'+target.split('#')[0]+'">\n  <meta name="robots" content="noindex">\n  <title>Redirecting…</title>\n  <script>window.location.replace(\''+target+'\' + (location.hash && !\''+target+'\'.includes(\'#\') ? location.hash : \'\'));</script>\n</head>\n<body>\n  <p>This page has moved. <a href="'+target+'">Continue</a>.</p>\n</body>\n</html>\n')
def latest_episode():
 text=(ROOT/'js/podcast-data.js').read_text()
 episodes=json.loads(text[text.index('['):text.rindex(']')+1])
 ep=max(episodes,key=lambda e:datetime.strptime(e['date'],'%a, %d %b %Y %H:%M:%S %Z'))
 parts=re.split(r'[｜|]',ep['title'],maxsplit=1)
 number,title=(parts[0].strip(),parts[1].strip()) if len(parts)==2 else ('',ep['title'])
 day=datetime.strptime(ep['date'],'%a, %d %b %Y %H:%M:%S %Z')
 minutes=max(1,round(int(ep.get('duration') or 0)/60))
 art=json.loads('{'+(ROOT/'js/podcast-artwork.js').read_text().split('{',1)[1].rsplit('}',1)[0]+'}')
 return {'number':number,'title':title,'zh_meta':f'{day.year} 年 {day.month} 月 {day.day} 日 · {minutes} 分钟','en_meta':f'{day:%b} {day.day}, {day.year} · {minutes} min','art':art.get(ep['link'],'assets/podcast/podcast-cover.webp')}
def build():
 ep=latest_episode()
 home='<section class="focused-home"><header class="focused-home-hero"><div><p class="eyebrow">'+bi('阿布 / 程序员与生活记录者','ABU / PROGRAMMER & OBSERVER')+'</p><h1>'+bi('做些工具。<br/><em>也记录异乡生活。</em>','Make useful things.<br/><em>Keep a record of life.</em>')+'</h1><p class="focused-home-intro">'+bi('我是阿布，一个程序员。把日常的小麻烦做成工具，也把在北美的见闻留在声音和文字里。','I’m Abu, a programmer. I make tools for everyday friction and keep a record of life in North America, in voice and in writing.')+'</p><div class="focused-home-actions"><a class="studio-button" href="products.html">'+bi('看看我的作品','Explore my work')+' ↗</a></div></div><figure><img src="assets/poems/poem-rings-of-time-deer.webp" width="1536" height="1024" alt="林间晨光与两只鹿的水彩插画" data-alt-zh="林间晨光与两只鹿的水彩插画" data-alt-en="Watercolor of morning light in a forest with two deer"/></figure></header>'
 home+='<section class="focused-selected"><div class="focused-section-label"><span class="eyebrow">'+bi('先看这两样','START WITH THESE')+'</span></div><div class="focused-pair">'
 home+='<a class="focused-product" href="products/readshot.html"><img src="assets/icons/icon-readshot.webp" width="88" height="88" alt=""/><div><p class="eyebrow">'+bi('做工具 · App','MAKING · APP')+'</p><h2>ReadShot</h2><p>'+bi('把读到的英文拍下来，读懂、收藏，再慢慢复习。','Capture English worth keeping, understand it, save it and return to it.')+'</p></div><span aria-hidden="true">↗</span></a>'
 home+='<a class="focused-product focused-book" href="book.html"><span class="focused-book-cover"><span data-l="zh"><img src="assets/books/restart-cover.webp" width="1122" height="1402" alt=""/></span><span data-l="en"><img src="assets/books/restart-cover-en.webp" width="1122" height="1402" alt=""/></span></span><div><p class="eyebrow">'+bi('记录生活 · 书','KEEPING A RECORD · BOOK')+'</p><h2>'+bi('大不了就出个 Bug','Worst Case, a Bug')+'</h2><p>'+bi('从德州到加州，把生活一点点重新跑通。在线读，也可以下载。','From Texas toward California, rebuilding daily life. Read online or download.')+'</p></div><span aria-hidden="true">↗</span></a></div></section>'
 home+='<section class="focused-updates"><div class="focused-section-label"><h2>'+bi('最新一期播客','Latest episode')+'</h2><a class="text-link" href="podcast.html">'+bi('全部单集','All episodes')+' ↗</a></div><a class="focused-episode" href="podcast.html"><img src="'+escape(ep['art'])+'" width="96" height="96" alt="" loading="lazy"/><div><span class="eyebrow">'+bi('播客 · '+escape(ep['number']),'PODCAST · '+escape(ep['number']))+'</span><h3 lang="zh-CN">'+escape(ep['title'])+'</h3><p>'+bi(ep['zh_meta'],ep['en_meta'])+'</p></div><span aria-hidden="true">↗</span></a></section></section>'
 make('index.html','home','开场','Start here',home)
 for path,target in REDIRECTS.items():redirect(path,target)
 update_all()
if __name__=='__main__':build()
