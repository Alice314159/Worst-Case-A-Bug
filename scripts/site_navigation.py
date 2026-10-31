"""Shared five-entry navigation (Work, Books & writing, Podcast, Life, About), with Work section links and a follow block."""
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
SECTIONS={'work':[('products','产品与工具','Products & tools','products.html'),('quant','量化研究','Quant research','quant.html')]}
SECTION_OF={}
MAIN=[('work','作品','Work','products.html'),('writing','书与写作','Books & writing','writing.html'),('podcast','播客','Podcast','podcast.html'),('journal','生活','Life','journal.html'),('about','关于','About','about.html')]
ICONS={'rss':'<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.2" fill="currentColor" stroke="none"/>',
 'mail':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
 'code':'<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>'}
FOLLOW=[('rss','订阅播客','Podcast RSS','https://feed.firstory.me/rss/user/cmq5jhwm702rk01zl3m029l0a'),
 ('mail','写信给我','Email me','mailto:hello.worstcaseabug@gmail.com'),
 ('code','GitHub','GitHub','https://github.com/Alice314159')]
def label(zh,en):return BeautifulSoup('<span data-l="zh">'+zh+'</span><span data-l="en">'+en+'</span>','html.parser')
def icon(name):return BeautifulSoup('<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg>','html.parser')
GROUPS={'home':'home','work':'work','products':'work','quant':'work','stories':'writing','podcast':'podcast','books':'writing','writing':'writing','poems':'writing','journal':'journal','about':'about'}
def apply_navigation(soup, depth=0):
 sidebar=soup.select_one('[data-sidebar]')
 if not sidebar:return
 nav=sidebar.find('nav')
 if not nav:return
 route=soup.html.get('data-current-page','home');group=GROUPS.get(route,route)
 soup.html['data-nav-section']=group
 prefix='../'*depth
 nav.clear();nav['aria-label']='Main navigation';nav['class']=['site-main-nav']
 for key,zh,en,file in MAIN:
  a=soup.new_tag('a',href=prefix+file);a['data-nav']=key;a['style']='padding:12px 20px;color:#53664b'
  if group==key:a['aria-current']='page' if route==key and depth==0 else 'true'
  a.append(label(zh,en));nav.append(a)
  if key not in SECTIONS:continue
  sub=soup.new_tag('div');sub['class']=['site-sub-nav']
  for skey,szh,sen,sfile in SECTIONS[key]:
   b=soup.new_tag('a',href=prefix+sfile);b['data-subnav']=skey
   if SECTION_OF.get(route,route)==skey:b['aria-current']='page' if route==skey and depth==0 else 'true'
   b.append(label(szh,sen));sub.append(b)
  nav.append(sub)
 foot=sidebar.select_one('[data-side-foot]')
 if foot:foot.decompose()
 foot=soup.new_tag('div');foot['data-side-foot']='';foot['class']=['site-follow']
 heading=soup.new_tag('p');heading['class']=['site-follow-label'];heading.append(label('关注与联系','Follow & contact'));foot.append(heading)
 for name,zh,en,href in FOLLOW:
  a=soup.new_tag('a',href=href)
  if href.startswith('http'):a['rel']='noopener'
  a.append(icon(name));a.append(label(zh,en));foot.append(a)
 sidebar.append(foot)
 for css in soup.select('link[href*="css/nav.css"]'):css.decompose()
 main_css=soup.select_one('link[href*="css/style.css"]')
 if main_css:main_css.insert_after(soup.new_tag('link',href=prefix+'css/nav.css?v=20261031-nav',rel='stylesheet'))
 for style in soup.select('link[href*="css/style.css"]'):style['href']=prefix+'css/style.css?v=20261031-structure'
 for js in soup.select('script[src*="js/site.js"]'):js['src']=prefix+'js/site.js?v=20261031-structure'
def update_all():
 for p in ROOT.rglob('*.html'):
  if any(part in ['.git','node_modules','admin'] for part in p.relative_to(ROOT).parts):continue
  soup=BeautifulSoup(p.read_text(),'html.parser')
  if not soup.select_one('[data-main]'):continue
  if soup.select_one('meta[http-equiv="refresh"]'):continue
  apply_navigation(soup,len(p.relative_to(ROOT).parent.parts));p.write_text(str(soup))
if __name__=='__main__':update_all()
