const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const files = walk(path.join(root, 'miniprogram'));
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.json')) JSON.parse(text);
  if (file.endsWith('.js')) {
    new vm.Script(text, { filename: file });
    if (/\b(document|window|process)\./.test(text) || /require\(['"]node:/.test(text)) throw new Error('小程序运行时代码引用了宿主专有 API: ' + file);
  }
}
const app = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json')));
for (const page of app.pages) for (const ext of ['js', 'json', 'wxml', 'wxss']) if (!fs.existsSync(path.join(root, 'miniprogram', page + '.' + ext))) throw new Error('缺少页面文件: ' + page + '.' + ext);
const config = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json')));
if (!config.setting.urlCheck) throw new Error('域名校验必须启用');
const bytes = files.reduce((sum, f) => sum + fs.statSync(f).size, 0);
console.log('配置与 JavaScript 语法检查通过；小程序源文件 ' + bytes + ' 字节（不等于微信上传包大小）。');
