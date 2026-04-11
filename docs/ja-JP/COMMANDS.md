# SDD コマンドリファレンス

> コマンド構文、フラグ、オプション、使用例の完全なリファレンスです。機能の詳細については[機能リファレンス](FEATURES.md)を、ワークフローのチュートリアルについては[ユーザーガイド](USER-GUIDE.md)をご覧ください。

---

## コマンド構文

- **Claude Code / Gemini / Copilot:** `/sdd-command-name [args]`
- **OpenCode / Kilo:** `/sdd-command-name [args]`
- **Codex:** `$sdd-command-name [args]`

---

## コアワークフローコマンド

### `/sdd-new-project`

詳細なコンテキスト収集を行い、新しいプロジェクトを初期化します。

| フラグ | 説明 |
|------|-------------|
| `--auto @file.md` | ドキュメントから自動抽出し、対話的な質問をスキップ |

**前提条件:** 既存の `.planning/PROJECT.md` がないこと
**生成物:** `PROJECT.md`、`REQUIREMENTS.md`、`ROADMAP.md`、`STATE.md`、`config.json`、`research/`、`CLAUDE.md`

```bash
/sdd-new-project                    # 対話モード
/sdd-new-project --auto @prd.md     # PRDから自動抽出
```

---

### `/sdd-new-workspace`

リポジトリのコピーと独立した `.planning/` ディレクトリを持つ分離されたワークスペースを作成します。

| フラグ | 説明 |
|------|-------------|
| `--name <name>` | ワークスペース名（必須） |
| `--repos repo1,repo2` | カンマ区切りのリポジトリパスまたは名前 |
| `--path /target` | 対象ディレクトリ（デフォルト: `~/sdd-workspaces/<name>`） |
| `--strategy worktree\|clone` | コピー戦略（デフォルト: `worktree`） |
| `--branch <name>` | チェックアウトするブランチ（デフォルト: `workspace/<name>`） |
| `--auto` | 対話的な質問をスキップ |

**ユースケース:**
- マルチリポ: リポジトリのサブセットを分離されたGSD状態で作業
- 機能の分離: `--repos .` で現在のリポジトリのworktreeを作成

**生成物:** `WORKSPACE.md`、`.planning/`、リポジトリコピー（worktreeまたはclone）

```bash
/sdd-new-workspace --name feature-b --repos hr-ui,ZeymoAPI
/sdd-new-workspace --name feature-b --repos . --strategy worktree  # 同一リポジトリの分離
/sdd-new-workspace --name spike --repos api,web --strategy clone   # フルクローン
```

---

### `/sdd-list-workspaces`

アクティブなGSDワークスペースとそのステータスを一覧表示します。

**スキャン対象:** `~/sdd-workspaces/` 内の `WORKSPACE.md` マニフェスト
**表示内容:** 名前、リポジトリ数、戦略、GSDプロジェクトのステータス

```bash
/sdd-list-workspaces
```

---

### `/sdd-remove-workspace`

ワークスペースを削除し、git worktreeをクリーンアップします。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `<name>` | はい | 削除するワークスペース名 |

**安全性:** コミットされていない変更があるリポジトリの削除を拒否します。名前の確認が必要です。

```bash
/sdd-remove-workspace feature-b
```

---

### `/sdd-discuss-phase`

計画の前に実装に関する意思決定を記録します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは現在のフェーズ） |

| フラグ | 説明 |
|------|-------------|
| `--auto` | すべての質問で推奨デフォルトを自動選択 |
| `--batch` | 質問を一つずつではなくバッチ取り込みでグループ化 |
| `--analyze` | ディスカッション中にトレードオフ分析を追加 |
| `--chain` | discuss → plan → execute を1つのフローで自動チェーン (v1.31) |
| `--power` | 準備済み回答ファイルから一括入力で質問に回答 (v1.32) |

**前提条件:** `.planning/ROADMAP.md` が存在すること
**生成物:** `{phase}-CONTEXT.md`、`{phase}-DISCUSSION-LOG.md`（監査証跡）

