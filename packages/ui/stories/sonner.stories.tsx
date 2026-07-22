import { toast } from 'sonner';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Toaster } from '@cfreact-template/ui/components/sonner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** Sonner の既定 hotkey と組み合わせて live region を識別する公式既定ラベル。 */
const TOASTER_CONTAINER_ARIA_LABEL = 'Notifications';

/** 公式 Promise 例が loading から success へ移るまでの待機時間。 */
const PROMISE_DELAY_MS = 2000;

/** Default、Success、Action、Promise解決後で公式例が共有する主文。 */
const EVENT_CREATED_MESSAGE = 'Event has been created';

/** Story 間で通知を混在させず、同じ操作の再実行時は既存通知を更新する固定 ID 群。 */
const TOAST_IDS = {
  action: 'sonner-action-toast',
  default: 'sonner-default-toast',
  error: 'sonner-error-toast',
  info: 'sonner-info-toast',
  promise: 'sonner-promise-toast',
  success: 'sonner-success-toast',
  warning: 'sonner-warning-toast',
} as const;

/** Docs で複数 Story を同時表示しても、通知を対応する Toaster だけへ届ける固定 ID 群。 */
const TOASTER_IDS = {
  action: 'sonner-action-toaster',
  default: 'sonner-default-toaster',
  error: 'sonner-error-toaster',
  info: 'sonner-info-toaster',
  promise: 'sonner-promise-toaster',
  success: 'sonner-success-toaster',
  warning: 'sonner-warning-toaster',
} as const;

/** 公式 action 例の Undo callback を外部作用なしで観測する Storybook spy。 */
const undoAction = fn();

/** Story 切替時に未完了の公式 Promise 例を停止する timer 集合。 */
const pendingPromiseTimers = new Set<ReturnType<typeof setTimeout>>();

/** Storybook と Sonner の双方が受け付ける固定テーマ。 */
type StoryTheme = 'dark' | 'light';

/** 一つの実用例を既存 Button と Toaster で描画する入力。 */
interface SonnerExampleProps {
  /** 公式例が Button に表示する操作名。 */
  buttonLabel: string;
  /** Button 操作時に対応する Sonner API を一度呼ぶ callback。 */
  onShow: () => void;
  /** Storybook global から検証済みの light または dark。 */
  theme: StoryTheme;
  /** この Story の通知だけを受け取る Toaster ID。 */
  toasterId: string;
}

/** 共通 interaction test が一つの Toast に期待する利用者向け状態。 */
interface ToastExpectation {
  /** キーボードで操作する Button の可視名。 */
  buttonLabel: string;
  /** Sonner が意味状態として公開する data-type。通常通知では属性を持たない。 */
  dataType: 'error' | 'info' | 'loading' | 'success' | 'warning' | null;
  /** Toast 内に表示される公式例の主文。 */
  message: string;
  /** 対象 Toast を他 Story の通知と区別する test ID。 */
  toastId: string;
}

/** 共通 interaction test が返す、表示済み通知とキーボード操作要素。 */
interface OpenToastResult {
  /** 通知を開いた後も focus を保つ Button。 */
  trigger: HTMLElement;
  /** 表示、意味状態、overflow を検証済みの Toast list item。 */
  toastElement: HTMLElement;
  /** `Alt+T` で focus できる Toast list。 */
  toaster: HTMLElement;
}

/**
 * Storybook の theme global を Sonner の公開 `theme` prop へ変換する。
 *
 * @param selectedTheme Storybook theme decorator と browser project が渡す値。
 * @returns Sonner が受け付ける `light` または `dark`。
 * @throws 対応外の global 値では Story を明示的に失敗させる。
 *
 * @example
 * `getStoryTheme('dark')` は `dark` を返し、Toaster の dark token を有効にする。
 */
function getStoryTheme(selectedTheme: unknown): StoryTheme {
  // Dark project の明示値だけを受け入れ、system theme への暗黙変換を避ける。
  if (selectedTheme === 'dark') {
    return selectedTheme;
  }

  // Light project の明示値だけを受け入れ、未定義値を light として黙認しない。
  if (selectedTheme === 'light') {
    return selectedTheme;
  }

  throw new TypeError('Storybook theme は light または dark である必要があります。');
}

