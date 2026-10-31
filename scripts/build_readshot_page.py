"""Render ReadShot's product vision without presenting planned features as shipped."""
from pathlib import Path
from bs4 import BeautifulSoup
from html import escape
ROOT=Path(__file__).resolve().parents[1]
def bi(a,b):return '<span data-l="zh">'+escape(a)+'</span><span data-l="en">'+escape(b)+'</span>'
def feature(title,en,desc,de,version):
 return '<article><span class="rs-stage">'+version+'</span><h3>'+bi(title,en)+'</h3><p>'+bi(desc,de)+'</p></article>'
def build():
 p=ROOT/'products/readshot.html';s=BeautifulSoup(p.read_text(),'html.parser');main=s.select_one('[data-main]');footer=main.select_one('footer').extract();main.clear()
 s.select_one('meta[name="description"]')['content']='ReadShot · Capture, Understand, Remember. Android beta downloads, V1 learning loop and a staged product roadmap.'
 body='<div class="rs-page"><a class="detail-back" href="../products.html">← '+bi('全部产品','All products')+'</a><header class="rs-hero"><div class="rs-brand"><img src="../assets/icons/icon-readshot.webp" width="88" height="88" alt="ReadShot"/><div><p class="eyebrow">READING / LANGUAGE / MEMORY</p><h1>ReadShot</h1><p class="rs-tagline">Capture · Understand · Remember</p></div></div><p class="rs-hero-line">'+bi('拍下来，读懂它，再记住它。','Capture it. Understand it. Remember it.')+'</p><p class="rs-intro">'+bi('从纸页上的一道标记开始，让单词带着原句、页码和阅读时的记忆，回到下一次复习里。','Begin with a mark on a page. Bring a word back to review with its sentence, page and the memory of where you found it.')+'</p><p class="rs-status">'+bi('当前提供 Android 测试版；产品蓝图与目标 V1 功能在下方单独说明。','An Android beta is available. The product vision and target V1 scope are described separately below.')+'</p></header><section class="app-downloads" data-app-downloads="readshot" hidden></section><nav class="rs-section-nav" aria-label="ReadShot sections"><a href="#learning-loop">'+bi('学习闭环','Learning loop')+'</a><a href="#blueprint">'+bi('产品蓝图','Product vision')+'</a><a href="#app-design">'+bi('界面概念','Interface concept')+'</a><a href="#roadmap">'+bi('演进路线','Roadmap')+'</a></nav>'
 body+='<section class="rs-loop" id="learning-loop"><p class="eyebrow">'+bi('目标 V1 / 产品规划','TARGET V1 / PLANNED SCOPE')+'</p><h2>'+bi('先让一次阅读，真正走完一圈。','First, complete one learning loop.')+'</h2><p class="rs-section-intro">'+bi('第一版围绕采集、确认、理解与复习展开。以下为目标能力，不表示当前测试包已经全部实现。','The first target release focuses on capture, confirmation, understanding and review. These are planned capabilities, not a claim that every item exists in the current beta.')+'</p><ol class="rs-loop-steps">'
 for n,title,en,desc,de in [
 ('01','采集标记','Capture marks','拍照、导入与 OCR，找到被标记的词。','Capture or import a page; detect marked words with OCR.'),
 ('02','人工确认','Confirm the result','在原图上核对位置，增删误识别的单词。','Check locations on the original image and correct recognition errors.'),
 ('03','保留语境','Keep the context','词条与原句、页码、书籍一起保存。','Save the word with its sentence, page and source book.'),
 ('04','安排复习','Return to review','按掌握程度进入每日复习，回到原文理解。','Schedule daily review by recall and return to the original context.')]:
  body+='<li><span>'+n+'</span><h3>'+bi(title,en)+'</h3><p>'+bi(desc,de)+'</p></li>'
 body+='</ol><div class="rs-confirm-note"><strong>'+bi('确认，是学习闭环的一部分。','Confirmation belongs in the loop.')+'</strong><p>'+bi('标记识别之后先让用户确认，再写入单词本，避免误识别直接污染学习资料。','Review recognition results before adding them to the wordbook, so detection errors do not silently enter saved study material.')+'</p></div><div class="rs-scope-details">'
 v1=[
 ('智能拍照与标记识别','Capture and mark recognition','相机、相册与批量导入；识别高亮、下划线和圈词，在原图标出位置，并允许手动增删。','Camera, photo library and batch import; detect highlights, underlines and circles, show locations on the image and allow manual corrections.'),
 ('智能单词本','A wordbook with context','词形还原、去重、音标与发音、中英文释义、词性、CEFR 等级、原文例句与来源书籍；按书籍、日期、标签和掌握程度筛选。','Lemmatization, deduplication, pronunciation, bilingual definitions, parts of speech, CEFR levels, source sentences and books; filter by book, date, tag and mastery.'),
 ('智能复习','Review that returns on time','闪卡、认识／模糊／忘记评分、每日待复习列表、间隔重复调度与掌握状态；FSRS 作为后续调度升级方向。','Flashcards, recall ratings, daily due lists, spaced scheduling and mastery states; FSRS is a possible later scheduling upgrade.'),
 ('阅读来源管理','Reading sources','建立书籍、课程或阅读项目，记录照片、页码、原文和提取日期；同一单词可关联多个来源。','Create books, courses or reading projects; retain photos, page numbers, source text and capture dates. A word can link to multiple sources.'),
 ('基础体验与数据保障','Essential experience and data care','基础设置、离线访问已保存单词、数据导出与本地备份、隐私说明、识别失败重试，以及图片删除。','Settings, offline access to saved words, export and local backup, privacy information, recognition retries and image deletion.')
 ]
 for i,(title,en,desc,de) in enumerate(v1,1):
  body+='<details name="readshot-v1" class="rs-detail"><summary><span class="rs-detail-number">0'+str(i)+'</span><h3>'+bi(title,en)+'</h3><span class="rs-detail-plus" aria-hidden="true">+</span></summary><p>'+bi(desc,de)+'</p></details>'
 body+='</div></section><section class="rs-blueprint" id="blueprint"><details class="rs-fold"><summary><div><p class="eyebrow">'+bi('长期蓝图','LONG-TERM VISION')+'</p><h2>'+bi('八个方向，不必同时出发。','Eight directions, one step at a time.')+'</h2></div><span class="rs-detail-plus" aria-hidden="true">+</span></summary><p class="rs-section-intro">'+bi('按学习闭环逐步扩展，优先验证持续使用，再增加复杂能力。','Expand from the learning loop. Validate sustained use before adding complexity.')+'</p><div class="rs-module-grid">'
 for args in [
 ('智能采集','Smart capture','拍照 · OCR · 标记识别','Photos · OCR · Mark detection','V1'),
 ('智能词库','Word library','释义 · 语境 · 分类','Definitions · Context · Organization','V1'),
 ('记忆复习','Memory & review','闪卡 · 听写 · 间隔重复','Flashcards · Dictation · Spaced review','V1+'),
 ('阅读管理','Reading library','书籍 · 笔记 · 进度','Books · Notes · Progress','V1+'),
 ('AI 阅读导师','AI reading tutor','问答 · 精读 · 语法','Questions · Close reading · Grammar','V1.5+'),
 ('知识图谱','Word connections','词汇关系 · 主题关联','Word relationships · Themes','V2'),
 ('音频学习','Audio learning','跟读 · 播客 · 听力','Shadowing · Audio · Listening','V2'),
 ('成长分析','Learning insights','学习报告 · 阅读轨迹','Reports · Reading history','V1–V3')]:
  body+=feature(*args)
 body+='</div><p class="rs-small-note">'+bi('阶段标签表示规划方向，各模块不会在同一版本一次性完成。','Stage labels indicate intended direction. Each module may develop across releases.')+'</p></details></section>'
 body+='<section class="rs-design" id="app-design"><div class="rs-design-copy"><p class="eyebrow">'+bi('界面与信息结构 / 概念','INTERFACE & INFORMATION / CONCEPT')+'</p><h2>'+bi('四个底部入口，把扫描留在手边。','Four destinations, with capture close at hand.')+'</h2><p class="rs-section-intro">'+bi('Home、Library、Review、Insights 分担日常任务；Scan 作为突出的扫描入口。AI 导师从词条与阅读详情进入，不必一开始独占一个导航位置。','Home, Library, Review and Insights organize daily tasks, with Scan as a prominent capture action. A tutor can begin within word and reading details without requiring its own tab.')+'</p><dl class="rs-tab-explainer">'
 for name,zh,en in [('Home','今日复习、快捷扫描、学习概览','Today’s review, quick capture, learning overview'),('Library','单词本、书籍、阅读记录','Words, books and reading records'),('Scan','拍照、导入、识别、确认保存','Capture, import, recognize, confirm'),('Review','闪卡、测验、听写、复习计划','Flashcards, quizzes, dictation and scheduling'),('Insights','词汇增长、学习趋势、阅读统计','Vocabulary growth, learning trends and reading statistics')]:
  body+='<div><dt>'+name+'</dt><dd>'+bi(zh,en)+'</dd></div>'
 body+='</dl><p class="rs-small-note">'+bi('右侧为规划中的英文界面示意，数字均为示例，不是当前 App 截图或真实学习数据。','The English interface at right is a design concept. All numbers are illustrative, not a current app screenshot or real learning data.')+'</p></div><figure class="rs-device"><div class="rs-device-screen" role="img" aria-label="ReadShot planned English interface with illustrative data"><div class="rs-phone-top"><span>ReadShot</span><span class="rs-demo-label">CONCEPT / SAMPLE DATA</span></div><p class="rs-phone-greeting">Good evening</p><h3>Keep reading.<br/>Keep growing.</h3><div class="rs-phone-stats"><div><strong>128</strong><span>Saved Words</span></div><div><strong>18</strong><span>Due Today</span></div><div><strong>6</strong><span>Books</span></div></div><div class="rs-phone-scan"><span class="rs-scan-symbol" aria-hidden="true">⌗</span><h4>Scan your reading</h4><p>Capture highlighted, circled or underlined words from a page.</p><span class="rs-fake-action">Scan a page ↗</span></div><div class="rs-phone-review-head"><strong>Today’s review</strong><span>18 words due</span></div><div class="rs-phone-word"><span>REVIEW IN CONTEXT</span><h4>inevitable</h4><p>adj. 不可避免的</p><small>The Count of Monte Cristo<br/>Sample source</small></div><div class="rs-phone-tabs" aria-hidden="true"><span>Home</span><span>Library</span><span class="rs-phone-scan-tab">＋</span><span>Review</span><span>Insights</span></div></div><figcaption>'+bi('规划界面 · 示例数据 · 非运行截图','Planned interface · Sample data · Not a running app')+'</figcaption></figure></section>'
 body+='<section class="rs-differences"><details class="rs-fold"><summary><div><p class="eyebrow">'+bi('差异化方向','WHAT MAKES IT DISTINCT')+'</p><h2>'+bi('记住的不只是一个释义。','Remember more than a definition.')+'</h2></div><span class="rs-detail-plus" aria-hidden="true">+</span></summary><div class="rs-difference-list">'
 for title,en,desc,de,version in [
 ('原文语境记忆','Memory in context','保留句子、页码与当时的标记。复习时先从原句猜词义，而不只是记住“inevitable = 不可避免的”。','Keep the sentence, page and original mark. Recall meaning through the source context rather than only a translated definition.','V1'),
 ('AI 个性化英语导师','A personalized English tutor','围绕当前语境解释词义，并规划适合用户水平的例句、选择题、填空题与写作练习。','Explain meaning within context and plan level-appropriate examples, multiple-choice questions, cloze exercises and writing practice.','V1.5'),
 ('单词关系网络','A network of words','把同义、反义、词根词缀、搭配和主题关系连起来，例如 revenge、vengeance、retaliation。','Connect synonyms, antonyms, roots, affixes, collocations and themes, such as revenge, vengeance and retaliation.','V2'),
 ('AI 听力与播客','Personal listening material','用新增词汇和阅读内容生成计划约 3–5 分钟的原创英语材料，加入词汇复现、解释与练习，并支持调节语速。','Generate original English listening material from new words and reading, planned at about 3–5 minutes, with repetition, explanation, exercises and adjustable speed.','V2'),
 ('阅读时间胶囊','Reading time capsules','把某一天的书、句子与笔记留到未来再打开，让单词本逐渐成为阅读记忆库。','Return later to a day’s books, marked sentences and notes, allowing a wordbook to become a lasting reading memory.','V3')]:
  body+=feature(title,en,desc,de,version)
 body+='</div></details></section><section class="rs-roadmap" id="roadmap"><p class="eyebrow">'+bi('版本演进 / 建议排期','VERSION ROADMAP / INDICATIVE TIMING')+'</p><h2>'+bi('先跑通，再长大。','Make it work, then let it grow.')+'</h2><p class="rs-section-intro">'+bi('以下时间按项目启动后的月份估算，不是发布日期承诺；尚未设定具体起始日期。','Timing is estimated in months from a project start, not a release commitment. No calendar start date has been set.')+'</p><ol>'
 for version,time,et,title,en,desc,de,goal,ge in [
 ('V1.0','第 1–2 个月','Months 1–2','核心学习闭环','Core learning loop','真实标记识别、单词本、原文语境、闪卡、阅读来源与数据导出。','Mark recognition, wordbook, source context, flashcards, reading sources and export.','验证用户愿意持续使用','Validate sustained use'),
 ('V1.5','第 3–4 个月','Months 3–4','AI 学习增强','AI-assisted learning','语境解释、自动练习、个性化难度与批量识别优化。','Context explanations, generated exercises, personalized difficulty and improved batch recognition.','提升学习效果和留存','Improve learning and retention'),
 ('V2.0','第 5–8 个月','Months 5–8','多格式与多模态','More formats and modalities','PDF 与电子书导入、网页剪藏、词汇关系、听力材料与 Anki 导出。','PDF and e-book import, web clipping, word relationships, listening material and Anki export.','扩展使用场景','Broaden reading contexts'),
 ('V3.0','第 9–12 个月','Months 9–12','长期阅读记忆','Long-term reading memory','阅读导师、时间胶囊、年度报告、阅读地图与跨设备同步。','Reading tutor, time capsules, annual reports, reading maps and cross-device sync.','建立长期用户价值','Build long-term value')]:
  body+='<li><div class="rs-roadmap-time"><strong>'+version+'</strong><span>'+bi(time,et)+'</span></div><div><h3>'+bi(title,en)+'</h3><p>'+bi(desc,de)+'</p><span class="rs-roadmap-goal">'+bi(goal,ge)+'</span></div></li>'
 body+='</ol><p class="rs-small-note">'+bi('实际节奏主要取决于标记识别准确率、测试设备覆盖、AI 成本与用户反馈。','Actual pace depends on mark-recognition accuracy, device coverage, AI cost and user feedback.')+'</p></section><div class="rs-bottom"><a class="text-link" href="../products.html">← '+bi('回到产品目录','Back to products')+'</a><span>'+bi('产品源码暂未公开','Product source is not public')+'</span></div></div>'
 wrapper=BeautifulSoup(body,'html.parser').find('div',class_='rs-page');wrapper.append(footer);main.append(wrapper)
 for old in s.select('link[href*="css/readshot.css"]'):old.decompose()
 css=s.new_tag('link',rel='stylesheet',href='../css/readshot.css?v=20261031-contrast');s.head.append(css)
 p.write_text(str(s))
if __name__=='__main__':build()
