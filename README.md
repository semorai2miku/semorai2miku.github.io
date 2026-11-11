# Hugo 博客

基于 Hugo 0.169.0 和 PaperMod，主题通过 Git 子模块管理。

## 编辑

- `hugo.toml`：网站名称、首页介绍、访问地址和菜单。
- `content/posts/`：Markdown 文章。
- `content/about.md`：关于页。
- `static/images/`：图片。

新文章默认是草稿，发布前将文章头部的 `draft` 改为 `false`。

## 本地命令

项目保留了 Windows x64 版 Hugo，直接在项目根目录运行：

```powershell
# 预览，包含草稿；按 Ctrl+C 停止
.\.tools\hugo\hugo.exe server -D -p 8088

# 新建文章
.\.tools\hugo\hugo.exe new content posts/my-first-post.md

# 构建正式网站，输出到 public/
.\.tools\hugo\hugo.exe --gc --minify
```

预览地址：http://localhost:8088/。本机默认的 1313 端口受限，因此使用 8088。

若已全局安装 Hugo，可将命令中的 `.\.tools\hugo\hugo.exe` 换成 `hugo`。

## 克隆到新电脑

`.tools/` 不提交到 Git。新电脑需要自行安装 Hugo，并获取主题子模块：

```powershell
git submodule update --init --recursive
```

## GitHub Pages

目标仓库：[semorai2miku.github.io](https://github.com/semorai2miku/semorai2miku.github.io)。网站地址：[https://semorai2miku.github.io/](https://semorai2miku.github.io/)。

部署配置位于 `.github/workflows/hugo.yml`，使用 GitHub Actions 发布。之后修改文章或配置，提交并推送 `main` 即可自动更新：

```powershell
git add .
git commit -m "Update blog"
git push
```

`hugo.toml` 的 `baseURL` 已设为上述网址；工作流使用 Pages 返回的实际地址构建。部署进度和失败日志可在仓库的 Actions 页面查看。

使用 GitHub 默认域名，无需配置自定义域名或 DNS。

## 参考

- [Hugo 文档](https://gohugo.io/documentation/)
- [PaperMod 文档](https://github.com/adityatelange/hugo-PaperMod/wiki)
