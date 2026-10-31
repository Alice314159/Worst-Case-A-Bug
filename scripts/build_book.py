"""Build the Chinese memoir's static reader, EPUB 3 and PDF from one manuscript.
Run with Python containing beautifulsoup4, reportlab and Pillow. No network required.
"""
from pathlib import Path
import json, html, re, zipfile
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'books/restart/manuscript.json').read_text())
CH=DATA['chapters']; VOL={v['id']:v for v in DATA['volumes']}
def esc(t): return html.escape(str(t),quote=True)
def bi(a,b):return f'<span data-l="zh">{esc(a)}</span><span data-l="en">{esc(b)}</span>'
def linkchapter(c,prefix='books/restart/'):
 return prefix+c['id']+'.html'
def document(body,depth=0,title='书籍',description=None,extra=''):
 s=BeautifulSoup((ROOT/'writing.html').read_text(),'html.parser')
 s.html['data-current-page']='books';s.html['data-title-zh']=title;s.html['data-title-en']='Books';s.title.string=title+' · Worst Case, a Bug'
 s.select_one('meta[name="description"]')['content']=description or DATA['positioning']
 for n in s.select('[aria-current="page"]'):del n['aria-current']
 for n in s.select('a[data-nav="stories"]'):n['aria-current']='true'
 main=s.select_one('[data-main]');main.clear();main.append(BeautifulSoup(body,'html.parser'))
 if depth:
  for node in s.select('[href],[src]'):
   for attr in ['href','src']:
    val=node.get(attr,'')
    # Only the inherited chrome has root-relative paths at this point; body paths are already depth-aware.
    if val and not re.match(r'^(?:[a-z]+:|/|#|\.\.)',val) and node not in main.descendants:node[attr]='../'*depth+val
 style=s.new_tag('link',rel='stylesheet',href='../'*depth+'css/book.css?v=20261030-book');s.head.append(style)
 js=s.new_tag('script',src='../'*depth+'js/book-reader.js?v=20261030-book');js['defer']='';s.head.append(js)
 for n in s.select('script[src*="site.js"]'):n['src']='../'*depth+'js/site.js?v=20261030-focused'
 if extra:s.head.append(BeautifulSoup(extra,'html.parser'))
 return str(s)
