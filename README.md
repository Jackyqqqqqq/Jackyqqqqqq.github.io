# 秦翊祯的学术主页

一个轻量、双语、可直接维护的个人学术主页，使用 React、TypeScript 和 Vite 构建。线上版本部署在 <https://jackyqqqqqq.github.io/>。

新主页位于 `academic-homepage/`。仓库根目录原有的 3D 页面和建模工具仍然保留，但不再参与 GitHub Pages 构建。

## 本地预览

需要 Node.js 22。首次运行：

```powershell
cd academic-homepage
npm ci
npm run dev
```

浏览器打开 <http://localhost:5173/>。

## 修改主页内容

日常内容统一编辑 [`academic-homepage/src/content.ts`](academic-homepage/src/content.ts)。姓名、身份、简介、研究兴趣、项目、教育经历、技能和中英文界面文字都集中在这个文件里。

- `zh` 是中文内容，`en` 是英文内容。
- 新增项目时复制 `projects` 中的一个对象，并为 `id` 填写唯一值。
- 只有项目存在真实公开地址时才填写 `href`；省略后页面不会显示仓库链接。
- 修改完成后运行下面的发布检查。

线上页面没有浏览器内编辑器、后台、CMS 或数据库。内容修改通过编辑文件并提交到 Git 完成。

## 发布检查

```powershell
cd academic-homepage
npm test
npm run check
npm run build
```

生产文件生成在 `academic-homepage/dist/`。

## GitHub Pages

推送到 `main` 后，[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) 会在 `academic-homepage/` 中安装依赖、运行测试、构建，并将 `academic-homepage/dist/` 发布到 GitHub Pages。

仓库的 Pages 设置应使用 `GitHub Actions` 作为构建来源。

## 隐私与资源

主页只公开杭州、邮箱、GitHub、教育经历、研究方向和项目经历。生日、手机号、成绩、GPA、语言考试分数和原始简历 PDF 不得加入内容文件或生产目录。

正式照片位于 `academic-homepage/public/profile.jpg`。旧 GLB 模型和 `tools/TripoSR` 不参与新主页构建，也不应随日常主页修改一同暂存。
