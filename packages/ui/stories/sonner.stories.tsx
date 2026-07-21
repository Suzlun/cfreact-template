import { toast } from 'sonner';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Toaster } from '@cfreact-template/ui/components/sonner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 自動終了用の JavaScript timer を作らず、操作または Story lifecycle だけで通知を閉じる固定値。
 * Storybook の描画時間やブラウザ実行速度に依存しない状態を保つため、全 Story で共有する。
 */
const INFINITE_TOAST_DURATION = Infinity;

/** Toaster の live region を日本語で識別する、全 Story 共通のアクセシブル名。 */
const TOASTER_CONTAINER_ARIA_LABEL = '通知';

/** close icon button の意味を支援技術へ伝える、製品文脈に依存しない固定ラベル。 */
const CLOSE_BUTTON_ARIA_LABEL = '通知を閉じる';

/** action toast が公開する操作を、可視名とアクセシブル名の双方に使う固定ラベル。 */
const ACTION_LABEL = '確認する';

/** success、error、info、loading、および action の固定 Story を識別する内部キー。 */
type ToastScenarioKind = 'action' | 'error' | 'info' | 'loading' | 'success';

/**
 * 一つの Toast Story を再現可能に描画・検証するための固定入力。
 *
 * 表示文、DOM 識別子、期待する Sonner state を一箇所に集約し、Story、publisher、
 * interaction test の三者が同じ契約を参照する。外部状態や時刻は保持しない。
 */
interface ToastScenario {
  /** 通知タイトルの固定表示。 */
  title: string;
  /** 通知タイトルを補足する固定説明。 */
  description: string;
  /** `data-sonner-toast` の `data-type` に期待する値。通常 action toast では属性を持たない。 */
  expectedDataType: 'error' | 'info' | 'loading' | 'success' | null;
  /** 個別の close icon button を表示するか。 */
  closeButton: boolean;
  /** Docs で複数 Story を同時描画しても配信先が混ざらない、Toaster 固有 ID。 */
  toasterId: string;
  /** 利用者が通知を表示するために操作する Button の固定ラベル。 */
  triggerLabel: string;
  /** 再実行時に履歴を増殖させず同じ通知を更新する、Toast 固有 ID。 */
  toastId: string;
}

/**
 * 製品固有の語彙、日時、乱数を含まない全状態の固定カタログ。
 * 各 Toaster と Toast に別々の ID を割り当て、Docs と並列 browser tests の相互干渉を防ぐ。
 */
const toastScenarios = {
  success: {
    title: '処理が完了しました',
    description: '固定された成功通知の表示を確認できます。',
    expectedDataType: 'success',
    closeButton: false,
    toasterId: 'sonner-success-toaster',
    triggerLabel: '成功通知を表示',
    toastId: 'sonner-success-toast',
  },
  error: {
    title: '処理を完了できませんでした',
    description: '内容を確認して、もう一度お試しください。',
    expectedDataType: 'error',
    closeButton: false,
    toasterId: 'sonner-error-toaster',
    triggerLabel: 'エラー通知を表示',
    toastId: 'sonner-error-toast',
  },
  info: {
    title: '補足情報があります',
    description:
      'この固定通知は、説明が複数行になる場合でも、タイトル、本文、閉じる操作の順序を保ち、利用可能な表示幅に合わせて内容を省略せずに折り返します。',
    expectedDataType: 'info',
    closeButton: true,
    toasterId: 'sonner-info-toaster',
    triggerLabel: '長い情報通知を表示',
    toastId: 'sonner-info-toast',
  },
  loading: {
    title: '処理中です',
    description: '完了するまで固定された loading 状態を表示します。',
    expectedDataType: 'loading',
    closeButton: false,
    toasterId: 'sonner-loading-toaster',
    triggerLabel: '読み込み通知を表示',
    toastId: 'sonner-loading-toast',
  },
  action: {
    title: '確認できる操作があります',
    description: '必要に応じて、通知に関連付けられた固定操作を実行できます。',
    expectedDataType: null,
    closeButton: false,
    toasterId: 'sonner-action-toaster',
    triggerLabel: '操作付き通知を表示',
    toastId: 'sonner-action-toast',
  },
} as const satisfies Record<ToastScenarioKind, ToastScenario>;

