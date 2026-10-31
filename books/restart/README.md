# 《大不了就出个Bug：我在北美重启生活》

阿布 · 中文整理初稿（2026 年 10 月）。

## 内容来源与编辑边界

- 本版根据作者在本次对话提供的五卷、十六章大纲写成，另含前言和后记。
- `manuscript.json` 为正文唯一来源；不是播客逐字稿，尚待作者审订。
- 时间顺序以作者大纲为准：SSN 位于第二学年；冬季寒假航天中心经历在身份卷；告别德州为第一阶段收束。
- 不为现场补造引号对话、具体日期、医嘱、保险条款或身份变化原因。
- 每章分成六个散文段落；人物、金额、路线与事件依据作者大纲，不另作现行指南。
- 两张封面由作者提供。星空版作主封面；另一版仅作概念图展示，不采纳其中出版社、证件、人物形象等为事实或正式出版信息。

## 页面与文件

- `book.html`：独立书籍导航、封面、五卷目录及下载入口。
- `books/restart/*.html`：18 篇静态正文，支持目录、前后章、字号与本机续读位置。
- `downloads/worst-case-a-bug-draft.epub`：EPUB 3，含封面、导航、书名页、编写说明和全部正文。
- `downloads/worst-case-a-bug-draft.pdf`：A5、22 页，嵌入中文字体，含可点击目录与 18 个章节书签。

## 重新生成

在具备 `beautifulsoup4`、`reportlab` 和 `Pillow` 的 Python 环境中，从仓库根目录运行：

```sh
python3 scripts/build_book.py
```

PDF 构建当前使用 macOS 系统字体 `/System/Library/Fonts/Supplemental/Arial Unicode.ttf`，嵌入子集以供离线阅读。迁移构建环境时需指定可嵌入的中文 TrueType 字体。

改稿应先修改 `manuscript.json`，再重新生成网页、EPUB 与 PDF，避免三个版本分叉。重新生成后需检查页面资源、EPUB XML/资源和 PDF 全文与分页。

## 双语版

- 中文和英文在同一章节 URL 中逐段对应；切换语言不跳回前言。
- 英文源稿：`manuscript.en.json`；翻译仍为待审订初稿。
- 全站切换为英文时，封面、目录、正文与下载入口一同切换。中文版使用中文星空封面，英文版使用作者提供的英文星空封面。
- 英文下载：`downloads/worst-case-a-bug-draft-en.epub` 与 `downloads/worst-case-a-bug-draft-en.pdf`（21 页）。
- 构建脚本生成中文版本后调用 `scripts/build_book_en.py`，对齐双语页面并生成英文文件。
