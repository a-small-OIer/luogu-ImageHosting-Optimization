# luogu-ImageHosting-Optimization
支持 `ctrl+V` 把剪切板中的图片上传到洛谷图床的油猴脚本。

## 简介

每次上传图片都要“截图 → 保存 → 选择文件”太麻烦。  
这个脚本让你在洛谷图床页面直接粘贴图片，剩下的交给洛谷原生上传流程。

- 作者：a_small_OIer
- 适用页面：`https://www.luogu.com.cn/image`
- 类型：UserScript
- 许可证：MIT

本插件由 DeepSeek V4.1 Pro 提供技术支持。

readme 主体为 DeepSeek V4.1 Flash 完成。

## 功能

- 在洛谷图床页面监听 `paste` 事件；
- 自动识别剪贴板中的图片；
- 优先模拟拖拽到上传区域；
- 拖拽失败时回退到 `input[type=file]`；
- 上传时显示轻量 toast 提示；
- 无外部依赖，不向第三方服务器发送图片。

## 实现原理

脚本只做三件事：

1. 判断当前是否在 `/image` 页面；
2. 从 `clipboardData.items` / `clipboardData.files` 中找图片；
3. 把图片交给洛谷图床原生上传区域。

优先使用拖拽模拟：

```js
var dt = new DataTransfer();
dt.items.add(file);

var ev = new DragEvent('drop', {
  bubbles: true,
  cancelable: true,
  dataTransfer: dt
});

zone.dispatchEvent(ev);
```

如果失败，则回退到文件输入框：

```js
input.files = dt.files;
input.dispatchEvent(new Event('change', { bubbles: true }));
```

## 兼容性

- Chrome / Edge / Firefox
- Tampermonkey / Violentmonkey
- 需要浏览器支持 `DataTransfer` 和 `DragEvent`
- 
## 开发

### 目录结构

```text
luogu-paste-upload/
├── README.md
├── LICENSE
├── .gitignore
├── .gitattributes
└─── luogu-paste-upload.user.js
```

## License

MIT License。

Copyright © 2026 a_small_OIer