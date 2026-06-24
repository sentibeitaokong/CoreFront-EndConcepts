# Changesets

`xb-element` 发版前需要先生成 changeset：

```sh
pnpm changeset
```

选择 `xb-element`，再选择版本类型：

- `patch`: bug fix
- `minor`: new feature
- `major`: breaking change

合并到 `main` 后，GitHub Actions 会创建 release PR；合并 release PR 后会构建并发布 `xb-element` 到 npm。