/**
 * 公式例と同じ Button 一つ、および通知の描画先となる公開 Toaster を表示する。
 *
 * @param props 可視操作名、通知 callback、theme、配信先 ID。
 * @returns 既存 component と token だけで構成した操作可能な Story。
 * 副作用は Button 操作後のローカル Toast 配信だけで、通信や永続化を行わない。
 */
function SonnerExample({ buttonLabel, onShow, theme, toasterId }: SonnerExampleProps) {
  return (
    <div className="flex min-h-24 w-full items-center justify-center px-4">
      {/* 公式 example と同じ outline Button を使い、native keyboard activation を保つ。 */}
      <Button type="button" variant="outline" onClick={onShow}>
        {buttonLabel}
      </Button>

      {/* 公開 props だけで theme と配信先を固定し、reduced motion 時は loading icon の回転を止める。 */}
      <Toaster
        id={toasterId}
        containerAriaLabel={TOASTER_CONTAINER_ARIA_LABEL}
        theme={theme}
        toastOptions={{
          classNames: {
            loader: 'motion-reduce:[&_svg]:animate-none',
            toast: 'cn-toast',
          },
        }}
      />
    </div>
  );
}

/**
 * 公式 Promise 例と同じ二秒後に Event を返すローカル処理を作る。
 *
 * @returns `{ name: 'Event' }` で解決する Promise。
 * @throws reject 経路を持たない固定例のため例外は発生しない。
 * Story lifecycle は登録 timer を停止し、切替後の Toast 更新を防ぐ。
 *
 * @example
 * `createEvent()` を `toast.promise` へ渡すと loading から success へ遷移する。
 */
function createEvent(): Promise<{ name: string }> {
  return new Promise((resolve) => {
    // 公式 registry example と同じ二秒待機し、loading 状態を目視できる時間だけ維持する。
    const timer = setTimeout(() => {
      // 解決済み timer を追跡対象から外し、cleanup が完了済み処理へ触れないようにする。
      pendingPromiseTimers.delete(timer);
      resolve({ name: 'Event' });
    }, PROMISE_DELAY_MS);

    // Story 切替時に未解決 Promise の表示更新を停止できるよう、timer を lifecycle へ登録する。
    pendingPromiseTimers.add(timer);
  });
}

/**
 * Story lifecycle に残る公式 Promise 例の timer をすべて停止する。
 *
 * @returns 戻り値はなく、追跡中 timer と集合を同期的に空にする。
 * 外部状態や他 component の timer には触れない。
 */
function clearPendingPromiseTimers(): void {
  // 追跡済み timer だけを停止し、別 Story や Storybook 自体の scheduler へ干渉しない。
  for (const timer of pendingPromiseTimers) {
    clearTimeout(timer);
  }

  // 停止済み handle を残さず、次の Promise Story を独立した状態で開始する。
  pendingPromiseTimers.clear();
}

/**
 * この Story ファイルが作成した通知だけを閉じ、削除 animation の完了を待つ。
 *
 * @param ownerDocument Story canvas と Toast DOM を所有する Document。
 * @returns この Story が公開した test ID の Toast が DOM から除去された時点で解決する Promise。
 * @throws Sonner が通知を除去できない場合は `waitFor` の timeout で失敗する。
 */
async function dismissStoryToasts(ownerDocument: Document): Promise<void> {
  const documentBody = within(ownerDocument.body);

  // 実在する Story 所有 Toast だけを閉じ、存在しない将来 ID へ dismiss event を予約しない。
  for (const toastId of Object.values(TOAST_IDS)) {
    if (documentBody.queryByTestId(toastId) !== null) {
      toast.dismiss(toastId);
    }
  }

  // 公開 test ID がすべて消えるまで待ち、次の Story へ操作可能な通知を持ち越さない。
  await waitFor(async () => {
    for (const toastId of Object.values(TOAST_IDS)) {
      await expect(documentBody.queryByTestId(toastId)).not.toBeInTheDocument();
    }
  });
}

