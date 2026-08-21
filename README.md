# 秦翊祯的可交互 3D 个人主页

基于 React、TypeScript、Three.js 和 React Three Fiber 构建。GLB 人物模型贯穿首页、关于、教育、项目和联系章节，随滚动进度连续移动构图与角度，不在章节切换时跳变。支持中英双语切换。

## 快速开始

```powershell
npm.cmd install
npm.cmd run dev
```

本地地址为 <http://localhost:5173/>。

提交或发布前运行：

```powershell
npm.cmd run check
npm.cmd run check:motion
npm.cmd run build
```

`check:motion` 用 Node 自带的测试运行器验证人像过渡（不引入测试框架），需要 Node 22.6 以上。

## 项目结构

```text
个人主页/
├─ public/                         # 不经编译、直接发布的静态资源
│  ├─ models/
│  │  └─ profile-character.glb     # 当前页面使用的 3D 人物模型
│  └─ images/                      # 头像、站点图标和备用图片
├─ src/                            # 网站源代码
│  ├─ components/
│  │  ├─ PortraitScene.tsx         # GLB 加载、光照、旋转和章节位置
│  │  ├─ Customizer.tsx            # 右下角主题与动效设置
│  │  └─ ContentEditor.tsx         # DEV 模式内联编辑器（生产构建已 tree-shake）
│  ├─ App.tsx                      # 页面章节、导航和内容组件
│  ├─ content.json                 # 日常修改个人信息和项目内容的主要入口
│  ├─ config.ts                    # 配置类型定义与界面文案常量
│  ├─ motion.ts                    # 人像章节路径与过渡数学（纯函数）
│  ├─ styles.css                   # 全站视觉样式和响应式布局
│  ├─ hooks.ts                     # 响应式查询、滚动章节坐标等通用 Hook
│  └─ main.tsx                     # React 入口
├─ .github/workflows/
│  └─ deploy-pages.yml             # GitHub Pages 自动部署
├─ scripts/
│  ├─ check-motion.ts              # 人像过渡的最小验证（npm run check:motion）
│  └─ generate-model.ps1           # 旧的本地 3D 模型生成辅助脚本
├─ tools/                          # TripoSR 及其他 3D 实验工具，不参与网页运行
├─ output/                         # 3D 实验输出，已被 Git 忽略
├─ tmp/                            # 临时文件，已被 Git 忽略
├─ dist/                           # npm run build 生成的生产文件
├─ index.html                      # HTML 入口、描述和站点图标
├─ package.json                    # 依赖与 npm 命令
├─ vite.config.ts                  # Vite 和相对部署路径配置
├─ vite-plugin-content.ts          # 只在 dev server 生效，接收编辑器的保存请求
└─ tsconfig.json                   # TypeScript 配置
```

`.agents/`、`.claude/` 和 `.playwright-cli/` 是本地开发工具目录，不属于网页运行代码。根目录的 `source-avatar.png`、`下载.png` 和 UUID 命名图片是早期建模或头像素材；当前网站人物只读取 `public/models/profile-character.glb`。

## 最常用的修改入口

有两种改文字的方式，改的都是同一个文件 [`src/content.json`](src/content.json)，通常不需要改 React 代码。

### 方式一：在页面上直接点着改（推荐）

```powershell
npm.cmd run dev
```

页面左下角有一个铅笔按钮，点亮后屏幕出现一圈高亮边框，表示进入编辑模式。此时把鼠标移到任何一段文字上点一下就能直接改：

- `Enter` 保存，文件立刻写回 `src/content.json`，页面热更新。
- `Esc` 放弃，文字回到原样，不写文件。
- 点到页面别处也会保存，行为和 `Enter` 一样。

保存成功和失败都会在屏幕底部提示。改的是当前显示的那种语言，切到另一种语言再改一遍即可。

这个编辑器只在 `npm run dev` 下存在，`npm run build` 会把它整段移除，线上页面不含任何编辑代码，也没有写文件的接口。

### 方式二：直接编辑 JSON