/**
 * 固定 union の Scenario キーを、動的 object access を使わず対応する固定入力へ変換する。
 *
 * @param scenarioKind success、error、info、loading、action のいずれかの固定キー。
 * @returns Story、publisher、interaction test が共有する読み取り専用 Scenario。
 * @throws 固定 union 以外は TypeScript が拒否するため、実行時例外は発生しない。
 */
function getToastScenario(scenarioKind: ToastScenarioKind): ToastScenario {
  // action は通常 Toast の action option と固定 spy を使う入力へ対応させる。
  if (scenarioKind === 'action') {
    return toastScenarios.action;
  }

  // error は専用 helper と error data type を使う入力へ対応させる。
  if (scenarioKind === 'error') {
    return toastScenarios.error;
  }

  // info は長文と close button を含む入力へ対応させる。
  if (scenarioKind === 'info') {
    return toastScenarios.info;
  }

  // loading は外部 Promise なしで固定表示する入力へ対応させる。
  if (scenarioKind === 'loading') {
    return toastScenarios.loading;
  }

  // 先行分岐後に残る success を既定値ではなく、絞り込まれた固定入力として返す。
  return toastScenarios.success;
}

/**
 * action toast の操作通知を観測する Storybook spy。
 * 実処理、通信、navigation を接続せず、各 Story の lifecycle で呼び出し履歴を消去する。
 */
const actionClick = fn();

/** Story 内で `Toaster` と表示 Trigger を組み立てるための固定入力。 */
interface ToastCatalogProps {
  /** 表示・配信・検証へ同じ固定条件を渡す Scenario キー。 */
  scenarioKind: ToastScenarioKind;
  /** Storybook globals と Sonner の公開 `theme` prop を同期する固定テーマ。 */
  theme: 'dark' | 'light';
}

/**
 * Storybook globals の theme を、Toaster が公開する light/dark prop へ安全に変換する。
 *
 * @param selectedTheme Storybook theme decorator と browser project が渡す global 値。
 * @returns Sonner の公開 `theme` prop へそのまま渡せる `light` または `dark`。
 * @throws 未定義値や未対応テーマを受け取った場合、Story の描画を明示的に失敗させる。
 */
function getStoryTheme(selectedTheme: unknown): 'dark' | 'light' {
  // Dark project の値は変換せず返し、Sonner の dark foreground/background 設定を有効にする。
  if (selectedTheme === 'dark') {
    return selectedTheme;
  }

  // Light project の値も変換せず返し、二つのテスト対象以外を既定値で黙認しない。
  if (selectedTheme === 'light') {
    return selectedTheme;
  }

  throw new TypeError('Storybook theme は light または dark である必要があります。');
}

/**
 * 指定された固定 Scenario を、インストール済み Sonner API から一つだけ配信する。
 *
 * @param scenarioKind success、error、info、loading、action のいずれかの固定キー。
 * @returns 戻り値はなく、対応する `toasterId` の購読先へ一件の Toast を同期的に公開する。
 * @throws 固定 union 以外は TypeScript が拒否するため、実行時例外は発生しない。
 *
 * @example
 * `publishToast('success')` は成功用 Toaster だけへ固定された成功通知を公開する。
 */
function publishToast(scenarioKind: ToastScenarioKind): void {
  // 全 API に同じ ID、説明、無期限 duration、テスト識別子を渡し、状態間の条件差を種類だけに限定する。
  const scenario = getToastScenario(scenarioKind);
  const toastOptions = {
    closeButton: scenario.closeButton,
    description: scenario.description,
    duration: INFINITE_TOAST_DURATION,
    id: scenario.toastId,
    testId: scenario.toastId,
    toasterId: scenario.toasterId,
  };

  // 各公開 helper を直接呼び、Toaster に組み込まれた success icon と success state を確認可能にする。
  if (scenarioKind === 'success') {
    toast.success(scenario.title, toastOptions);
    return;
  }

  // error 専用 helper を通し、既存 error icon と `data-type="error"` の契約を利用する。
  if (scenarioKind === 'error') {
    toast.error(scenario.title, toastOptions);
    return;
  }

  // info 専用 helper へ長い固定説明と close button 指定を渡し、折り返しと閉鎖操作を同時に扱う。
  if (scenarioKind === 'info') {
    toast.info(scenario.title, toastOptions);
    return;
  }

  // loading 専用 helper と無期限 duration を組み合わせ、Promise や通信なしで安定した loading state を作る。
  if (scenarioKind === 'loading') {
    toast.loading(scenario.title, toastOptions);
    return;
  }

  // 通常 toast の公開 action option に副作用のない spy を渡し、利用側 callback の通知だけを観測する。
  toast(scenario.title, {
    ...toastOptions,
    action: {
      label: ACTION_LABEL,
      onClick: actionClick,
    },
  });
}

