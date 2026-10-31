"""Bilingual static-book rendering and offline English editions."""
from pathlib import Path
import json,re,html,zipfile
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
ZH=json.loads((ROOT/'books/restart/manuscript.json').read_text())
EN=json.loads((ROOT/'books/restart/manuscript.en.json').read_text())
assert [c['id'] for c in ZH['chapters']]==[c['id'] for c in EN['chapters']]
assert all(len(a['paragraphs'])==len(b['paragraphs']) for a,b in zip(ZH['chapters'],EN['chapters']))
def esc(x):return html.escape(str(x),quote=True)
def bi(a,b):return f'<span data-l="zh" lang="zh-CN">{esc(a)}</span><span data-l="en" lang="en">{esc(b)}</span>'
def replace_node(node,a,b):
 node.clear();node.append(BeautifulSoup(bi(a,b),'html.parser'))
def localize_web():
 tr={ZH[k]:EN[k] for k in ['title','subtitle','edition','note']}
 tr.update({'阿布 著':'By Abu','把生活，一章一章搭起来。':'Rebuilding life, one chapter at a time.','18 篇 · 中文正文':'18 pieces · Chinese / English','在没有信号的地方，也能翻开。':'A book for places without a signal.',
 'KEEP A COPY / 离线阅读':'KEEP A COPY / OFFLINE READING','关于这份初稿':'About this draft','回到播客，听见故事最初的声音 ↗':'Back to the podcast, where the stories began ↗','查看另一版封面构想':'Another cover concept',
 '封面为作者提供的概念图，正文采用本页书名与副标题；图中视觉场景并非行程或事件发生地点的纪实证明。本版没有正式出版社或 ISBN 信息。':'The original cover is an author-supplied concept. Both language editions use the author’s supplied starry-sky covers. Cover scenes do not establish historical locations; this draft has no publisher or ISBN.',
 '仅作封面构想存档，图中的出版社、人物形象与证件画面不作为事实或正式出版信息。':'An archived visual concept only. The depicted publisher, person and documents are not verified facts or publication information.',
 '← 全书目录':'← Table of contents','章节目录':'Chapter contents','字号':'Type size','中文整理初稿':'Chinese / English drafts','阿布 · 大不了就出个Bug':'Abu · Worst Case, a Bug',
 '上一章':'Previous chapter','下一章 →':'Next chapter →','返回':'Back','书籍封面':'Book cover','读完了':'The end','下载，留下一份':'Download a copy',
 '整理初稿 · 依据作者大纲写作，尚待逐章审订。个人经历不是现行办事或医疗指南。':'Draft based on the author’s outline, pending review. Personal experiences are not current administrative or medical guidance.'})
 for a,b in zip(ZH['volumes'],EN['volumes']):
  tr.update({a[k]:b[k] for k in ['title','subtitle','description']})
  numeral=['一','二','三','四','五'][a['id']-1];tr[f'第{numeral}卷']=f'Part {a["id"]}';tr[f'第{numeral}卷 / {a["title"]}']=f'Part {a["id"]} / {b["title"]}'
 for a,b in zip(ZH['chapters'],EN['chapters']):
  tr.update({a['label']:b['label'],a['title']:b['title']})
  tr[a['label']+' · '+a['title']]=b['label']+' · '+b['title']
  for x,y in zip(a['paragraphs'],b['paragraphs']):tr[x]=y
 enchap={c['id']:c for c in EN['chapters']}
 for p in [ROOT/'book.html',*[ROOT/f'books/restart/{c["id"]}.html' for c in ZH['chapters']]]:
  soup=BeautifulSoup(p.read_text(),'html.parser');main=soup.select_one('[data-main]')
  duplicate=main.select_one('.book-volumes')
  if duplicate:duplicate.decompose()
  # Translate exact text nodes only; existing bilingual UI remains intact.
  for node in list(main.find_all(string=True)):
   if node.parent.has_attr('data-l') or node.find_parent(attrs={'data-l':True}):continue
   txt=str(node);clean=txt.strip()
   if clean in tr:node.replace_with(BeautifulSoup(bi(clean,tr[clean]),'html.parser'))
  if p.name=='book.html':
   h=main.select_one('h1');h.clear();h.append(BeautifulSoup('<span data-l="zh" lang="zh-CN">大不了<br/>就出个<i>Bug</i></span><span data-l="en" lang="en">Worst Case, <br/><i>a Bug</i></span>','html.parser'))
   replace_node(main.select_one('.book-pitch'),'从德州小镇到加州阳光，我们在异乡把生活一点点重新跑通。','From a small Texas town toward California sunshine, we gradually make a life together far from home.')
   replace_node(main.select_one('.book-position p'),'一个 F2 陪读者，与 F1 队友一起，在北美的生活系统里摸索、开荒，重新找回行动能力和自我定义。',EN['positioning'])
   words=sum(len(' '.join(c['paragraphs']).split()) for c in EN['chapters'])
   replace_node(main.select_one('.book-facts'),'5 卷 · 16 章 · 前言与后记 · 约 0.9 万字',f'5 parts · 16 chapters · Preface & afterword · About {round(words/100)*100:,} words in English')
   replace_node(main.select_one('.book-hero-copy .eyebrow'),'BOOK 01 / 中文散文','BOOK 01 / A MEMOIR IN TRANSLATION')
   replace_node(main.select_one('.book-downloads>div>p:not(.eyebrow)'),'网页、EPUB 与 PDF 按当前语言对应同一份初稿。EPUB 适合手机与电子阅读器，可调字号；PDF 保留固定分页，适合电脑阅读和打印。','The online reader, EPUB and PDF use the same draft in the selected language. EPUB offers adjustable type for phones and e-readers; PDF preserves page layout for reading and printing.')
   cover=main.select_one('.book-cover');orig=cover.img;orig['data-l']='zh'
   eng=soup.new_tag('img',src='assets/books/restart-cover-en.webp',alt='Worst Case, a Bug — Restarting Our Life in North America. Original author-supplied cover.',width='1122',height='1402');eng['data-l']='en';cover.append(eng)
   grid=main.select_one('.book-download-grid');grid.clear()
   for ext in ['epub','pdf']:
    for lang in ['zh','en']:
     is_en=lang=='en';a=soup.new_tag('a',href=f'downloads/worst-case-a-bug-draft{"-en" if is_en else ""}.{ext}');a['download']='';a['data-l']=lang
     a.append(BeautifulSoup(f'<span class="download-format">{ext.upper()} / {"ENGLISH" if is_en else "中文"}</span><strong>{("Take a copy" if ext=="epub" else "Keep every page") if is_en else ("带走一本书" if ext=="epub" else "保留每一页")} ↓</strong><span>{("Adjustable type · EPUB readers" if ext=="epub" else "A5 layout · Chapter bookmarks") if is_en else ("可调字号 · EPUB 阅读器" if ext=="epub" else "A5 排版 · 章节书签")}</span>','html.parser'));grid.append(a)
  else:
   c=enchap[p.stem];soup.html['data-title-en']=c['label']+' | '+c['title']
   soup.html['data-description-en']=c['paragraphs'][0]
  soup.html['data-description-zh']=soup.select_one('meta[name="description"]')['content']
  if p.name=='book.html':soup.html['data-description-en']=EN['positioning']
  # Language-sensitive accessible names, not only visible copy.
  for el in main.select('[aria-label]'):
   names={'书籍章节':'Book chapters','调整正文字号':'Adjust reading type size','缩小正文字号':'Decrease reading type size','放大正文字号':'Increase reading type size','翻页':'Chapter navigation'}
   if el['aria-label'] in names:el['data-aria-zh']=el['aria-label'];el['data-aria-en']=names[el['aria-label']]
  for node in soup.select('link[href*="book.css"]'):node['href']=node['href'].split('?')[0]+'?v=20261030-bilingual-2'
  for node in soup.select('script[src*="book-reader.js"]'):node['src']=node['src'].split('?')[0]+'?v=20261030-bilingual-2'
  p.write_text(str(soup))