```bash
/sdd-discuss-phase 1                # フェーズ1の対話的ディスカッション
/sdd-discuss-phase 3 --auto         # フェーズ3でデフォルトを自動選択
/sdd-discuss-phase --batch          # 現在のフェーズのバッチモード
/sdd-discuss-phase 2 --analyze      # トレードオフ分析付きディスカッション
```

---

### `/sdd-ui-phase`

フロントエンドフェーズのUIデザイン契約書を生成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは現在のフェーズ） |

**前提条件:** `.planning/ROADMAP.md` が存在し、フェーズにフロントエンド/UI作業があること
**生成物:** `{phase}-UI-SPEC.md`

```bash
/sdd-ui-phase 2                     # フェーズ2のデザイン契約書
```

---

### `/sdd-plan-phase`

フェーズの調査、計画、検証を行います。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは次の未計画フェーズ） |

| フラグ | 説明 |
|------|-------------|
| `--auto` | 対話的な確認をスキップ |
| `--research` | RESEARCH.mdが存在しても強制的に再調査 |
| `--skip-research` | ドメイン調査ステップをスキップ |
| `--gaps` | ギャップ解消モード（VERIFICATION.mdを読み込み、調査をスキップ） |
| `--skip-verify` | プランチェッカーの検証ループをスキップ |
| `--prd <file>` | discuss-phaseの代わりにPRDファイルをコンテキストとして使用 |
| `--reviews` | REVIEWS.mdのクロスAIレビューフィードバックで再計画 |

**前提条件:** `.planning/ROADMAP.md` が存在すること
**生成物:** `{phase}-RESEARCH.md`、`{phase}-{N}-PLAN.md`、`{phase}-VALIDATION.md`

```bash
/sdd-plan-phase 1                   # フェーズ1の調査＋計画＋検証
/sdd-plan-phase 3 --skip-research   # 調査なしで計画（馴染みのあるドメイン）
/sdd-plan-phase --auto              # 非対話型の計画
```

---

### `/sdd-execute-phase`

フェーズ内のすべてのプランをウェーブベースの並列化で実行するか、特定のウェーブを実行します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | **はい** | 実行するフェーズ番号 |
| `--wave N` | いいえ | フェーズ内のウェーブ `N` のみを実行 |

**前提条件:** フェーズにPLAN.mdファイルがあること
**生成物:** プランごとの `{phase}-{N}-SUMMARY.md`、gitコミット、フェーズ完了時に `{phase}-VERIFICATION.md`

```bash
/sdd-execute-phase 1                # フェーズ1を実行
/sdd-execute-phase 1 --wave 2       # ウェーブ2のみを実行
```

---

### `/sdd-verify-work`

自動診断付きのユーザー受入テスト。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは最後に実行されたフェーズ） |

**前提条件:** フェーズが実行済みであること
**生成物:** `{phase}-UAT.md`、問題が見つかった場合は修正プラン

```bash
/sdd-verify-work 1                  # フェーズ1のUAT
```

---

### `/sdd-next`

次の論理的なワークフローステップに自動的に進みます。プロジェクトの状態を読み取り、適切なコマンドを実行します。

**前提条件:** `.planning/` ディレクトリが存在すること
**動作:**
- プロジェクトなし → `/sdd-new-project` を提案
- フェーズにディスカッションが必要 → `/sdd-discuss-phase` を実行
- フェーズに計画が必要 → `/sdd-plan-phase` を実行
- フェーズに実行が必要 → `/sdd-execute-phase` を実行
- フェーズに検証が必要 → `/sdd-verify-work` を実行
- 全フェーズ完了 → `/sdd-complete-milestone` を提案

```bash
/sdd-next                           # 次のステップを自動検出して実行
```

---

### `/sdd-session-report`

作業サマリー、成果、推定リソース使用量を含むセッションレポートを生成します。

**前提条件:** 直近の作業があるアクティブなプロジェクト
**生成物:** `.planning/reports/SESSION_REPORT.md`

```bash
/sdd-session-report                 # セッション後のサマリーを生成
```

**レポートに含まれる内容:**
- 実施した作業（コミット、実行したプラン、進行したフェーズ）
- 成果と成果物
- ブロッカーと意思決定
- 推定トークン/コスト使用量
- 次のステップの推奨事項