/**
 * Button を keyboard で起動し、Toast の focus、live region、theme、状態、応答幅を検証する。
 *
 * @param canvasElement Story の Button と ownerDocument を特定する描画範囲。
 * @param selectedTheme Storybook が light/dark browser project へ渡す global 値。
 * @param expected 公式例の可視名、意味状態、固定 test ID。
 * @returns 表示済み Toast、trigger、Toaster list。
 * @throws keyboard 操作、ARIA、theme、state、overflow の契約が崩れた場合に失敗する。
 */
async function openToastWithKeyboard(
  canvasElement: HTMLElement,
  selectedTheme: unknown,
  expected: ToastExpectation
): Promise<OpenToastResult> {
  const ownerDocument = canvasElement.ownerDocument;
  const canvas = within(canvasElement);
  const documentBody = within(ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: expected.buttonLabel });

  // Button へ keyboard focus を置き、pointer 専用ではない native activation 経路を検証する。
  trigger.focus();
  await expect(trigger).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  // 非 modal Toast が利用者の現在位置を奪わず、trigger focus を維持することを保証する。
  await expect(trigger).toHaveFocus();

  // 非同期 publish 後の現在の要素を test ID から取り直し、利用者が読む本文の可視化を待つ。
  const toastElement = await waitFor(async () => {
    const currentToastElement = documentBody.getByTestId(expected.toastId);
    await expect(currentToastElement).toBeVisible();
    await expect(within(currentToastElement).getByText(expected.message)).toBeVisible();
    return currentToastElement;
  });

  // 公式既定 hotkey を含む名前付き region が、穏やかな追加通知として公開されることを確認する。
  const liveRegion = documentBody.getByRole('region', {
    name: /^notifications alt\+t$/i,
  });
  await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  await expect(liveRegion).toHaveAttribute('aria-relevant', 'additions text');
  await expect(liveRegion).toHaveAttribute('aria-atomic', 'false');

  // 通知を list/listitem として読み上げ、主文と Sonner state を色以外でも区別できるようにする。
  const toaster = within(liveRegion).getByRole('list');
  await expect(toastElement).toHaveRole('listitem');

  // 通常通知は型属性を持たず、semantic helper と Promise loading だけが対応 state を公開する。
  if (expected.dataType === null) {
    await expect(toastElement).not.toHaveAttribute('data-type');
  } else {
    await expect(toastElement).toHaveAttribute('data-type', expected.dataType);
  }

  // Storybook の class theme と Toaster の描画 theme が light/dark の両 project で一致するまで待つ。
  const theme = getStoryTheme(selectedTheme);
  await waitFor(async () => {
    if (theme === 'dark') {
      await expect(ownerDocument.documentElement).toHaveClass('dark');
    } else {
      await expect(ownerDocument.documentElement).not.toHaveClass('dark');
    }
  });

  // 既存 shadcn/ui component が globals.css の semantic token を参照し、独自色へ退行しないことを保証する。
  await expect(toaster.style.getPropertyValue('--normal-bg')).toBe('var(--popover)');
  await expect(toaster.style.getPropertyValue('--normal-text')).toBe('var(--popover-foreground)');
  await expect(toaster.style.getPropertyValue('--normal-border')).toBe('var(--border)');
  await expect(toaster.style.getPropertyValue('--border-radius')).toBe('var(--radius)');

  // Desktop と既存 390px project の双方で、通知と list が viewport からはみ出さないことを確認する。
  const toasterBounds = toaster.getBoundingClientRect();
  await expect(toastElement.scrollWidth).toBeLessThanOrEqual(toastElement.clientWidth);
  await expect(toasterBounds.left).toBeGreaterThanOrEqual(0);
  await expect(toasterBounds.right).toBeLessThanOrEqual(ownerDocument.documentElement.clientWidth);

  // Sonner 公式既定 `Alt+T` で通知一覧へ移動できることを実操作で確認する。
  await userEvent.keyboard('{Alt>}t{/Alt}');
  await waitFor(async () => {
    await expect(toaster).toHaveFocus();
  });

  return { toaster, toastElement, trigger };
}

