"""Shared four-entry navigation for the static site and its page generators."""
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
GROUPS={'home':'home','work':'work','products':'work','quant':'work','stories':'stories','podcast':'stories','books':'stories','writing':'stories','poems':'stories','journal':'journal','about':'about'}
def apply_navigation(soup, depth=0):
 sidebar=soup.select_one('[data-sidebar]')
 if not sidebar:return
 nav=sidebar.find('nav')
 if not nav:return
 route=soup.html.get('data-current-page','home');group=GROUPS.get(route,route)
 soup.html['data-nav-section']=group
 prefix='../'*depth
 nav.clear();nav['aria-label']='Main navigation';nav['class']=['site-main-nav']
 for key,zh,en,file in [('work','作品','Work','work.html'),('stories','声音与文字','Stories','stories.html'),('journal','生活记录','Life','journal.html'),('about','关于','About','about.html')]:
  a=soup.new_tag('a',href=prefix+file);a['data-nav']=key;a['style']='padding:12px 20px;color:#53664b'
  if group==key:a['aria-current']='page' if route==key else 'true'
  a.append(BeautifulSoup('<span data-l="zh">'+zh+'</span><span data-l="en">'+en+'</span>','html.parser'));nav.append(a)
 foot=sidebar.select_one('[data-side-foot] p')
 if foot:
  foot.clear();foot.append(BeautifulSoup('<span data-l="zh">做些工具，留些故事。</span><span data-l="en">Tools, stories, everyday life.</span>','html.parser'))
 for style in soup.select('link[href*="css/style.css"]'):style['href']=prefix+'css/style.css?v=20261030-focused'
 for js in soup.select('script[src*="js/site.js"]'):js['src']=prefix+'js/site.js?v=20261030-focused'
def update_all():
 for p in ROOT.rglob('*.html'):
  if any(part in ['.git','node_modules','admin'] for part in p.relative_to(ROOT).parts):continue
  soup=BeautifulSoup(p.read_text(),'html.parser')
  if not soup.select_one('[data-main]'):continue
  apply_navigation(soup,len(p.relative_to(ROOT).parent.parts));p.write_text(str(soup))
if __name__=='__main__':update_all()