---

### `/sdd-ship`

完了したフェーズの作業から自動生成された本文でPRを作成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号またはマイルストーンバージョン（例: `4` または `v1.0`） |
| `--draft` | いいえ | ドラフトPRとして作成 |

**前提条件:** フェーズが検証済み（`/sdd-verify-work` が合格）、`gh` CLIがインストールされ認証済みであること
**生成物:** 計画アーティファクトからリッチな本文を持つGitHub PR、STATE.mdの更新

```bash
/sdd-ship 4                         # フェーズ4をシップ
/sdd-ship 4 --draft                 # ドラフトPRとしてシップ
```

**PR本文に含まれる内容:**
- ROADMAP.mdからのフェーズ目標
- SUMMARY.mdファイルからの変更サマリー
- 対応した要件（REQ-ID）
- 検証ステータス
- 主要な意思決定

---

### `/sdd-ui-review`

実装済みフロントエンドの事後的な6軸ビジュアル監査。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号（デフォルトは最後に実行されたフェーズ） |

**前提条件:** プロジェクトにフロントエンドコードがあること（単体で動作、GSDプロジェクト不要）
**生成物:** `{phase}-UI-REVIEW.md`、`.planning/ui-reviews/` 内のスクリーンショット

```bash
/sdd-ui-review                      # 現在のフェーズを監査
/sdd-ui-review 3                    # フェーズ3を監査
```

---

### `/sdd-audit-uat`

全フェーズを横断した未処理のUATおよび検証項目の監査。

**前提条件:** 少なくとも1つのフェーズがUATまたは検証付きで実行されていること
**生成物:** カテゴリ分類された監査レポートと人間用テストプラン

```bash
/sdd-audit-uat
```

---

### `/sdd-audit-milestone`

マイルストーンが完了定義を満たしたかを検証します。

**前提条件:** 全フェーズが実行済みであること
**生成物:** ギャップ分析付き監査レポート

```bash
/sdd-audit-milestone
```

---

### `/sdd-complete-milestone`

マイルストーンをアーカイブし、リリースをタグ付けします。

**前提条件:** マイルストーン監査が完了していること（推奨）
**生成物:** `MILESTONES.md` エントリ、gitタグ

```bash
/sdd-complete-milestone
```

---

### `/sdd-milestone-summary`

チームのオンボーディングやレビューのために、マイルストーンのアーティファクトから包括的なプロジェクトサマリーを生成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `version` | いいえ | マイルストーンバージョン（デフォルトは現在/最新のマイルストーン） |

**前提条件:** 少なくとも1つの完了済みまたは進行中のマイルストーンがあること
**生成物:** `.planning/reports/MILESTONE_SUMMARY-v{version}.md`

**サマリーに含まれる内容:**
- 概要、アーキテクチャの意思決定、フェーズごとの詳細分析
- 主要な意思決定とトレードオフ
- 要件カバレッジ
- 技術的負債と先送り項目
- 新しいチームメンバー向けのスタートガイド
- 生成後に対話的なQ&Aを提供

```bash
/sdd-milestone-summary                # 現在のマイルストーンをサマリー
/sdd-milestone-summary v1.0           # 特定のマイルストーンをサマリー
```

---

### `/sdd-new-milestone`

次のバージョンサイクルを開始します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `name` | いいえ | マイルストーン名 |
| `--reset-phase-numbers` | いいえ | 新しいマイルストーンをフェーズ1から開始し、ロードマップ作成前に古いフェーズディレクトリをアーカイブ |

**前提条件:** 前のマイルストーンが完了していること
**生成物:** 更新された `PROJECT.md`、新しい `REQUIREMENTS.md`、新しい `ROADMAP.md`

```bash
/sdd-new-milestone                  # 対話モード
/sdd-new-milestone "v2.0 Mobile"    # 名前付きマイルストーン
/sdd-new-milestone --reset-phase-numbers "v2.0 Mobile"  # マイルストーン番号を1からリスタート
```

---

## フェーズ管理コマンド

### `/sdd-add-phase`

ロードマップに新しいフェーズを追加します。

```bash
/sdd-add-phase                      # 対話型 — フェーズの説明を入力
```

