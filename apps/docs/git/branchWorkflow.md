# 分支工作流

Git 的分支模型决定了团队如何协作、代码如何集成、版本如何发布。没有统一的工作流，分支会越开越乱、合并冲突频发。选择适合团队规模与发布节奏的分支模型，是工程化协作的第一步。

**一句话理解**：**「分支工作流 = 一套约定『谁在哪个分支开发、何时合并、如何发布』的协作规则。」**

## 1. 常见分支模型

| 工作流          | 核心思想                                 | 适合场景                 |
| --------------- | ---------------------------------------- | ------------------------ |
| **Git Flow**    | 多分支严格分工（feature/release/hotfix） | 版本化发布、大型团队     |
| **GitHub Flow** | 单一 main + 短命 feature 分支 + PR       | 持续部署、中小团队       |
| **GitLab Flow** | GitHub Flow + 环境分支（staging/prod）   | 需要多环境验证的团队     |
| **Trunk-Based** | 直接在主干小步提交，特性开关隔离         | 高频交付、强工程能力团队 |

## 2. Git Flow：经典的分支分工

Git Flow 用一组**长期分支**和**临时分支**明确职责：

```
main     ──●───────────────●─────●──  正式发布，只合并 release/hotfix
           \             /     /
develop    ●──●──●──●──●──●──●──     开发主线，所有 feature 合并到这里
             \     /      \
feature/xx    ●──●         \         每个功能一个分支，完成后合回 develop
                          hotfix/xx   线上紧急修复，从 main 拉出
```

| 分支        | 来源      | 合并目标         | 生命周期     |
| ----------- | --------- | ---------------- | ------------ |
| `main`      | -         | -                | 长期，只读   |
| `develop`   | `main`    | -                | 长期         |
| `feature/*` | `develop` | `develop`        | 功能完成即删 |
| `release/*` | `develop` | `main`+`develop` | 发布前冻结   |
| `hotfix/*`  | `main`    | `main`+`develop` | 紧急修复即删 |

### 2.1 一次完整发布的命令流

```bash
# 开发新功能
git checkout -b feature/login develop
git commit -m "feat(login): 新增登录"
git checkout develop
git merge feature/login

# 准备发布
git checkout -b release/1.2.0 develop
# 只修 bug、打版本号，不新增功能
git checkout main
git merge release/1.2.0
git tag v1.2.0
git checkout develop
git merge release/1.2.0   # 把发布分支的修复同步回 develop

# 线上紧急修复
git checkout -b hotfix/payment-crash main
git commit -m "fix: 修复支付崩溃"
git checkout main
git merge hotfix/payment-crash
git tag v1.2.1
git checkout develop
git merge hotfix/payment-crash
```

**优点**：职责清晰，适合多版本、周期性发布。

**缺点**：分支多、流程重，对「持续部署」型团队过于繁琐。

## 3. GitHub Flow：极简的持续交付

GitHub Flow 只保留一条主干 `main`，所有改动走**短命 feature 分支 + Pull Request**：

```
main  ──●──────●──────●──────●──  任何分支合并即代表「可发布」
         \    / \    /
feature/a  ●──●  ●──●               功能分支，合入 main 后立即删除
```

**流程：**

1. 从 `main` 拉出 `feature/xxx`。
2. 在分支上开发、提交。
3. 发起 **Pull Request**，CI 自动测试、同事 review。
4. 合并到 `main`，**自动部署**，删除分支。

```bash
git checkout -b feature/xxx main
git commit -am "feat: xxx"
git push -u origin feature/xxx
# 在平台发起 PR → CI 通过 → 审查 → 合并
git checkout main && git pull
git branch -d feature/xxx
```

**优点**：简单、快、天然契合持续部署。

**缺点**：无「发布冻结」概念，不适合需要多版本并行的场景。

## 4. GitLab Flow：加一层环境分支

在 GitHub Flow 基础上，增加 `staging`、`production` 等**环境分支**，让代码按环境逐级流动：

```
main ──●──●──●──●──
             \      \
staging ─────●──────●────  测试/预发环境
                     \
production ──────────●────  生产环境
```

适合「需要先在测试环境验证、再上生产」的团队。改动从 `main` 合并到 `staging` 验证通过后，再合并到 `production`。

## 5. Trunk-Based Development（主干开发）

所有开发者**直接在主干 `main` 上小步、高频提交**，用**特性开关（Feature Flag）**隔离未完成的功能，而非用长命分支隔离。

```
main  ●──●──●──●──●──●──●──  所有人直接提交到主干，每次提交都自动部署
```

**优点**：极致缩短集成周期、减少冲突、CI 反馈最快。

**前提**：需要成熟的自动化测试、代码 review、特性开关能力。Google、Facebook 等大厂普遍采用。

### 5.1 特性开关（Feature Flag）

