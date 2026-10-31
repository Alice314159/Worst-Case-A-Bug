"""Build the focused home page and the Work / Stories directories."""
from pathlib import Path
from bs4 import BeautifulSoup
from site_navigation import apply_navigation,update_all
ROOT=Path(__file__).resolve().parents[1]
def bi(a,b):return '<span data-l="zh">'+a+'</span><span data-l="en">'+b+'</span>'
def make(path,route,zh,en,body):
 s=BeautifulSoup((ROOT/'writing.html').read_text(),'html.parser')
 s.html['data-current-page']=route;s.html['data-title-zh']=zh;s.html['data-title-en']=en;s.title.string=zh+' · Worst Case, a Bug'
 main=s.select_one('[data-main]');footer=main.select_one('footer').extract();main.clear()
 wrapper=s.new_tag('div');wrapper['class']=['focused-page'];wrapper.append(BeautifulSoup(body,'html.parser'));wrapper.append(footer);main.append(wrapper)
 if route=='home':
  for script in list(s.select('script[src*="legacy-routes.js"]')):script.decompose()
  script=s.new_tag('script',src='js/legacy-routes.js');s.head.append(script)
 apply_navigation(s)
 (ROOT/path).write_text(str(s))
def build():
 home='<section class="focused-home"><header class="focused-home-hero"><div><p class="eyebrow">'+bi('阿布 / 程序员与生活记录者','ABU / PROGRAMMER & OBSERVER')+'</p><h1>'+bi('做些工具。<br/><em>也记录异乡生活。</em>','Make useful things.<br/><em>Keep a record of life.</em>')+'</h1><p class="focused-home-intro">'+bi('我是阿布，一个程序员。把日常的小麻烦做成工具，也把在北美的见闻留在声音和文字里。','I’m Abu, a programmer. I make tools for everyday friction and keep a record of life in North America, in voice and in writing.')+'</p><div class="focused-home-actions"><a class="studio-button" href="work.html">'+bi('看看我的作品','Explore my work')+' ↗</a><a class="text-link" href="about.html">'+bi('认识一下','A little about me')+' →</a></div></div><figure><a href="journal.html#trails"><img src="assets/poems/poem-rings-of-time-deer.png" width="1536" height="1024" alt="林间晨光与两只鹿的水彩插画"/></a><figcaption>'+bi('屏幕之外，也有生活。','There is life beyond the screen.')+'</figcaption></figure></header><section class="focused-selected"><div class="focused-section-label"><span class="eyebrow">'+bi('精选作品','SELECTED WORK')+'</span><a class="text-link" href="work.html">'+bi('全部作品','All work')+' ↗</a></div><a class="focused-product" href="products/readshot.html"><img src="assets/icons/icon-readshot.png" width="88" height="88" alt="ReadShot"/><div><p class="eyebrow">READ / CAPTURE / REVIEW</p><h2>ReadShot</h2><p>'+bi('把读到的英文拍下来，读懂、收藏，再慢慢复习。','Capture English worth keeping, understand it, save it and return to it.')+'</p></div><span aria-hidden="true">↗</span></a></section><section class="focused-updates"><div class="focused-section-label"><h2>'+bi('最近留下的东西','Recently added')+'</h2></div>'
 for zh,en,tag,et,desc,de,url in [
 ('大不了就出个Bug','Worst Case, a Bug','书籍','BOOK','从德州到加州，把生活一点点重新跑通。','From Texas toward California, rebuilding daily life together.','book.html'),
 ('红杉树下','Under the Redwoods','文稿 · 未录制','SCRIPTS · UNRECORDED','一段森林旅程，五次关于自然的观察。','A forest walk, and five observations about nature.','podcast/redwoods.html'),
 ('走进山路，离开屏幕一会儿','A little time on the trail','生活记录','LIFE','Big Bend、Grand Canyon 与 Yosemite 的徒步记录。','Trail notes from Big Bend, Grand Canyon and Yosemite.','journal.html#trails')]:
  home+='<a class="focused-update" href="'+url+'"><span class="eyebrow">'+bi(tag,et)+'</span><div><h3>'+bi(zh,en)+'</h3><p>'+bi(desc,de)+'</p></div><span aria-hidden="true">↗</span></a>'
 home+='</section></section>'
 make('index.html','home','开场','Start here',home)
 work='<section class="directory-page"><header class="directory-intro"><p class="eyebrow">'+bi('作品 / WORK','WORK / BUILT & EXPLORED')+'</p><h1>'+bi('从小问题开始，<br/>把东西做出来。','Small questions.<br/>Useful things.')+'</h1><p>'+bi('一边做能用上的工具，一边研究还没想明白的问题。这里是两个方向的入口。','Tools I can use, and questions I am still exploring. Two paths into the work.')+'</p></header><div class="work-directory-grid">'
 for n,zh,en,desc,de,url,items in [
 ('01','产品与工具','Products & tools','从阅读、语言学习到剪辑与效率，把日常遇到的麻烦慢慢变小。','Reading, language practice, editing and focus: making everyday friction a little smaller.','products.html',[('ReadShot','products/readshot.html'),('Sona','products/sona.html'),('Lexigo','products/lexigo.html')]),
 ('02','量化研究','Quant research','围绕数据、策略和模型做研究，把流程、公式与验证边界记录下来。','Research on data, strategies and models, with workflows, formulas and validation boundaries.','quant.html',[('ETF Rotation','quant/etf-rotation.html'),('Market Regimes','quant/market-regimes.html'),('Market Data','quant/market-data.html')])]:
  work+='<article class="work-directory-block"><span class="directory-number">'+n+'</span><h2><a href="'+url+'">'+bi(zh,en)+'</a></h2><p>'+bi(desc,de)+'</p><ul>'+''.join('<li><a href="'+u+'">'+t+' <span aria-hidden="true">↗</span></a></li>' for t,u in items)+'</ul><a class="text-link" href="'+url+'">'+bi('浏览全部','Browse all')+' →</a></article>'
 work+='</div></section>'
 make('work.html','work','作品','Work',work)
 stories='<section class="directory-page"><header class="directory-intro"><p class="eyebrow">'+bi('声音与文字','STORIES / SPOKEN & WRITTEN')+'</p><h1>'+bi('有些事，讲着才明白。<br/>有些话，要慢慢写。','Some stories are spoken.<br/>Others take time to write.')+'</h1><p>'+bi('同一段生活，可以有不同的表达。选一种喜欢的方式，慢慢看、慢慢听。','Different ways of keeping a record of the same life. Choose a way to read or listen at your own pace.')+'</p></header><div class="stories-directory">'
 for n,zh,en,tag,et,desc,de,url,art in [
 ('01','播客','Podcast','听一段生活','LISTEN','已经录下的生活与探索，挑一期慢慢听。','Recorded stories of life and exploration. Find an episode to sit with.','podcast.html','assets/podcast/podcast-cover.png'),
 ('02','书籍','Books','连续读下去','READ A BOOK','《大不了就出个Bug》：在线阅读，也可以下载带走。','Worst Case, a Bug: read online or download a copy to keep.','book.html','books'),
 ('03','随笔','Essays','把一个问题想清楚','THINK ON THE PAGE','关于做东西、研究和日常里那些值得多想一步的问题。','Notes on making things, research and questions worth another thought.','writing.html',None),
 ('04','小诗','Poems','留一点空白','A MOMENT TO NOTICE','在另一种语言里，试着留下时间与等待。','Small attempts to hold time and waiting in another language.','poems.html',None)]:
  stories+='<a class="stories-directory-row" href="'+url+'"><span class="directory-number">'+n+'</span>'
  if art=='books':stories+='<span class="stories-thumb stories-book-thumb"><span data-l="zh"><img src="assets/books/restart-cover.png" width="1122" height="1402" alt=""/></span><span data-l="en"><img src="assets/books/restart-cover-en.png" width="1122" height="1402" alt=""/></span></span>'
  elif art:stories+='<span class="stories-thumb"><img src="'+art+'" width="144" height="144" alt=""/></span>'
  else:stories+='<span class="stories-type-mark" aria-hidden="true">'+('Aa' if n=='03' else '“')+'</span>'
  stories+='<div><span class="eyebrow">'+bi(tag,et)+'</span><h2>'+bi(zh,en)+'</h2><p>'+bi(desc,de)+'</p></div><span class="directory-arrow" aria-hidden="true">↗</span></a>'
 stories+='</div></section>'
 make('stories.html','stories','声音与文字','Stories',stories)
 update_all()
if __name__=='__main__':build()
