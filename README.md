# Debug My Thinking / 认知调试器

这是云谷学校黑客松项目“大秦工业”的可运行原型：不替学生解题，而是像调试代码一样，定位学生思考过程中的断点。

## 本地运行

```bash
npm install
npm run dev
```

生产构建和测试：

```bash
npm run build
npm run test
```

打开应用后，默认是本地演示模式。点击“载入演示案例”即可体验数学、科学和语文三个完整案例；也可以填写自己的题目、草稿、理由和卡点。

## 公网部署

项目通过 GitHub Actions 自动发布到 GitHub Pages。每次推送到 `main` 后会自动测试、构建并部署静态站点。首次部署完成后，访问：

```text
https://bluebell122.github.io/debug-my-thinking/
```

## 两种分析模式

- **本地演示**：完全离线、确定性输出，适合课堂和黑客松现场。
- **远端模型**：调用 OpenAI 兼容的 Chat Completions 地址。复制环境变量示例后填写完整 POST 地址：

```bash
cp .env.example .env.local
```

```env
VITE_AI_ENDPOINT=https://example.com/v1/chat/completions
VITE_AI_API_KEY=
VITE_AI_MODEL=
```

前端环境变量只适合本地或演示使用，生产环境不要把 API key 放在浏览器端。远端请求失败或返回不符合结构的 JSON 时，会自动回退到本地分析，并在结果区标明来源。

## 隐私与数据

应用不要求姓名、学号或登录信息。草稿、最近诊断、主题和匿名热力图只保存在当前浏览器的 localStorage；教师端只显示按学科和误区聚合的数量，不显示个体、不排名。设置中可以清除本机数据，内置演示案例不会被清除。

分享链接只编码预置案例 ID（例如 `#demo=math-ratio`），不会把学生草稿、API key 或诊断结果写入 URL。

## 项目结构

- `src/components`：学生工作台、思维轨迹、教师热力图、设置抽屉
- `src/services`：本地分析、远端适配器、回退策略和 localStorage
- `src/data`：三科演示案例、12 类 misconception taxonomy 和匿名样本