### `/sdd-insert-phase`

小数番号を使用して、フェーズ間に緊急の作業を挿入します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | このフェーズ番号の後に挿入 |

```bash
/sdd-insert-phase 3                 # フェーズ3と4の間に挿入 → 3.1を作成
```

### `/sdd-remove-phase`

将来のフェーズを削除し、後続のフェーズの番号を振り直します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | 削除するフェーズ番号 |

```bash
/sdd-remove-phase 7                 # フェーズ7を削除、8→7、9→8等に番号振り直し
```

### `/sdd-list-phase-assumptions`

計画前にClaudeの意図するアプローチをプレビューします。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/sdd-list-phase-assumptions 2       # フェーズ2の前提を確認
```

### `/sdd-plan-milestone-gaps`

マイルストーン監査のギャップを解消するフェーズを作成します。

```bash
/sdd-plan-milestone-gaps             # 各監査ギャップに対してフェーズを作成
```

### `/sdd-research-phase`

詳細なエコシステム調査のみを実行します（単体機能 — 通常は `/sdd-plan-phase` を使用してください）。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/sdd-research-phase 4               # フェーズ4のドメインを調査
```

### `/sdd-validate-phase`

遡及的にNyquistバリデーションのギャップを監査・補填します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/sdd-validate-phase 2               # フェーズ2のテストカバレッジを監査
```

---

## ナビゲーションコマンド

### `/sdd-progress`

ステータスと次のステップを表示します。

```bash
/sdd-progress                       # "今どこにいる？次は何？"
```

### `/sdd-resume-work`

前回のセッションから完全なコンテキストを復元します。

```bash
/sdd-resume-work                    # コンテキストリセットまたは新しいセッション後に使用
```

### `/sdd-pause-work`

フェーズの途中で中断する際にコンテキストのハンドオフを保存します。

```bash
/sdd-pause-work                     # continue-here.mdを作成
```

### `/sdd-manager`

1つのターミナルから複数のフェーズを管理する対話的なコマンドセンター。

**前提条件:** `.planning/ROADMAP.md` が存在すること
**動作:**
- 全フェーズのビジュアルステータスインジケータ付きダッシュボード
- 依存関係と進捗に基づいた最適な次のアクションを推奨
- 作業のディスパッチ: discussはインラインで実行、plan/executeはバックグラウンドエージェントとして実行
- 1つのターミナルから複数フェーズの作業を並列化するパワーユーザー向け

```bash
/sdd-manager                        # コ��ンドセンターダッシュボードを開く
```

---

### `/sdd-analyze-dependencies`

フェーズ依存関係を検出し、ROADMAP.md に `Depends on` エントリを提案します。(v1.32)

**前提���件:** `.planning/ROADMAP.md` が存在すること
**検出方法:** ファイルオーバーラップ、セマンティック依存関係（API/スキーマのプロデューサーとコンシューマー）、データフロー依存関係
**動作:** 依存関係提案テーブルを表示し、ユーザー確認後に ROADMAP.md の `Depends on` フィールドを更新します。

```bash
/sdd-analyze-dependencies            # 依存関係の分析と提案
```

---

### `/sdd-help`

すべてのコマンドと使用ガイドを表示します。

```bash
/sdd-help                           # クイックリファレンス
```

---

## ユーティリティコマンド

### `/sdd-quick`

GSDの保証付きでアドホックタスクを実行します。

| フラグ | 説明 |
|------|-------------|
| `--full` | プランチェック（2回のイテレーション）＋実行後検証を有効化 |
| `--discuss` | 軽量な事前計画ディスカッション |
| `--research` | 計画前にフォーカスされたリサーチャーを起動 |

フラグは組み合わせ可能です。

```bash
/sdd-quick                          # 基本的なクイックタスク
/sdd-quick --discuss --research     # ディスカッション＋調査＋計画
/sdd-quick --full                   # プランチェックと検証付き
/sdd-quick --discuss --research --full  # すべてのオプションステージ
```

### `/sdd-autonomous`

残りのすべてのフェーズを自律的に実行します。

| フラグ | 説明 |
|------|-------------|
| `--from N` | 特定のフェーズ番号から開始 |
| `--to N` | フェーズ N 完了後に自律実行を停止 (v1.32) |
| `--only N` | 指定された単一フェーズのみを自律的に実行 (v1.31) |
| `--interactive` | 各フェーズのディスカスステップでユーザー確認を要求 |

```bash
/sdd-autonomous                     # 残りの全フェーズを実行
/sdd-autonomous --from 3            # フェーズ3から開始
/sdd-autonomous --to 5              # フェーズ5まで実行
/sdd-autonomous --from 3 --to 5     # フェーズ3〜5の範囲を実行
/sdd-autonomous --only 4            # フェーズ4のみを自律実行
```

### `/sdd-do`

フリーテキストを適切なGSDコマンドにルーティングします。

```bash
/sdd-do                             # その後、やりたいことを説明
```

### `/sdd-note`

手軽にアイデアをキャプチャ — メモの追加、一覧表示、またはTodoへの昇格。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `text` | いいえ | キャプチャするメモテキスト（デフォルト: 追加モード） |
| `list` | いいえ | プロジェクトおよびグローバルスコープからすべてのメモを一覧表示 |
| `promote N` | いいえ | メモNを構造化されたTodoに変換 |

| フラグ | 説明 |
|------|-------------|
| `--global` | メモ操作にグローバルスコープを使用 |

```bash
/sdd-note "Consider caching strategy for API responses"
/sdd-note list
/sdd-note promote 3
```

### `/sdd-debug`

永続的な状態を持つ体系的なデバッグ。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | いいえ | バグの説明 |

| フラグ | 説明 |
|------|-------------|
| `--diagnose` | 修正を試みず調査のみを行う診断専用モード (v1.32) |

```bash
/sdd-debug "Login button not responding on mobile Safari"
/sdd-debug --diagnose "API returning 500 on /users endpoint"
```

### `/sdd-add-todo`

後で取り組むアイデアやタスクをキャプチャします。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | いいえ | Todoの説明 |

```bash
/sdd-add-todo "Consider adding dark mode support"
```

### `/sdd-check-todos`

保留中のTodoを一覧表示し、取り組むものを選択します。

```bash
/sdd-check-todos
```

### `/sdd-add-tests`

完了したフェーズのテストを生成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `N` | いいえ | フェーズ番号 |

```bash
/sdd-add-tests 2                    # フェーズ2のテストを生成
```

### `/sdd-stats`

プロジェクトの統計情報を表示します。

```bash
/sdd-stats                          # プロジェクトメトリクスダッシュボード
```

### `/sdd-profile-user`

Claude Codeのセッション分析から8つの次元（コミュニケーションスタイル、意思決定パターン、デバッグアプローチ、UXプリファレンス、ベンダー選択、フラストレーションのトリガー、学習スタイル、説明の深さ）にわたる開発者行動プロファイルを生成します。Claudeのレスポンスをパーソナライズするアーティファクトを生成します。

| フラグ | 説明 |
|------|-------------|
| `--questionnaire` | セッション分析の代わりに対話型アンケートを使用 |
| `--refresh` | セッションを再分析してプロファイルを再生成 |

**生成されるアーティファクト:**
- `USER-PROFILE.md` — 完全な行動プロファイル
- `/sdd-dev-preferences` コマンド — 任意のセッションでプリファレンスをロード
- `CLAUDE.md` プロファイルセクション — Claude Codeが自動検出

```bash
/sdd-profile-user                   # セッションを分析してプロファイルを構築
/sdd-profile-user --questionnaire   # 対話型アンケートのフォールバック
/sdd-profile-user --refresh         # 新鮮な分析からの再生成
```

### `/sdd-health`

`.planning/` ディレクトリの整合性を検証します。

| フラグ | 説明 |
|------|-------------|
| `--repair` | 回復可能な問題を自動修復 |

```bash
/sdd-health                         # 整合性チェック
/sdd-health --repair                # チェックして修復
```

### `/sdd-cleanup`

完了したマイルストーンの蓄積されたフェーズディレクトリをアーカイブします。

```bash
/sdd-cleanup
```

---

## 診断コマンド

### `/sdd-forensics`

失敗またはスタックしたGSDワークフローの事後調査。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | いいえ | 問題の説明（省略時はプロンプトで入力） |

**前提条件:** `.planning/` ディレクトリが存在すること
**生成物:** `.planning/forensics/report-{timestamp}.md`

**調査の対象:**
- Git履歴分析（直近のコミット、スタックパターン、時間的ギャップ）
- アーティファクトの整合性（完了フェーズで期待されるファイル）
- STATE.mdの異常とセッション履歴
- コミットされていない作業、コンフリクト、放棄された変更
- 少なくとも4種類の異常をチェック（スタックループ、欠損アーティファクト、放棄された作業、クラッシュ/中断）
- アクション可能な所見がある場合、GitHubイシューの作成を提案

```bash
/sdd-forensics                              # 対話型 — 問題の入力を促す
/sdd-forensics "Phase 3 execution stalled"  # 問題の説明付き
```

---

## ワークストリーム管理

### `/sdd-workstreams`

マイルストーンの異なる領域で並行作業するためのワークストリームを管理します。

**サブコマンド:**

| サブコマンド | 説明 |
|------------|-------------|
| `list` | すべてのワークストリームをステータス付きで一覧表示（サブコマンド未指定時のデフォルト） |
| `create <name>` | 新しいワークストリームを作成 |
| `status <name>` | 1つのワークストリームの詳細ステータス |
| `switch <name>` | アクティブなワークストリームを設定 |
| `progress` | 全ワークストリームの進捗サマリー |
| `complete <name>` | 完了したワークストリームをアーカイブ |
| `resume <name>` | ワークストリームでの作業を再開 |

**前提条件:** アクティブなGSDプロジェクト
**生成物:** `.planning/` 配下のワークストリームディレクトリ、ワークストリームごとの状態追跡

```bash
/sdd-workstreams                    # すべてのワークストリームを一覧表示
/sdd-workstreams create backend-api # 新しいワークストリームを作成
/sdd-workstreams switch backend-api # アクティブなワークストリームを設定
/sdd-workstreams status backend-api # 詳細ステータス
/sdd-workstreams progress           # ワークストリーム横断の進捗概要
/sdd-workstreams complete backend-api  # 完了したワークストリームをアーカイブ
/sdd-workstreams resume backend-api    # ワークストリームでの作業を再開
```

---

## 設定コマンド

### `/sdd-settings`

ワークフロートグルとモデルプロファイルの対話的な設定。

```bash
/sdd-settings                       # 対話型設定
```

### `/sdd-set-profile`

クイックプロファイル切り替え。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `profile` | **はい** | `quality`、`balanced`、`budget`、または `inherit` |

```bash
/sdd-set-profile budget             # budgetプロファイルに切り替え
/sdd-set-profile quality            # qualityプロファイルに切り替え
```

---

## ブラウンフィールドコマンド

### `/sdd-map-codebase`

並列マッパーエージェントで既存のコードベースを分析します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `area` | いいえ | マッピングを特定の領域にスコープ |

```bash
/sdd-map-codebase                   # コードベース全体を分析
/sdd-map-codebase auth              # auth領域にフォーカス
```

---

## アップデートコマンド

### `/sdd-update`

変更履歴のプレビュー付きでGSDをアップデートします。

```bash
/sdd-update                         # アップデートを確認してインストール
```

### `/sdd-reapply-patches`

GSDアップデート後にローカルの変更を復元します。

```bash
/sdd-reapply-patches                # ローカルの変更をマージバック
```

---

## 高速＆インラインコマンド

### `/sdd-fast`

簡単なタスクをインラインで実行 — サブエージェントなし、計画のオーバーヘッドなし。タイポ修正、設定変更、小さなリファクタリング、忘れたコミットなどに最適。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `task description` | いいえ | 実行する内容（省略時はプロンプトで入力） |

**`/sdd-quick` の代替ではありません** — 調査、複数ステップの計画、または検証が必要な場合は `/sdd-quick` を使用してください。

```bash
/sdd-fast "fix typo in README"
/sdd-fast "add .env to gitignore"
```

---

## コード品質コマンド

### `/sdd-review`

外部AI CLIからのフェーズプランのクロスAIピアレビュー。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `--phase N` | **はい** | レビューするフェーズ番号 |

| フラグ | 説明 |
|------|-------------|
| `--gemini` | Gemini CLIレビューを含める |
| `--claude` | Claude CLIレビューを含める（別セッション） |
| `--codex` | Codex CLIレビューを含める |
| `--coderabbit` | CodeRabbitレビューを含める |
| `--opencode` | OpenCodeレビューを含める（GitHub Copilot経由） |
| `--qwen` | Qwen Codeレビューを含める（Alibaba Qwenモデル） |
| `--cursor` | Cursorエージェントレビューを含める |
| `--all` | 利用可能なすべてのCLIを含める |

**生成物:** `{phase}-REVIEWS.md` — `/sdd-plan-phase --reviews` で利用可能

```bash
/sdd-review --phase 3 --all
/sdd-review --phase 2 --gemini
```

---

### `/sdd-pr-branch`

`.planning/` のコミットをフィルタリングしてクリーンなPRブランチを作成します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `target branch` | いいえ | ベースブランチ（デフォルト: `main`） |

**目的:** レビュアーにはコード変更のみを表示し、GSD計画アーティファクトは含めません。

```bash
/sdd-pr-branch                     # mainに対してフィルタリング
/sdd-pr-branch develop             # developに対してフィルタリング
```

---

### `/sdd-audit-uat`

全フェーズを横断した未処理のUATおよび検証項目の監査。

**前提条件:** 少なくとも1つのフェーズがUATまたは検証付きで実行されていること
**生成物:** カテゴリ分類された監査レポートと人間用テストプラン

```bash
/sdd-audit-uat
```

---

## バックログ＆スレッドコマンド

### `/sdd-add-backlog`

999.x番号付けを使用して、バックログのパーキングロットにアイデアを追加します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `description` | **はい** | バックログ項目の説明 |

**999.x番号付け**により、バックログ項目はアクティブなフェーズシーケンスの外に保持されます。フェーズディレクトリは即座に作成されるため、`/sdd-discuss-phase` や `/sdd-plan-phase` がそれらに対して動作します。

```bash
/sdd-add-backlog "GraphQL API layer"
/sdd-add-backlog "Mobile responsive redesign"
```

---

### `/sdd-review-backlog`

バックログ項目をレビューし、アクティブなマイルストーンに昇格させます。

**項目ごとのアクション:** 昇格（アクティブシーケンスに移動）、保持（バックログに残す）、削除。

```bash
/sdd-review-backlog
```

---

### `/sdd-plant-seed`

トリガー条件付きの将来のアイデアをキャプチャ — 適切なマイルストーンで自動的に表面化します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| `idea summary` | いいえ | シードの説明（省略時はプロンプトで入力） |

シードはコンテキストの劣化を解決します：誰も読まないDeferredの一行メモの代わりに、シードは完全なWHY、いつ表面化すべきか、詳細への手がかりを保存します。

**生成物:** `.planning/seeds/SEED-NNN-slug.md`
**利用先:** `/sdd-new-milestone`（シードをスキャンしてマッチするものを提示）

```bash
/sdd-plant-seed "Add real-time collaboration when WebSocket infra is in place"
```

---

### `/sdd-thread`

クロスセッション作業のための永続的なコンテキストスレッドを管理します。

| 引数 | 必須 | 説明 |
|----------|----------|-------------|
| （なし） | — | すべてのスレッドを一覧表示 |
| `name` | — | 名前で既存のスレッドを再開 |
| `description` | — | 新しいスレッドを作成 |

スレッドは、複数のセッションにまたがるが特定のフェーズに属さない作業のための軽量なクロスセッション知識ストアです。`/sdd-pause-work` よりも軽量です。

```bash
/sdd-thread                         # すべてのスレッドを一覧表示
/sdd-thread fix-deploy-key-auth     # スレッドを再開
/sdd-thread "Investigate TCP timeout in pasta service"  # 新規作成
```

---

## コミュニティコマンド

### `/sdd-join-discord`

Discordコミュニティの招待を開きます。

```bash
/sdd-join-discord
```