def build_web():
 charcount=sum(len(''.join(c['paragraphs'])) for c in CH)
 hero=f'''<div class="book-page"><section class="book-hero"><div class="book-cover"><img src="assets/books/restart-cover.png" alt="《大不了就出个Bug》星空版封面：老车、营地、荒野与银河" width="1122" height="1402" fetchpriority="high"/></div><div class="book-hero-copy"><p class="eyebrow">BOOK 01 / {bi('中文散文','CHINESE MEMOIR')}</p><p class="book-edition">{esc(DATA['edition'])}</p><h1>大不了<br/>就出个<span>Bug</span></h1><p class="book-subtitle">{esc(DATA['subtitle'])}</p><p class="book-author">阿布 著</p><p class="book-pitch">从德州小镇到加州阳光，<br/>我们在异乡把生活一点点重新跑通。</p><div class="book-actions"><a class="studio-button" href="books/restart/preface.html">{bi('开始阅读','Read online')} <span aria-hidden="true">↗</span></a><a class="book-resume text-link" data-book-resume href="books/restart/preface.html" hidden>{bi('继续阅读','Continue reading')} →</a></div><p class="book-facts">5 卷 · 16 章 · 前言与后记 · 约 {charcount/10000:.1f} 万字</p><a class="text-link" href="#downloads">{bi('下载到阅读器','Take it offline')} ↓</a></div></section><section class="book-position"><span class="eyebrow">ABOUT THIS BOOK</span><p>一个 F2 陪读者，与 F1 队友一起，<br/>在北美的生活系统里摸索、开荒，重新找回行动能力和自我定义。</p></section><div class="book-volumes">'''
 for v in VOL.values():
  hero+=f'<a href="#volume-{v["id"]}"><span>0{v["id"]}</span><h2>{v["title"]}</h2><strong>{v["subtitle"]}</strong><p>{v["description"]}</p><span class="volume-arrow" aria-hidden="true">↘</span></a>'
 hero+='</div><section class="book-toc" id="contents"><div class="book-section-heading"><div><p class="eyebrow">CONTENTS / '+bi('书中目录','READING ORDER')+'</p><h2>把生活，一章一章搭起来。</h2></div><span>18 篇 · 中文正文</span></div>'
 def row(c):return f'<a class="book-chapter-row" href="{linkchapter(c)}"><span>{c["label"]}</span><h3>{esc(c["title"])}</h3><span aria-hidden="true">↗</span></a>'
 hero+=row(CH[0])
 for v in VOL.values():
  hero+=f'<section class="book-volume-section" id="volume-{v["id"]}"><div class="book-volume-banner"><img loading="lazy" src="assets/podcast/episodes/{v["art"]}" alt=""/><div><span>第{["一","二","三","四","五"][v["id"]-1]}卷</span><h2>{v["title"]}<small>{v["subtitle"]}</small></h2></div></div>'
  hero+=''.join(row(c) for c in CH if c['volume']==v['id'])+'</section>'
 hero+=row(CH[-1])+'</section>'
 hero+='''<section class="book-downloads" id="downloads"><div><p class="eyebrow">KEEP A COPY / 离线阅读</p><h2>在没有信号的地方，也能翻开。</h2><p>网页、EPUB 与 PDF 使用同一份中文初稿。EPUB 适合手机与电子阅读器，可调字号；PDF 保留固定分页，适合电脑阅读和打印。</p></div><div class="book-download-grid"><a download href="downloads/worst-case-a-bug-draft.epub"><span class="download-format">EPUB</span><strong>带走一本书 <span aria-hidden="true">↓</span></strong><span>Apple Books · 支持 EPUB 的阅读器</span></a><a download href="downloads/worst-case-a-bug-draft.pdf"><span class="download-format">PDF</span><strong>保留每一页 <span aria-hidden="true">↓</span></strong><span>A5 排版 · 可打印 · 内含章节书签</span></a></div></section>'''
 hero+=f'<aside class="book-editor-note"><h2>关于这份初稿</h2><p>{esc(DATA["note"])}</p><p>封面为作者提供的概念图，正文采用本页书名与副标题；图中视觉场景并非行程或事件发生地点的纪实证明。本版没有正式出版社或 ISBN 信息。</p><a class="text-link" href="podcast.html">回到播客，听见故事最初的声音 ↗</a><details><summary>查看另一版封面构想</summary><img loading="lazy" src="assets/books/restart-cover-concept.png" alt="另一版封面构想，含人物与生活场景拼贴；非正式出版物"/><p>仅作封面构想存档，图中的出版社、人物形象与证件画面不作为事实或正式出版信息。</p></details></aside></div>'
 (ROOT/'book.html').write_text(document(hero))
 for i,c in enumerate(CH):
  title=c['label']+'｜'+c['title'];vol=VOL.get(c['volume'])
  toc='<details class="reader-toc"><summary>章节目录 <span aria-hidden="true">＋</span></summary><nav aria-label="书籍章节">'
  for item in CH:toc+=f'<a href="{item["id"]}.html"'+(' aria-current="page"' if item==c else '')+'>'+esc(item['label']+' · '+item['title'])+'</a>'
  toc+='</nav></details>'
  body=f'<div class="book-reader" data-book-chapter="{c["id"]}"><div class="reader-top"><a href="../../book.html#contents">← 全书目录</a><span>{i+1:02d} / {len(CH):02d}</span></div><div class="reader-layout"><aside class="reader-tools">{toc}<div class="reader-font-controls" role="group" aria-label="调整正文字号"><button type="button" data-reader-size="-1" aria-label="缩小正文字号">A−</button><span>字号</span><button type="button" data-reader-size="1" aria-label="放大正文字号">A＋</button></div><p>中文整理初稿<br/>阿布 · 大不了就出个Bug</p></aside><article class="reader-article"><header><p class="eyebrow">'+(f'第{["一","二","三","四","五"][c["volume"]-1]}卷 / {vol["title"]}' if vol else '大不了就出个Bug')+f'</p><p class="reader-chapter-label">{c["label"]}</p><h1>{esc(c["title"])}</h1></header>'
  body+=''.join('<p>'+esc(p)+'</p>' for p in c['paragraphs'])
  body+='<div class="reader-end-mark" aria-hidden="true">✳</div><nav class="reader-pagination" aria-label="翻页">'
  body+=(f'<a href="{CH[i-1]["id"]}.html"><small>上一章</small><span>{esc(CH[i-1]["title"])}</span></a>' if i else '<a href="../../book.html"><small>返回</small><span>书籍封面</span></a>')
  body+=(f'<a href="{CH[i+1]["id"]}.html"><small>下一章 →</small><span>{esc(CH[i+1]["title"])}</span></a>' if i<len(CH)-1 else '<a href="../../book.html#downloads"><small>读完了</small><span>下载，留下一份</span></a>')
  body+='</nav><p class="reader-draft-note">整理初稿 · 依据作者大纲写作，尚待逐章审订。个人经历不是现行办事或医疗指南。</p></article></div></div>'
  (ROOT/f'books/restart/{c["id"]}.html').write_text(document(body,2,title,description=c['paragraphs'][0]))

