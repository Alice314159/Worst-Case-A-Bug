# App 下载发布

现有网站是静态前台 + 独立统计接口，尚不提供后台上传安装包或管理版本。
产品详情页已接入统一下载组件。配置在 `js/app-downloads-data.js`；没有真实安装包
的产品不显示下载区域，不使用虚构的版本或失效占位链接。

## 当前推荐：GitHub Releases

将安装包作为 Release asset 上传，而不是提交进网站 Git 历史。
网页使用安装包资产的 HTTPS 直链。若产品源码仓库不公开，可以选择公开的、仅发布
二进制文件的专用发行仓库。私有仓库的下载地址不能当成公开用户的下载地址。

建议文件名包括产品、版本、平台和架构，例如：

- PhotoFlow-1.0.0-macos-arm64.dmg（示例命名，不表示已有此版本）
- voCut-1.0.0-windows-x64.exe
- Sona-1.0.0-android.apk

公开发布安装包前，需确认具体文件、版本和目标平台；不要上传私钥、签名证书、
密钥、源数据或调试目录。GitHub 发布资产是单独的文件，不受 `.gitignore` 的保护。

## 下载数据结构

以下仅为配置示例，不会自动显示在网页。URL 必须替换为实际可公开下载的地址。

```javascript
window.appDownloads = {
  photoflow: {
    version: '1.0.0',
    notesZh: '填写与本版本相符的安装说明。',
    notesEn: 'Installation notes for this release.',
    files: [
      {
        platform: 'macos',
        arch: 'Apple Silicon',
        name: 'PhotoFlow-1.0.0-macos-arm64.dmg',
        minimumOS: '填写实际支持的系统版本',
        sizeBytes: 12345678,
        url: 'https://github.com/OWNER/REPO/releases/download/TAG/ASSET.dmg',
        sha256: '填写实际文件的64位SHA-256校验值'
      }
    ]
  }
};
```

键名与产品详情页文件名一致，例如 `photoflow`、`vocut`、`sona`、`lexigo`。
支持的平台值：`macos`、`windows`、`android`、`ios`、`linux`。
可省略未确认的版本、文件大小或校验值；不要推测填写。iOS 的 `url` 可使用
App Store 或 TestFlight 等实际发行链接，界面显示“获取 App”。

组件只接受 HTTPS 地址，不允许含账号密码的 URL。不要填写临时签名 URL，
否则过期后下载入口会失效。跨域下载是否直接弹出保存对话框，由文件服务器的
Content-Disposition 等响应头决定，网页的 download 属性不能强制所有跨域文件下载。

## 后续扩展

1. App 多起来后可增加下载中心与版本记录。
2. 若需要在后台上传和发布版本：使用 Cloudflare R2 保存二进制文件，D1 保存
   产品、版本、平台、文件名、大小、校验值和发布状态；Worker 处理管理员鉴权。
3. 正式 R2 下载建议使用自定义域名，r2.dev 是开发用途。
4. 下载点击、实际文件下载和安装完成是不同指标；现有页面访问统计不会冒充下载次数。

## 参考

- GitHub Releases：https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- R2 公开存储：https://developers.cloudflare.com/r2/buckets/public-buckets/
- macOS 发行：https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
- Apple 发行方式：https://help.apple.com/xcode/mac/current/en.lproj/dev31de635e5.html

## 已发布版本

- ReadShot 1.0.0 Android 测试版：`readshot-v1.0.0-beta.1`。最低 Android 8.0，使用调试证书；发行页明确标记为预发布。
- 安装包保存于 GitHub Releases，不进入网站仓库。下载入口位于 ReadShot 产品详情页。