/**
 * 一つの固定 Scenario に対応する Button と公開 `Toaster` export を描画する。
 *
 * @param props 描画、配信先、固定表示を選択する Scenario キー。
 * @returns 既存 Button token と Toaster API だけで構成した、操作可能な Story catalog。
 * 副作用は Button click 後のローカル Toast 配信に限定され、通信や永続化を行わない。
 */
function ToastCatalog({ scenarioKind, theme }: ToastCatalogProps) {
  const scenario = getToastScenario(scenarioKind);

  /**
   * Button click を選択済み Scenario の配信へ変換する。
   * React の event は外部へ保持せず、固定データだけを publisher へ渡す。
   */
  function handleTriggerClick(): void {
    publishToast(scenarioKind);
  }

  return (
    <div className="flex min-h-24 items-center justify-center p-4">
      {/* 既存 Button の focus ring、寸法、foreground/background token をそのまま再利用する。 */}
      <Button type="button" onClick={handleTriggerClick}>
        {scenario.triggerLabel}
      </Button>

      {/* ID で Story ごとの配信を分離し、無期限 duration により自動終了 timer を作らない。 */}
      <Toaster
        id={scenario.toasterId}
        containerAriaLabel={TOASTER_CONTAINER_ARIA_LABEL}
        duration={INFINITE_TOAST_DURATION}
        theme={theme}
        toastOptions={{
          closeButtonAriaLabel: CLOSE_BUTTON_ARIA_LABEL,
          duration: INFINITE_TOAST_DURATION,
        }}
      />
    </div>
  );
}

/**
 * Sonner が保持する全 active Toast を ID ごとに閉じ、削除 animation と timer の完了まで待つ。
 *
 * @param ownerDocument Story canvas と Portal を所有する Document。Toast DOM の完全な除去確認に使う。
 * @returns active state と `[data-sonner-toast]` がともに空になった時点で解決する Promise。
 * @throws Sonner が通知を除去できない場合、`waitFor` の timeout により browser test を失敗させる。
 *
 * @example
 * Story の `beforeEach` が返す cleanup から呼び、次の Story へ通知を持ち越さない。
 */
async function dismissAllToasts(ownerDocument: Document): Promise<void> {
  // 引数なし dismiss の履歴依存を避け、現在 active な ID だけを明示的に閉じて global state も即座に無効化する。
  for (const activeToast of toast.getToasts()) {
    toast.dismiss(activeToast.id);
  }

  // Sonner 内部の削除 animation 用 timer が完了し、DOM と active state の双方が空になるまで lifecycle を進めない。
  await waitFor(async () => {
    await expect(toast.getToasts()).toHaveLength(0);
    await expect(ownerDocument.querySelectorAll('[data-sonner-toast]')).toHaveLength(0);
  });
}

/**
 * Storybook の選択テーマと既存 `.dark` class、および Toaster の CSS variable 参照を検証する。
 *
 * @param ownerDocument theme decorator と Toast を所有する Document。
 * @param selectedTheme Storybook globals が渡す `light` または `dark`。
 * @param toaster 実際に Toast を描画した Sonner の list 要素。
 * @returns theme class と既存 token 参照が一致した時点で解決する Promise。
 * @throws 未定義テーマ、class の不一致、token 契約の欠落時に interaction test を失敗させる。
 */