/**
 * 公開 Toaster と公式 shadcn/ui Sonner examples を Docs・a11y・interaction tests へ登録する。
 *
 * 各 Story は props 一覧ではなく、利用者が実際に起動できる一つの Toast 状態を示す。
 * Story 切替時には、このファイルが作成した通知、timer、spy 履歴だけを決定的に消去する。
 */
const meta = {
  title: 'Components/Sonner',
  component: Toaster,
  beforeEach: async ({ canvasElement }) => {
    // 前回の Promise 解決と Undo 履歴を停止・消去してから、残存 Toast の削除を待つ。
    clearPendingPromiseTimers();
    undoAction.mockClear();
    await dismissStoryToasts(canvasElement.ownerDocument);

    // Story の unmount 時も同じ対象だけを解放し、次の theme・viewport project へ状態を渡さない。
    return async () => {
      clearPendingPromiseTimers();
      undoAction.mockClear();
      await dismissStoryToasts(canvasElement.ownerDocument);
    };
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Sonner examples に沿い、default、success、info、warning、error、action、promise を既存 Toaster と toast API で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Toaster>;

/** Storybook が Sonner の Docs と interaction tests を構築するための既定 export。 */
export default meta;

/** metadata から各 Sonner Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Types 例の通常 Toast を、outline Button から keyboard で表示する。 */
export const Default: Story = {
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Default"
      onShow={() =>
        toast(EVENT_CREATED_MESSAGE, {
          id: TOAST_IDS.default,
          testId: TOAST_IDS.default,
          toasterId: TOASTER_IDS.default,
        })
      }
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.default}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    // 通常 Toast の可視文、focus、live region、theme、応答幅を利用者操作から検証する。
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Default',
      dataType: null,
      message: EVENT_CREATED_MESSAGE,
      toastId: TOAST_IDS.default,
    });
  },
};

/** 公式 Types 例の success helper と、既存 Toaster の success icon/state を示す。 */
export const Success: Story = {
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Success"
      onShow={() =>
        toast.success(EVENT_CREATED_MESSAGE, {
          id: TOAST_IDS.success,
          testId: TOAST_IDS.success,
          toasterId: TOASTER_IDS.success,
        })
      }
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.success}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    // Success の可視文と semantic state を、通常 Toast と同じ accessibility 契約で検証する。
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Success',
      dataType: 'success',
      message: EVENT_CREATED_MESSAGE,
      toastId: TOAST_IDS.success,
    });
  },
};

/** 公式 Types 例の info helper を、予定前の補足通知として表示する。 */
export const Info: Story = {
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Info"
      onShow={() =>
        toast.info('Be at the area 10 minutes before the event time', {
          id: TOAST_IDS.info,
          testId: TOAST_IDS.info,
          toasterId: TOASTER_IDS.info,
        })
      }
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.info}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    // Info の長い一文が 390px でも欠けず、色以外の state を持つことを検証する。
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Info',
      dataType: 'info',
      message: 'Be at the area 10 minutes before the event time',
      toastId: TOAST_IDS.info,
    });
  },
};

/** 公式 Types 例の warning helper を、開始時刻の制約通知として表示する。 */
export const Warning: Story = {
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Warning"
      onShow={() =>
        toast.warning('Event start time cannot be earlier than 8am', {
          id: TOAST_IDS.warning,
          testId: TOAST_IDS.warning,
          toasterId: TOASTER_IDS.warning,
        })
      }
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.warning}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    // Warning の可視文、icon state、live region、狭幅での折り返しを検証する。
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Warning',
      dataType: 'warning',
      message: 'Event start time cannot be earlier than 8am',
      toastId: TOAST_IDS.warning,
    });
  },
};

/** 公式 Types 例の error helper を、作成失敗の回復可能な通知として表示する。 */
export const Error: Story = {
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Error"
      onShow={() =>
        toast.error('Event has not been created', {
          id: TOAST_IDS.error,
          testId: TOAST_IDS.error,
          toasterId: TOASTER_IDS.error,
        })
      }
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.error}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    // Error の失敗文と semantic state を、色へ依存しない listitem として検証する。
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Error',
      dataType: 'error',
      message: 'Event has not been created',
      toastId: TOAST_IDS.error,
    });
  },
};

