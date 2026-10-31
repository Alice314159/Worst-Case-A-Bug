# 网站内容层级

品牌链接返回首页。首页只放一句介绍、两个精选（ReadShot 和《大不了就出个 Bug》）和最新一期播客。

主导航（5 个直达入口）：

- 作品（products.html）：产品与工具；页顶切换到量化研究（quant.html）。侧栏在「作品」下列出这两个二级入口。
  - 产品页分两层：主力产品（大卡片）和小工具（紧凑列表）。
  - Strata、ParquetViewer 只出现在量化研究的「数据与工具」组，详情页返回量化研究。
- 书与写作（writing.html）：书（主角）、三篇随笔、两首英文小诗（#poems）。书的目录与下载仍在 book.html。
- 播客（podcast.html）：已发布单集为主；未录制的文稿和选题收在页底「还在准备的」（#in-the-works，原 #manuscripts、#upcoming 锚点保留）。
- 生活（journal.html）：徒步（#trails）与短片（#film）。
- 关于（about.html）：个人介绍和联系方式。

已退役的目录页保留为跳转页，旧链接不会失效：
work.html → products.html，stories.html → writing.html，poems.html → writing.html#poems。

侧栏底部是「关注与联系」（播客 RSS、邮箱、GitHub）。窄屏（≤980px）只保留 5 个主入口的横向导航。样式在 css/nav.css。

共享静态导航由 scripts/site_navigation.py 维护；scripts/build_site_hubs.py 生成首页和跳转页，并统一更新导航。
首页的「最新一期播客」读取 js/podcast-data.js，运行 scripts/update_podcast.py 之后也要重新运行：

    python3 scripts/build_site_hubs.py

只需统一导航时运行：

    python3 scripts/site_navigation.py

内容精简前的完整备份在项目文件 backups/wcab-before-ia-20261031-1638.tgz。