async function expectThemeAndTokens(
  ownerDocument: Document,
  selectedTheme: unknown,
  toaster: HTMLElement
): Promise<void> {
  // 想定外の global 値を light として黙認せず、二つの検証対象テーマ以外は明示的に失敗させる。
  if (selectedTheme !== 'light' && selectedTheme !== 'dark') {
    throw new TypeError('Storybook theme は light または dark である必要があります。');
  }

  // addon の effect 完了を条件待機し、固定時間を置かずに `<html>` の theme class を検証する。
  await waitFor(async () => {
    if (selectedTheme === 'dark') {
      await expect(ownerDocument.documentElement).toHaveClass('dark');
    } else {
      await expect(ownerDocument.documentElement).not.toHaveClass('dark');
    }
  });

  // Toaster component が hardcoded color へ退行せず、globals.css の既存 semantic token を参照し続けることを保証する。
  await expect(toaster).toHaveAttribute('data-sonner-theme', selectedTheme);
  await expect(toaster.style.getPropertyValue('--normal-bg')).toBe('var(--popover)');
  await expect(toaster.style.getPropertyValue('--normal-text')).toBe('var(--popover-foreground)');
  await expect(toaster.style.getPropertyValue('--normal-border')).toBe('var(--border)');
  await expect(toaster.style.getPropertyValue('--border-radius')).toBe('var(--radius)');
}

/**
 * Trigger を利用者と同じ pointer 経路で操作し、Toast の表示、focus、ARIA、theme、state を検証する。
 *
 * @param canvasElement Story の Trigger と ownerDocument を特定する描画範囲。
 * @param selectedTheme Storybook が light/dark 両 project へ設定する theme global。
 * @param scenarioKind 表示と期待値に同じ固定 Scenario を使う内部キー。
 * @returns 可視性と意味構造を確認済みの Toast list item。
 * @throws Toast、live region、list、state、theme、token のいずれかが契約を満たさない場合に失敗する。
 */
async function openAndExpectToast(
  canvasElement: HTMLElement,
  selectedTheme: unknown,
  scenarioKind: ToastScenarioKind
): Promise<HTMLElement> {
  const scenario = getToastScenario(scenarioKind);
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: scenario.triggerLabel });

  // 表示前は対象 Toast が存在しないことを確認し、前 Story の状態漏れを早期に検出する。
  await expect(documentBody.queryByTestId(scenario.toastId)).not.toBeInTheDocument();
  await expect(trigger).toBeEnabled();

  // 実利用と同じ click を送り、非 modal 通知が Trigger から focus を奪わないことを保証する。
  await userEvent.click(trigger);
  await expect(trigger).toHaveFocus();

  // Sonner の非同期 publish と mount effect を固定時間なしで待ち、実際に操作できる表示状態を取得する。
  const toastElement = await documentBody.findByTestId(scenario.toastId);
  await waitFor(async () => {
    await expect(toastElement).toBeVisible();
    await expect(toastElement).toHaveAttribute('data-mounted', 'true');
  });

  // Toaster の section を名前付き live region として取得し、追加通知を穏やかに読み上げる既存 semantics を確認する。
  const liveRegion = documentBody.getByRole('region', {
    name: /^通知 alt\+t$/i,
  });
  await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  await expect(liveRegion).toHaveAttribute('aria-relevant', 'additions text');
  await expect(liveRegion).toHaveAttribute('aria-atomic', 'false');

  // list/listitem の標準 semantics と、タイトル・説明の DOM 順を可視内容から確認する。
  const toaster = within(liveRegion).getByRole('list');
  await expect(toastElement).toHaveRole('listitem');
  await expect(within(toastElement).getByText(scenario.title)).toBeVisible();
  await expect(within(toastElement).getByText(scenario.description)).toBeVisible();

  // 通常 action toast は type 属性を持たず、専用 helper の四状態だけが対応する data type を公開する。
  if (scenario.expectedDataType === null) {
    await expect(toastElement).not.toHaveAttribute('data-type');
  } else {
    await expect(toastElement).toHaveAttribute('data-type', scenario.expectedDataType);
  }

  // 同じ assertion を light/dark の両 browser project で実行し、theme class と semantic token の接続を保証する。
  await expectThemeAndTokens(canvasElement.ownerDocument, selectedTheme, toaster);

  return toastElement;
}