def build_english_downloads():
 build_epub_en();build_pdf_en()
def build_epub_en():
 path=ROOT/'downloads/worst-case-a-bug-draft-en.epub'
 def page(title,body):return f'<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en"><head><meta charset="utf-8"/><title>{esc(title)}</title><link rel="stylesheet" href="style.css"/></head><body>{body}</body></html>'
 with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED) as z:
  z.writestr('mimetype','application/epub+zip',compress_type=zipfile.ZIP_STORED)
  z.writestr('META-INF/container.xml','<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
  z.writestr('OEBPS/style.css','body{font-family:serif;line-height:1.7;margin:6%;color:#304535}h1{font-size:1.8em;line-height:1.3}p{margin:0 0 1em;orphans:2;widows:2}.label{color:#7c8c6b;font-size:.85em}a{color:#526c46}li{margin:.5em 0}.cover{text-align:center;margin:0}.cover img{max-width:100%;max-height:95vh}')
  z.write(ROOT/'assets/books/restart-cover-en.png','OEBPS/cover.png')
  z.writestr('OEBPS/cover.xhtml',page(EN['title'],'<section epub:type="cover" class="cover"><img src="cover.png" alt="Worst Case, a Bug. Original author-supplied cover."/></section>'))
  z.writestr('OEBPS/title.xhtml',page(EN['title'],f'<h1>{esc(EN["title"])}</h1><h2>{esc(EN["subtitle"])}</h2><p>By Abu</p><p class="label">{esc(EN["edition"])}</p><p>{esc(EN["note"])}</p>'))
  nav='<nav epub:type="toc" id="toc"><h1>Contents</h1><ol><li><a href="title.xhtml">Title and editorial note</a></li>'
  for c in EN['chapters']:
   if c['id'] in [a['id'] for a in EN['chapters'] if a['id'] in ['chapter-01','chapter-04','chapter-08','chapter-10','chapter-14']]:
    index={'chapter-01':0,'chapter-04':1,'chapter-08':2,'chapter-10':3,'chapter-14':4}[c['id']];v=EN['volumes'][index]
    nav+=f'<li><a href="{c["id"]}.xhtml">Part {v["id"]}: {esc(v["title"])}</a></li>'
   nav+=f'<li><a href="{c["id"]}.xhtml">{esc(c["label"]+": "+c["title"])}</a></li>'
   z.writestr('OEBPS/'+c['id']+'.xhtml',page(c['title'],f'<section epub:type="chapter"><p class="label">{c["label"]}</p><h1>{esc(c["title"])}</h1>'+''.join('<p>'+esc(p)+'</p>' for p in c['paragraphs'])+'</section>'))
  z.writestr('OEBPS/nav.xhtml',page('Contents',nav+'</ol></nav>'))
  manifest='<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="style" href="style.css" media-type="text/css"/><item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image"/><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/><item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>'
  manifest+=''.join(f'<item id="{c["id"]}" href="{c["id"]}.xhtml" media-type="application/xhtml+xml"/>' for c in EN['chapters'])
  spine='<itemref idref="cover"/><itemref idref="title"/><itemref idref="nav"/>'+''.join(f'<itemref idref="{c["id"]}"/>' for c in EN['chapters'])
  z.writestr('OEBPS/content.opf',f'<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">urn:wcab:restart-life:english-draft-20261030</dc:identifier><dc:title>{esc(EN["title"]+": "+EN["subtitle"])}</dc:title><dc:creator>Abu</dc:creator><dc:language>en</dc:language><dc:description>{esc(EN["positioning"])}</dc:description><meta property="dcterms:modified">2026-10-30T00:00:00Z</meta></metadata><manifest>{manifest}</manifest><spine>{spine}</spine></package>')
 with zipfile.ZipFile(path) as z:
  for n in z.namelist():
   if n.endswith(('.xml','.xhtml','.opf','.svg')):ET.fromstring(z.read(n))
def build_pdf_en():
 from reportlab.pdfbase import pdfmetrics
 from reportlab.pdfbase.ttfonts import TTFont
 from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Image
 from reportlab.lib.styles import ParagraphStyle
 from reportlab.lib.colors import HexColor
 from reportlab.lib.units import mm
 pdfmetrics.registerFont(TTFont('BookEN','/System/Library/Fonts/Supplemental/Georgia.ttf'))
 pdfmetrics.registerFont(TTFont('BookENItalic','/System/Library/Fonts/Supplemental/Georgia Italic.ttf'))
 styles={
 'body':ParagraphStyle('EnBody',fontName='BookEN',fontSize=9.5,leading=14,spaceAfter=8,textColor=HexColor('#354b3b')),
 'chapter':ParagraphStyle('EnChapter',fontName='BookEN',fontSize=17,leading=23,spaceAfter=16,textColor=HexColor('#354b3b')),
 'label':ParagraphStyle('EnLabel',fontName='BookEN',fontSize=8,leading=12,spaceAfter=12,textColor=HexColor('#81916f')),
 'toc':ParagraphStyle('EnToc',fontName='BookEN',fontSize=9,leading=13,spaceAfter=8,textColor=HexColor('#354b3b'))}
 w,h=148*mm,210*mm
 class Doc(SimpleDocTemplate):
  def afterFlowable(self,f):
   if hasattr(f,'bookmark_key'):self.canv.bookmarkPage(f.bookmark_key);self.canv.addOutlineEntry(f.bookmark_title,f.bookmark_key,0,False)
 def chrome(c,d):
  if d.page==1:return
  c.saveState();c.setFont('BookEN',7);c.setFillColor(HexColor('#81916f'));c.drawString(36,h-25,'Worst Case, a Bug / English draft');c.drawRightString(w-36,24,str(d.page-1));c.restoreState()
 doc=Doc(str(ROOT/'downloads/worst-case-a-bug-draft-en.pdf'),pagesize=(w,h),leftMargin=32,rightMargin=32,topMargin=42,bottomMargin=36,title=EN['title']+': '+EN['subtitle'],author='Abu')
 story=[Image(str(ROOT/'assets/books/restart-cover-en.png'),width=w-80,height=(w-80)*1402/1122),PageBreak(),Spacer(1,25),Paragraph(esc(EN['title']),styles['chapter']),Paragraph(esc(EN['subtitle']),styles['chapter']),Paragraph('By Abu',styles['label']),Paragraph(esc(EN['edition']),styles['label']),Spacer(1,15),Paragraph(esc(EN['note']),styles['body']),PageBreak(),Paragraph('Contents',styles['chapter'])]
 for c in EN['chapters']:story.append(Paragraph(f'<link href="#{c["id"]}">{esc(c["label"]+": "+c["title"])}</link>',styles['toc']))
 for c in EN['chapters']:
  story.append(PageBreak());story.append(Paragraph(c['label'],styles['label']));head=Paragraph(esc(c['title']),styles['chapter']);head.bookmark_key=c['id'];head.bookmark_title=c['label']+': '+c['title'];story.append(head)
  for p in c['paragraphs']:story.append(Paragraph(esc(p),styles['body']))
 doc.build(story,onFirstPage=chrome,onLaterPages=chrome)