文字重复出现（比如「Python」同时是技能又是项目标签）时编辑器无法判断你要改哪一处，会提示直接改 JSON。批量修改、增删数组项、调整字段顺序也更适合直接编辑文件。

所有文字按语言分成两份，放在 `copy.zh` 和 `copy.en` 下；与语言无关的字段（邮箱、模型、配色）仍在顶层。下表中带 `copy.<语言>.` 前缀的字段需要中英各改一次。

| 需要修改的内容 | 配置字段或文件 |
| --- | --- |
| 姓名、身份 | `copy.<语言>.name`、`copy.<语言>.role` |
| 首屏标题与介绍 | `copy.<语言>.headline`、`copy.<语言>.intro` |
| 关于我与技能 | `copy.<语言>.about`、`copy.<语言>.stats`、`copy.<语言>.skills` |
| 教育经历 | `copy.<语言>.education` |
| 项目案例 | `copy.<语言>.projects` |
| 项目流程图节点 | `copy.<语言>.projects[].flow` |
| 章节标题与联系文案 | `copy.<语言>.sections`、`copy.<语言>.contact` |
| 缩写、邮箱和公开链接 | `monogram`、`email`、`socials` |
| 3D 人物模型 | `model` |
| 默认颜色 | `theme` |

界面自身的文字（导航、设置面板等）不在 JSON 里，写在 `src/config.ts` 的 `ui` 常量中。

首次访问按浏览器语言自动选择，之后跟随用户在设置面板里的选择。

右下角设置按钮只负责浏览器内即时预览语言、深浅模式、主题色和动效，选择保存在浏览器本地，不会修改 JSON 文件。其中「恢复默认」会重置外观，但保留已选语言。

### 新增项目

在 `copy.zh.projects` 和 `copy.en.projects` 里各复制一个对象，再修改标题、简介、标签、流程和链接。两个数组的长度和顺序必须一致，页面按序号取对应语言的内容：

```json
{
  "title": "项目名称",
  "category": "技术方向 / 负责角色",
  "year": "2026.01 - 2026.06",
  "description": "项目简介",
  "tags": ["React", "Three.js"],
  "flow": ["数据准备", "模型训练", "实验验证", "结果分析"],
  "href": "https://github.com/Jackyqqqqqq"
}
```

页面会根据数组长度自动生成项目板块和流程节点。

### 修改配置结构

如果只是改文字或增删现有数组项，只编辑 `src/content.json` 即可（记得中英两边同步）。

如果要增加新的字段，需要同步修改三处：

1. `src/content.json` 中的实际值（中英各一份）。
2. `src/config.ts` 中的 `SiteConfig`（语言无关字段）或 `LocaleCopy`（需要翻译的字段）类型。
3. `src/App.tsx` 中使用该字段的页面组件。

`content.json` 由 TypeScript 直接导入，字段缺失或类型不符会在 `npm run check` 阶段报错，不需要另写默认值或校验代码。

## 3D 模型维护

当前模型：`public/models/profile-character.glb`，约 30.7 MB，贴图已内嵌。

更换模型时推荐继续使用同一文件名，这样无需修改配置：

1. 删除或归档旧的 `profile-character.glb`。
2. 将新模型放入 `public/models/`。
3. 重命名为 `profile-character.glb`。
4. 启动页面，检查桌面端与手机端的正面朝向、尺寸和光照。

如需保留不同文件名，修改 `src/content.json`：

```json
"model": "models/新的模型.glb"
```

`PortraitScene.tsx` 会根据模型包围盒自动居中和等比缩放。若新模型朝向、人物占比或章节位置仍不理想，在 `src/motion.ts` 的 `desktopPath`、`narrowPath` 和 `compactPath` 中分别调整桌面、窄屏和手机布局 —— 每章只写「站在哪、多大、光环怎么歪」，景深和转身由相邻两章的横向位移自动算出。改完跑一次 `npm.cmd run check:motion`，它会验证整条路径没有跳变。