未完成的功能代码直接合入主干，但通过「开关」控制其**默认关闭**，上线后按需灰度开启：

```javascript
// 特性开关：从配置读取，未开启时走旧逻辑
if (featureFlag.isEnabled('new-checkout')) {
  renderNewCheckout()
} else {
  renderOldCheckout()
}
```

这样代码集成与功能上线**解耦**，避免长分支集成的痛苦。

## 6. 三种合并方式

分支合入主干时，有三种方式，历史形态完全不同：

| 方式             | 命令                              | 历史形态            | 适用场景               |
| ---------------- | --------------------------------- | ------------------- | ---------------------- |
| **Merge commit** | `git merge --no-ff feature`       | 保留分叉 + 合并提交 | 团队协作、保留完整历史 |
| **Squash merge** | `git merge --squash feature`      | 压成一个提交        | 主干历史干净           |
| **Rebase merge** | `git rebase main` 后 fast-forward | 完全线性            | 个人分支整理           |

```bash
# Merge commit：保留分支结构和提交记录
git checkout main
git merge --no-ff feature/login

# Squash merge：把 feature 的所有提交压成一个
git merge --squash feature/login
git commit -m "feat(login): 新增登录"

# Rebase：让 feature 提交「接」在 main 最新点之后
git checkout feature/login
git rebase main
git checkout main
git merge feature/login   # fast-forward，线性历史
```

> **铁律**：`rebase` 会改写提交历史，**绝不要在公共分支上 rebase**，否则他人基于旧提交的工作会乱套。

## 7. 保护分支（Protected Branch）

在 GitHub/GitLab 上可把 `main`、`develop` 设为**保护分支**，强制规则：

- **禁止直接 push**，必须通过 PR。
- **要求 review**（若干人批准才可合并）。
- **要求 CI 通过**（测试失败禁止合并）。
- **禁止 force push**，防止历史被改写。

保护分支是工作流能落地执行的「技术保障」，把约定变成硬约束。

## 8. 分支命名规范

无论哪种工作流，统一命名能显著提升可读性：

| 前缀        | 用途             | 示例                    |
| ----------- | ---------------- | ----------------------- |
| `feature/`  | 新功能           | `feature/login`         |
| `fix/`      | 缺陷修复         | `fix/cart-calc`         |
| `hotfix/`   | 线上紧急修复     | `hotfix/payment-crash`  |
| `chore/`    | 杂项、依赖、配置 | `chore/update-deps`     |
| `refactor/` | 重构             | `refactor/user-service` |

## 9. 选型建议

| 团队情况                   | 推荐工作流  |
| -------------------------- | ----------- |
| 周期性版本发布、多版本并行 | Git Flow    |
| 持续部署、中小团队         | GitHub Flow |
| 需要多环境逐级验证         | GitLab Flow |
| 高频交付、工程能力强       | Trunk-Based |

## 10. 常见问题 (FAQ)

### 10.1 合并用 `merge` 还是 `rebase`？

- `merge`：保留完整历史，产生合并提交，历史呈「网状」，适合团队协作。
- `rebase`：历史线性干净，但会改写提交，**不要在公共分支上 rebase**。
- 常见折中：feature 分支内部用 `rebase` 整理，合入主干用 `merge`（或 squash merge）。

### 10.2 feature 分支为什么要「短命」？

分支存活越久，与主干偏离越大，合并冲突越多、集成风险越高。**小步提交、频繁合并**能持续降低集成成本。

### 10.3 线上出问题怎么紧急修复？

Git Flow 下从 `main` 拉 `hotfix/*` 修复后同时合回 `main` 和 `develop`；GitHub Flow 下直接拉 `fix/*` 走 PR 合并部署。详见 [Git 应用场景](/git/scenarios)。

### 10.4 冲突了怎么办？

1. 拉取主干最新代码：`git merge main` 或 `git rebase main`。
2. Git 标出冲突文件，手动编辑解决冲突标记（`<<<<<<<` / `=======` / `>>>>>>>`）。
3. `git add` 标记已解决，`git commit` 完成合并。
4. 也可 `git merge --abort` 放弃本次合并。

### 10.5 为什么大厂偏爱 Trunk-Based？

因为它把「集成」的频率提到最高（每次提交都集成），冲突最小、CI 反馈最快。代价是需要**特性开关、强测试、强 review** 来兜底，普通团队未必具备这个能力。

## 11. 总结

- Git Flow 重流程、GitHub Flow 重速度、GitLab Flow 重环境、Trunk-Based 重极致集成。
- 核心原则：**分支短命、频繁合并、统一命名、PR + CI 把关、保护分支兜底**。
- 三种合并方式各有取舍：merge 保历史、squash 净历史、rebase 线历史。
- 没有「最好」的工作流，只有「最适合团队」的工作流。