/**
 * close/action 操作後に対象 Toast が DOM と Sonner active state の双方から消えたことを確認する。
 *
 * @param ownerDocument Toast Portal を所有する Document。
 * @param toastId 対象 Story が固定した Toast ID。
 * @returns 削除 animation と内部 timer が完了した時点で解決する Promise。
 * @throws DOM または active state に通知が残る場合、`waitFor` の timeout で失敗する。
 */
async function expectToastRemoved(ownerDocument: Document, toastId: string): Promise<void> {
  // 見た目上の removed state だけで終えず、DOM 除去と active state 解放を同じ条件で待機する。
  await waitFor(async () => {
    await expect(within(ownerDocument.body).queryByTestId(toastId)).not.toBeInTheDocument();
    await expect(toast.getToasts().some((activeToast) => activeToast.id === toastId)).toBe(false);
  });
}

/**
 * 公開 `Toaster` export を CSF 3 の Docs、accessibility、light/dark browser tests へ登録する。
 *
 * 各 Story は direct package subpath から同じ component を利用し、Sonner の既存 API と
 * globals.css の token 以外を追加しない。Story 切替時は Toast と spy を決定的に消去する。
 */
const meta = {
  title: 'Components/Sonner',
  component: Toaster,
  beforeEach: async ({ canvasElement }) => {
    // Story 描画前に前回の active state と削除中 DOM を空にし、実行順による差を排除する。
    await dismissAllToasts(canvasElement.ownerDocument);
    actionClick.mockClear();

    // Story 切替前に削除 animation の完了まで待ち、timer、Toast、spy 履歴を次の test へ残さない。
    return async () => {
      await dismissAllToasts(canvasElement.ownerDocument);
      actionClick.mockClear();
    };
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公開 Toaster とインストール済み Sonner API を使い、success、error、info、loading、action、長文、close/action 操作を、固定データと決定的 cleanup で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Toaster>;

/** Storybook が Sonner catalog の型、Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * success helper と公開 Toaster の組み合わせを表示し、click、focus、ARIA、theme、token を確認する。
 *
 * Story は固定成功通知だけを配信し、通信や自動終了 timer を作らない。
 * interaction test は light/dark の両 project で同じ意味構造と状態を保証する。
 */
export const Success: Story = {
  render: (_args, { globals }) => (
    <ToastCatalog scenarioKind="success" theme={getStoryTheme(globals.theme)} />
  ),
  play: async ({ canvasElement, globals, step }) => {
    await step('成功通知を click で表示し、focus と live region を保つ', async () => {
      // 共通 helper で Trigger、success state、ARIA、light/dark token 接続を一括して検証する。
      await openAndExpectToast(canvasElement, globals.theme, 'success');
    });
  },
};

/**
 * error helper の icon と state を表示し、固定エラー文がアクセシブルな live region に入ることを確認する。
 *
 * 入力は製品非依存の固定文だけで、外部 error、Promise、network を生成しない。
 * interaction test は Trigger focus と light/dark の token 接続も検証する。
 */
export const Error: Story = {
  render: (_args, { globals }) => (
    <ToastCatalog scenarioKind="error" theme={getStoryTheme(globals.theme)} />
  ),
  play: async ({ canvasElement, globals, step }) => {
    await step('エラー通知を click で表示し、状態と意味構造を確認する', async () => {
      // error 専用 Scenario を開き、公開 helper が既存 icon と data type へ接続されることを保証する。
      await openAndExpectToast(canvasElement, globals.theme, 'error');
    });
  },
};

/**
 * 複数行の info 通知と close icon button を表示し、折り返し、focus、クリック閉鎖を確認する。
 *
 * 長文は固定値でネットワークへ接続せず、close 後は削除 animation と内部 timer の完了まで待つ。
 * light/dark の双方でアクセシブル名と semantic token を同じ interaction test が検証する。
 */
export const LongInfoWithClose: Story = {
  render: (_args, { globals }) => (
    <ToastCatalog scenarioKind="info" theme={getStoryTheme(globals.theme)} />
  ),
  play: async ({ canvasElement, globals, step }) => {
    const scenario = toastScenarios.info;

    await step('長い説明を省略せず、Toast の利用可能幅へ折り返す', async () => {
      const toastElement = await openAndExpectToast(canvasElement, globals.theme, 'info');
      const description = toastElement.querySelector<HTMLElement>('[data-description]');

      // 固定長文の専用 description が存在しない退行を、汎用 text node への fallback で隠さない。
      if (description === null) {
        throw new TypeError('Info toast の description が描画されていません。');
      }

      // Toast と description の実寸を比較し、狭い viewport でも text overflow が発生しないことを保証する。
      await expect(description).toBeVisible();
      await expect(description.scrollWidth).toBeLessThanOrEqual(description.clientWidth);
      await expect(toastElement.scrollWidth).toBeLessThanOrEqual(toastElement.clientWidth);
    });

    await step('名前付き close button を focus して click し、通知を完全に除去する', async () => {
      const documentBody = within(canvasElement.ownerDocument.body);
      const closeButton = documentBody.getByRole('button', {
        name: CLOSE_BUTTON_ARIA_LABEL,
      });

      // 支援技術と keyboard 利用者が同じ操作を特定できることを、明示 focus と可視性で確認する。
      closeButton.focus();
      await expect(closeButton).toHaveFocus();
      await expect(closeButton).toBeVisible();

      // 実利用と同じ pointer click 後、Sonner の削除 timer まで待って状態漏れを防ぐ。
      await userEvent.click(closeButton);
      await expectToastRemoved(canvasElement.ownerDocument, scenario.toastId);
    });
  },
};

/**
 * Promise や通信を使わず、公開 loading helper と Toaster の loading icon を安定表示する。
 *
 * 無期限 duration により自動終了 timer を作らず、Story lifecycle cleanup だけで状態を解放する。
 * interaction test は click 後の focus、ARIA、loading state、light/dark token を確認する。
 */
export const Loading: Story = {
  render: (_args, { globals }) => (
    <ToastCatalog scenarioKind="loading" theme={getStoryTheme(globals.theme)} />
  ),
  play: async ({ canvasElement, globals, step }) => {
    await step('固定 loading 通知を表示し、非同期処理なしで状態を確認する', async () => {
      const toastElement = await openAndExpectToast(canvasElement, globals.theme, 'loading');

      // Toaster component が差し替える loading icon を data-icon 内へ描画し、操作 button を混入させない。
      await expect(toastElement.querySelector('[data-icon] svg')).toBeInTheDocument();
      await expect(within(toastElement).queryByRole('button')).not.toBeInTheDocument();
    });
  },
};

/**
 * 通常 Toast の公開 action option を表示し、操作の名前、focus、click callback、閉鎖を確認する。
 *
 * callback は Storybook spy だけを呼び、network、navigation、永続化を行わない。
 * action 後は削除 animation と内部 timer の完了まで待ち、light/dark test 間の漏れを防ぐ。
 */
export const WithAction: Story = {
  render: (_args, { globals }) => (
    <ToastCatalog scenarioKind="action" theme={getStoryTheme(globals.theme)} />
  ),
  play: async ({ canvasElement, globals, step }) => {
    const scenario = toastScenarios.action;

    await step('操作付き通知を表示し、名前付き action button を公開する', async () => {
      const toastElement = await openAndExpectToast(canvasElement, globals.theme, 'action');
      const actionButton = within(toastElement).getByRole('button', { name: ACTION_LABEL });

      // action は可視ラベルをそのままアクセシブル名として使い、通知内の唯一の操作になることを保証する。
      await expect(actionButton).toBeVisible();
      await expect(within(toastElement).getAllByRole('button')).toHaveLength(1);
    });

    await step(
      'action button を focus して click し、callback と完全な閉鎖を確認する',
      async () => {
        const documentBody = within(canvasElement.ownerDocument.body);
        const actionButton = documentBody.getByRole('button', { name: ACTION_LABEL });

        // keyboard で到達可能な実要素であることを明示 focus から確認してから、pointer click 経路を実行する。
        actionButton.focus();
        await expect(actionButton).toHaveFocus();
        await userEvent.click(actionButton);

        // click は外部副作用ではなく spy へ一度だけ通知され、Toast は内部 timer 完了後に残らない。
        await expect(actionClick).toHaveBeenCalledTimes(1);
        await expectToastRemoved(canvasElement.ownerDocument, scenario.toastId);
      }
    );
  },
};
