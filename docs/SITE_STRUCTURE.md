# 网站内容层级

品牌链接返回首页。首页只保留介绍、一个精选作品和三条内容更新。

主导航：

- 作品（work.html）：产品与工具、量化研究。
- 声音与文字（stories.html）：播客、书籍、随笔、小诗。
- 生活记录（journal.html）：徒步、旅行与日常探索。
- 关于（about.html）：个人介绍和联系入口。

旧页面路径和深链接继续可用。主导航高亮的是当前内容所属目录，不把每种内容都放在主导航里。
播客默认进入已发布音频，筹备与文稿保留为视觉权重更低的次级入口。

共享静态导航由 scripts/site_navigation.py 维护；scripts/build_site_hubs.py 生成首页和两个目录页并统一更新导航。
书籍、播客文稿构建器已同步使用新目录关系。新增或重新生成页面后，可运行：

    python3 scripts/site_navigation.py

只需统一导航时不要重新构建首页；首页和目录内容调整后才运行 scripts/build_site_hubs.py。
