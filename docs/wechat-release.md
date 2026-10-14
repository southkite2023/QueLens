# 微信兼容与上架准备

核查日期：2026-10-14。官方页面已直接获取正文阅读（浏览检索工具无法打开，使用 HTTPS 获取成功）；以下为工程落地说明，不是平台预审通过证明。提交前需复核实时规范与后台提示。

## 官方依据

- [开发框架](https://developers.weixin.qq.com/miniprogram/dev/framework/)：原生页面结构与平台 API。
- [全局配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)：pages/window 等配置；requiredPrivateInfos 用于相关地理位置接口，不能把 chooseMedia 填进去。
- [网络](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)：外部服务使用配置过的 HTTPS 域名，域名需 ICP 备案；AppSecret 保存在服务端。当前启用 urlCheck，无外部请求。
- [隐私协议开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/PrivacyAuthorize.html)：后台先声明涉及的信息类型；当前平台提供官方隐私弹窗。媒体适配层先 requirePrivacyAuthorize，拒绝不读取照片。不使用已过时的 __usePrivacyCheck__ 开关。
- [chooseMedia](https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html)：使用一张图片和临时文件路径；低基础库进行能力检测。
- [平台运营规范](https://developers.weixin.qq.com/miniprogram/product/)：功能、名称、类目与实际服务保持一致，提供有效联系渠道，限制赌博内容/功能与违法活动便利，保护用户数据。

## 已采用的设计

原生渲染、页面内存计算；无需登录和分享解锁，无支付、金额换算、赌局组织或用户间资金结算。首版定位牌型学习与解释工具，这是产品设计选择，不代表平台已认可该类目。麻将相关工具仍须按实际功能判断，不能用“工具”命名规避审核。

开发者工具配置基础库3.1.0；媒体层检查实际能力并在缺失时拒绝。页面 CSS 使用 rpx、flex 和底部安全区；实际 iOS/Android 排版和系统字体仍需微信真机验收。没有经过微信编译、上传或审核，不承诺已兼容全部客户端。

## 尚待准备（当前不可上架）

1. 用户目前未注册小程序。到 [微信公众平台](https://mp.weixin.qq.com/) 注册并确定主体；提交真实主体资料，获取 AppID，添加开发者。不要在对话或仓库提供 AppSecret。
2. 在当前后台确认服务类目与对应资质，并按后台流程完成小程序备案、名称与品牌权利确认。不能预先保证个人主体一定能选择适用类目。
3. 补齐运营主体、真实客服联系方式、正式隐私说明和相关协议；当前页面仅是开发版的数据处理说明，不能代替正式政策。
4. 确认成都场规、完成番数与例牌验收，再扩展碰杠录入及特殊事件。拍照识牌未完成，不在提审介绍宣传该功能。
5. 启用照片前完成后台隐私保护指引、拒绝/同意/撤回与低版本测试；若接入服务，声明实际接收方、用途和保存期限，实现删除机制。
6. 微信开发者工具编译与真机测试：iOS/Android、窄屏/大字体、定缺/数量错误、照片拒绝/取消、无网络。检查体验版与正式域名校验，不以关闭 urlCheck 替代配置。
7. 检查微信实际上传包大小，准备截图、准确功能介绍和审核路径，提审通过后再发布。

Node 测试不等于微信真机测试或平台审核。游客 AppID 不能替代真实注册/上传资质。
