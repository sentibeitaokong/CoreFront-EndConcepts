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

## 本地发布时的 OTP

如果本地执行 `pnpm xb:release` 时出现 `ERR_PNPM_OTP_NON_INTERACTIVE`，说明 npm 账号开启了发布 2FA，但当前命令没有拿到一次性验证码。

可以用下面任一方式发布：

```sh
PNPM_CONFIG_OTP=<your-otp> pnpm xb:release
```

或：

```sh
pnpm --filter xb-element release -- --otp=<your-otp>
```

CI 发布不能依赖手动 OTP。GitHub Actions 里的 `NPM_TOKEN` 应使用 npm Automation token，或者在 npm 包设置中配置 Trusted Publishing。