模型也可以填写 PicList 返回的完整 HTTPS 地址，但图床必须支持跨域请求。长期使用时，本地模型随 GitHub Pages 发布最稳定。当前模型体积较大，后续可以使用 Blender 或 glTF-Transform 压缩网格和贴图。

## 页面代码分工

- `src/App.tsx`：章节结构、导航、项目卡片和联系方式。
- `src/components/PortraitScene.tsx`：Three.js 场景、模型、光源和交互动画。
- `src/components/Customizer.tsx`：右下角自定义面板（含语言切换）。
- `src/components/ContentEditor.tsx`：DEV 模式内联编辑器；生产构建不含此代码。
- `src/motion.ts`：人像在各章节的姿态表和过渡插值，纯函数、可单独验证。
- `src/hooks.ts`：滚动到连续章节坐标的换算、媒体查询和入场动画。
- `src/styles.css`：字号、间距、颜色、移动端布局和章节视觉效果。中文用思源宋体（Noto Serif SC），英文用 EB Garamond；两者写在同一条 `font-family` 里，靠字体回退各自匹配，中英混排不需要切换样式。
- `src/config.ts`：配置类型定义（`SiteConfig`、`LocaleCopy`）与界面文案常量（`ui`）。
- `src/content.json`：所有内容数据，TypeScript 直接导入，HMR 自动热更新。
- `vite-plugin-content.ts`：开发服务器插件，提供 `POST /__content` 接口供内联编辑器写回文件；生产构建不参与打包。

调整视觉布局后，至少检查 `1280 x 720` 桌面视口和约 `390 x 844` 手机视口，避免人物、标题、导航和按钮互相遮挡。

## 生成物与旧工具

以下内容不参与线上页面运行：

- `tools/TripoSR/`：本地图片转 3D 实验环境和源码。
- `scripts/generate-model.ps1`：旧的 TripoSR 模型生成入口。
- `output/`：模型生成结果。
- `tmp/`：PDF、模型处理和测试临时文件。
- `dist/`：生产构建结果，可随时通过 `npm.cmd run build` 重建。
- `node_modules/`：依赖目录，可通过 `npm.cmd install` 重建。
- `*.log`、`*.tsbuildinfo`：本地日志和 TypeScript 缓存。

这些路径已在 `.gitignore` 中忽略。除非正在维护建模流程，否则后续网页迭代主要关注 `public/`、`src/`、`.github/` 和根目录配置文件。

## GitHub Pages 发布

建议在 GitHub 用户 `Jackyqqqqqq` 下使用公开仓库：

- 仓库名为 `Jackyqqqqqq.github.io`：地址为 `https://Jackyqqqqqq.github.io/`。
- 使用其他仓库名：地址通常为 `https://Jackyqqqqqq.github.io/仓库名/`。

发布步骤：

1. 将当前目录推送到仓库的 `main` 分支。
2. 打开仓库 `Settings > Pages`。
3. 在 `Build and deployment` 中选择 `GitHub Actions`。
4. 推送后由 `.github/workflows/deploy-pages.yml` 自动检查、构建和发布。

`vite.config.ts` 已使用相对资源基址，用户主页仓库和普通项目仓库均可部署。

## 每次迭代检查清单

1. 更新 `src/content.json`，确认 JSON 格式正确，且 `copy.zh` 与 `copy.en` 内容同步。
2. 如修改了配置字段结构，同步更新 `src/config.ts` 中的类型定义。
3. 检查 3D 模型在桌面端和手机端是否完整、清晰且不遮挡正文。
4. 检查首页、关于、教育、项目和联系五个章节，中英两种语言各看一遍。
5. 运行 `npm.cmd run check`。
6. 如改动了 `src/motion.ts`，运行 `npm.cmd run check:motion`。
7. 运行 `npm.cmd run build`。
8. 确认没有把 `tmp/`、`output/`、日志、简历或私密信息提交到 Git。

## 隐私说明

页面只使用姓名、公开邮箱、武汉大学本科经历、毕业论文、研究项目和技术方向。生日、手机号、报考信息、考试成绩、GPA、排名与 CET 成绩未写入站点。