/** 公式 Demo 例の description と Undo action を持つ、操作可能な通常 Toast を示す。 */
export const WithAction: Story = {
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Show Toast"
      onShow={() =>
        toast(EVENT_CREATED_MESSAGE, {
          action: {
            label: 'Undo',
            onClick: undoAction,
          },
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          id: TOAST_IDS.action,
          testId: TOAST_IDS.action,
          toasterId: TOASTER_IDS.action,
        })
      }
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.action}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Show Toast',
      dataType: null,
      message: EVENT_CREATED_MESSAGE,
      toastId: TOAST_IDS.action,
    });
    const documentBody = within(canvasElement.ownerDocument.body);

    // 現在の Action Toast を取得し、利用者が読む公式 description の可視化を待つ。
    const toastElement = await waitFor(async () => {
      const currentToastElement = documentBody.getByTestId(TOAST_IDS.action);
      await expect(
        within(currentToastElement).getByText('Sunday, December 03, 2023 at 9:00 AM')
      ).toBeVisible();
      return currentToastElement;
    });
    const actionButton = within(toastElement).getByRole('button', { name: 'Undo' });

    // 公式 description を省略せず表示し、action の可視ラベルをそのままアクセシブル名にする。
    await expect(actionButton).toHaveAccessibleName('Undo');

    // `Alt+T` で focus 済みの list から Toast、Undo の順に Tab 移動できることを確認する。
    await userEvent.tab();
    await waitFor(async () => {
      await expect(documentBody.getByTestId(TOAST_IDS.action)).toHaveFocus();
    });
    await userEvent.tab();
    await waitFor(async () => {
      await expect(
        within(documentBody.getByTestId(TOAST_IDS.action)).getByRole('button', { name: 'Undo' })
      ).toHaveFocus();
    });

    // Enter による Undo 実行を一度だけ通知し、action 後に Toast が完全に閉じることを確認する。
    await userEvent.keyboard('{Enter}');
    await expect(undoAction).toHaveBeenCalledTimes(1);
    await waitFor(async () => {
      await expect(
        within(canvasElement.ownerDocument.body).queryByTestId(TOAST_IDS.action)
      ).not.toBeInTheDocument();
    });
  },
};

/** 公式 Types 例の `toast.promise` を使い、loading から success への実用遷移を示す。 */
export const PromiseToast: Story = {
  name: 'Promise',
  render: (_args, { globals }) => (
    <SonnerExample
      buttonLabel="Promise"
      onShow={() => {
        // 公式 registry と同じ loading/success/error contract を、ローカル Promise へ接続する。
        toast.promise<{ name: string }>(() => createEvent(), {
          error: 'Error',
          id: TOAST_IDS.promise,
          loading: 'Loading...',
          success: (data) => `${data.name} has been created`,
          testId: TOAST_IDS.promise,
          toasterId: TOASTER_IDS.promise,
        });
      }}
      theme={getStoryTheme(globals.theme)}
      toasterId={TOASTER_IDS.promise}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    await openToastWithKeyboard(canvasElement, globals.theme, {
      buttonLabel: 'Promise',
      dataType: 'loading',
      message: 'Loading...',
      toastId: TOAST_IDS.promise,
    });
    const documentBody = within(canvasElement.ownerDocument.body);

    // 公式の二秒待機後、同じ test ID の現在の Toast が success state と解決データの文へ更新されることを確認する。
    await waitFor(
      async () => {
        const resolvedToastElement = documentBody.getByTestId(TOAST_IDS.promise);
        await expect(resolvedToastElement).toHaveAttribute('data-type', 'success');
        await expect(within(resolvedToastElement).getByText(EVENT_CREATED_MESSAGE)).toBeVisible();
      },
      { timeout: PROMISE_DELAY_MS + 2000 }
    );
  },
};