def build_epub():
 path=ROOT/'downloads/worst-case-a-bug-draft.epub';title=esc(DATA['title'])
 style='''body{font-family:serif;line-height:1.9;margin:6%;color:#29372c}h1{font-size:1.7em;line-height:1.5}h2{font-size:1.3em}p{text-indent:2em;margin:0 0 1em;orphans:2;widows:2}.label,.note{text-indent:0;color:#667460;font-size:.85em}.cover{margin:0;padding:0;text-align:center}.cover img{max-width:100%;max-height:95vh}a{color:#536c47}li{margin:.5em 0}'''
 def xhtml(title,body):return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN" lang="zh-CN"><head><meta charset="utf-8"/><title>'+title+'</title><link rel="stylesheet" href="style.css"/></head><body>'+body+'</body></html>'
 with zipfile.ZipFile(path,'w') as z:
  z.writestr('mimetype','application/epub+zip',compress_type=zipfile.ZIP_STORED)
  z.writestr('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
  z.writestr('OEBPS/style.css',style)
  z.write(ROOT/'assets/books/restart-cover.png','OEBPS/cover.png')
  z.writestr('OEBPS/cover.xhtml',xhtml(title,'<section epub:type="cover" class="cover"><img src="cover.png" alt="大不了就出个Bug，星空版封面"/></section>'))
  z.writestr('OEBPS/title.xhtml',xhtml(title,f'<h1>{title}</h1><h2>{esc(DATA["subtitle"])}</h2><p class="label">阿布 著</p><p class="note">{esc(DATA["edition"])}</p><p class="note">{esc(DATA["note"])}</p><p class="note">封面为作者提供的概念图，无正式出版或 ISBN 信息。</p>'))
  nav='<nav epub:type="toc" id="toc"><h1>目录</h1><ol><li><a href="title.xhtml">书名页与编写说明</a></li>'
  nav+=f'<li><a href="preface.xhtml">前言 · {esc(CH[0]["title"])}</a></li>'
  for v in VOL.values():
   chapters=[c for c in CH if c['volume']==v['id']]
   nav+=f'<li><a href="{chapters[0]["id"]}.xhtml">第{["一","二","三","四","五"][v["id"]-1]}卷 · {v["title"]}</a><ol>'
   nav+=''.join(f'<li><a href="{c["id"]}.xhtml">{esc(c["label"]+" · "+c["title"])}</a></li>' for c in chapters)+'</ol></li>'
  nav+=f'<li><a href="afterword.xhtml">后记 · {esc(CH[-1]["title"])}</a></li></ol></nav>'
  z.writestr('OEBPS/nav.xhtml',xhtml('目录',nav))
  for c in CH:
   vol=VOL.get(c['volume']);intro=(f'第{["一","二","三","四","五"][c["volume"]-1]}卷 · {vol["title"]}' if vol else DATA['title'])
   body=f'<section epub:type="chapter"><p class="label">{intro} / {c["label"]}</p><h1>{esc(c["title"])}</h1>'+''.join('<p>'+esc(p)+'</p>' for p in c['paragraphs'])+'</section>'
   z.writestr('OEBPS/'+c['id']+'.xhtml',xhtml(esc(c['title']),body))
  manifest='<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="style" href="style.css" media-type="text/css"/><item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/><item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>'
  manifest+=''.join(f'<item id="{c["id"]}" href="{c["id"]}.xhtml" media-type="application/xhtml+xml"/>' for c in CH)
  spine='<itemref idref="cover"/><itemref idref="title"/><itemref idref="nav"/>'+''.join(f'<itemref idref="{c["id"]}"/>' for c in CH)
  opf=f'''<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="zh-CN"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">urn:wcab:restart-life:draft-20261030</dc:identifier><dc:title>{title}：{esc(DATA['subtitle'])}</dc:title><dc:creator>阿布</dc:creator><dc:language>zh-CN</dc:language><dc:description>{esc(DATA['positioning'])} 整理初稿，尚待作者审订。</dc:description><meta property="dcterms:modified">2026-10-30T00:00:00Z</meta></metadata><manifest>{manifest}</manifest><spine>{spine}</spine></package>'''
  z.writestr('OEBPS/content.opf',opf)
 # Validate every XML document and every manifest resource before delivery.
 with zipfile.ZipFile(path) as z:
  assert z.infolist()[0].filename=='mimetype' and z.infolist()[0].compress_type==0
  for name in z.namelist():
   if name.endswith(('.xml','.xhtml','.opf')):ET.fromstring(z.read(name))
  root=ET.fromstring(z.read('OEBPS/content.opf'))
  for item in root.findall('.//{http://www.idpf.org/2007/opf}item'):assert 'OEBPS/'+item.attrib['href'] in z.namelist()

def build_pdf():
 from reportlab.pdfbase import pdfmetrics
 from reportlab.pdfbase.ttfonts import TTFont
 from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Image,KeepTogether
 from reportlab.lib.styles import ParagraphStyle
 from reportlab.lib import colors
 from reportlab.lib.units import mm
 font='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
 pdfmetrics.registerFont(TTFont('BookCN',font))
 # Font is embedded/subset, so downloaded PDFs remain legible offline.
 ink=colors.HexColor('#354b3b'); muted=colors.HexColor('#81916f')
 styles={
 'body':ParagraphStyle('Body',fontName='BookCN',fontSize=10,leading=17.8,wordWrap='CJK',spaceAfter=8,firstLineIndent=20,textColor=ink),
 'title':ParagraphStyle('Title',fontName='BookCN',fontSize=25,leading=36,wordWrap='CJK',spaceAfter=18,textColor=ink),
 'chapter':ParagraphStyle('Chapter',fontName='BookCN',fontSize=18,leading=26,wordWrap='CJK',spaceAfter=18,textColor=ink),
 'label':ParagraphStyle('Label',fontName='BookCN',fontSize=9,leading=16,wordWrap='CJK',spaceAfter=12,textColor=muted),
 'toc':ParagraphStyle('Contents',fontName='BookCN',fontSize=10,leading=18,wordWrap='CJK',spaceAfter=8,textColor=ink),
 }
 w,h=148*mm,210*mm
 class BookDoc(SimpleDocTemplate):
  def afterFlowable(self,flowable):
   if hasattr(flowable,'bookmark_key'):
    self.canv.bookmarkPage(flowable.bookmark_key);self.canv.addOutlineEntry(flowable.bookmark_title,flowable.bookmark_key,0,False)
 def page(canvas,doc):
  if doc.page==1:return
  canvas.saveState();canvas.setStrokeColor(colors.HexColor('#dce3d4'));canvas.setLineWidth(.5);canvas.line(40,h-31,w-40,h-31)
  canvas.setFont('BookCN',7);canvas.setFillColor(muted);canvas.drawString(40,h-23,'大不了就出个Bug / 整理初稿');canvas.drawRightString(w-40,25,str(doc.page-1));canvas.restoreState()
 doc=BookDoc(str(ROOT/'downloads/worst-case-a-bug-draft.pdf'),pagesize=(w,h),leftMargin=36,rightMargin=36,topMargin=44,bottomMargin=38,title=DATA['title']+'：'+DATA['subtitle'],author='阿布')
 # Full-page cover has a preserved aspect ratio and fits within the content frame.
 story=[]
 cover=Image(str(ROOT/'assets/books/restart-cover.png'));ratio=cover.imageHeight/cover.imageWidth;cover.drawWidth=w-88;cover.drawHeight=cover.drawWidth*ratio
 story.extend([cover,PageBreak(),Spacer(1,35),Paragraph(esc(DATA['title']),styles['title']),Paragraph(esc(DATA['subtitle']),styles['chapter']),Paragraph('阿布 著',styles['label']),Spacer(1,15),Paragraph(esc(DATA['edition']),styles['label']),Paragraph(esc(DATA['note']),styles['body']),Paragraph('封面为作者提供的概念图，本版没有正式出版或 ISBN 信息。',styles['label']),PageBreak(),Paragraph('目录',styles['title'])])
 lastvol=None
 for c in CH:
  if c['volume'] and c['volume']!=lastvol:
   v=VOL[c['volume']];story.append(Spacer(1,8));story.append(Paragraph(f'第{["一","二","三","四","五"][c["volume"]-1]}卷 · {v["title"]} / {v["subtitle"]}',styles['label']));lastvol=c['volume']
  story.append(Paragraph(f'<link href="#{c["id"]}" color="#354b3b">{esc(c["label"]+" · "+c["title"])}</link>',styles['toc']))
 for c in CH:
  story.append(PageBreak());vol=VOL.get(c['volume'])
  label=(f'第{["一","二","三","四","五"][c["volume"]-1]}卷 · {vol["title"]} / ' if vol else '')+c['label']
  story.append(Paragraph(label,styles['label']))
  head=Paragraph(esc(c['title']),styles['chapter']);head.bookmark_key=c['id'];head.bookmark_title=c['label']+' · '+c['title'];story.append(head)
  for p in c['paragraphs']:story.append(Paragraph(esc(p),styles['body']))
 doc.build(story,onFirstPage=page,onLaterPages=page)
if __name__=='__main__':
 build_web();build_epub();build_pdf();
 from build_book_en import localize_web, build_english_downloads
 localize_web();build_english_downloads();print('Built book landing, 18 static chapters, EPUB 3 and PDF.')
