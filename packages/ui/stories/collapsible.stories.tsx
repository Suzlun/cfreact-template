import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  File,
  Folder,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cfreact-template/ui/components/collapsible';
import { Field, FieldGroup, FieldLabel } from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactNode } from 'react';

/** 公式 Order 例の表示内容とアクセシブルな操作名を一か所で管理する固定表示。 */
const orderCopy = {
  heading: 'Order #4189',
  toggle: 'Toggle details',
  statusLabel: 'Status',
  statusValue: 'Shipped',
  shippingLabel: 'Shipping address',
  shippingValue: '100 Market St, San Francisco',
  itemsLabel: 'Items',
  itemsValue: '2x Studio Headphones',
} as const;

/** 公式 Product details 例の Trigger、説明、CTA を一字一句保つ固定表示。 */
const productCopy = {
  trigger: 'Product details',
  description: 'This panel can be expanded or collapsed to reveal additional content.',
  action: 'Learn More',
} as const;

/** 公式 Settings Panel 例の見出し、説明、入力ラベル、操作名を管理する固定表示。 */
const settingsCopy = {
  title: 'Radius',
  description: 'Set the corner radius of the element.',
  radiusX: 'Radius X',
  radiusY: 'Radius Y',
  toggle: 'Toggle additional radius values',
} as const;

/** 公式 File Tree 例と同じ、ファイルまたは子項目を持つフォルダーの再帰構造。 */
type FileTreeItem =
  | { readonly name: string }
  | { readonly name: string; readonly items: readonly FileTreeItem[] };

/** 公式 File Tree 例の表示順と名前を保つ固定プロジェクト構造。 */
const fileTree = [
  {
    name: 'components',
    items: [
      {
        name: 'ui',
        items: [
          { name: 'button.tsx' },
          { name: 'card.tsx' },
          { name: 'dialog.tsx' },
          { name: 'input.tsx' },
          { name: 'select.tsx' },
          { name: 'table.tsx' },
        ],
      },
      { name: 'login-form.tsx' },
      { name: 'register-form.tsx' },
    ],
  },
  {
    name: 'lib',
    items: [{ name: 'utils.ts' }, { name: 'cn.ts' }, { name: 'api.ts' }],
  },
  {
    name: 'hooks',
    items: [
      { name: 'use-media-query.ts' },
      { name: 'use-debounce.ts' },
      { name: 'use-local-storage.ts' },
    ],
  },
  {
    name: 'types',
    items: [{ name: 'index.d.ts' }, { name: 'api.d.ts' }],
  },
  {
    name: 'public',
    items: [{ name: 'favicon.ico' }, { name: 'logo.svg' }, { name: 'images' }],
  },
  { name: 'app.tsx' },
  { name: 'layout.tsx' },
  { name: 'globals.css' },
  { name: 'package.json' },
  { name: 'tsconfig.json' },
  { name: 'README.md' },
  { name: '.gitignore' },
] as const satisfies readonly FileTreeItem[];

/** Story ごとの実用構成へ渡す Collapsible Root の公開 props。 */
interface CollapsibleExampleProps {
  /** Controls または各 Story が指定する初期状態と操作可否。 */
  rootProps: ComponentProps<typeof Collapsible>;
}

/** Settings Panel の入力一組を識別する固有 ID とラベル。 */
interface RadiusFieldsProps {
  /** 二つの input ID が Story 内で衝突しないように付与する接尾辞。 */
  idSuffix: string;
}

/**
 * 公式 shadcn/ui の Order 例を、Base UI の Trigger 合成 API で再現する。
 *
 * @param props 制御状態と操作可否を含む Collapsible Root props。
 * @returns 注文状態を常時表示し、配送先と商品を段階的に開示する Collapsible。
 */
function OrderDetailsExample({ rootProps }: CollapsibleExampleProps) {
  return (
    <Collapsible {...rootProps} className="flex w-full max-w-[350px] flex-col gap-2">
      {/* 注文番号と唯一の開閉操作を同じ行へ置き、公式例の情報階層を保つ。 */}
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="text-sm font-semibold">{orderCopy.heading}</h4>
        {/* render 合成で button semantics を一つに保ち、アイコン操作へ明示的な名前を与える。 */}
        <CollapsibleTrigger render={<Button className="size-8" size="icon" variant="ghost" />}>
          <ChevronsUpDown aria-hidden="true" />
          <span className="sr-only">{orderCopy.toggle}</span>
        </CollapsibleTrigger>
      </div>

      {/* 現在の配送状態は開閉状態にかかわらず確認できる。 */}
      <dl className="rounded-md border px-4 py-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">{orderCopy.statusLabel}</dt>
          <dd className="font-medium">{orderCopy.statusValue}</dd>
        </div>
      </dl>

      {/* 配送先と商品だけを対応パネルへ入れ、必要時に追加情報を開示する。 */}
      <CollapsibleContent className="flex flex-col gap-2">
        <div className="rounded-md border px-4 py-2 text-sm">
          <p className="font-medium">{orderCopy.shippingLabel}</p>
          <p className="text-muted-foreground break-words">{orderCopy.shippingValue}</p>
        </div>
        <div className="rounded-md border px-4 py-2 text-sm">
          <p className="font-medium">{orderCopy.itemsLabel}</p>
          <p className="text-muted-foreground">{orderCopy.itemsValue}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 公式例と同じ `open` / `onOpenChange` の制御状態を Story 内で完結させる。
 *
 * @param props 初期状態と、状態以外の Collapsible Root props。
 * @returns 利用者の操作を React state へ反映する Order 例。
 */
function ControlledOrderDetailsExample({ rootProps }: CollapsibleExampleProps) {
  // 外部の open 値を混在させず、defaultOpen だけを制御 state の初期値として読み取る。
  const {
    defaultOpen = false,
    open: _open,
    onOpenChange: _onOpenChange,
    ...controlledRootProps
  } = rootProps;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <OrderDetailsExample
      rootProps={{
        ...controlledRootProps,
        open: isOpen,
        onOpenChange: setIsOpen,
      }}
    />
  );
}

/**
 * 公式 Basic 例の Card、full-width Trigger、説明文、CTA をそのまま再現する。
 *
 * @param props 非制御の初期状態と操作可否を含む Collapsible Root props。
 * @returns 公式の説明文と Learn More 操作を開示する Product details Card。
 */
function ProductDetailsExample({ rootProps }: CollapsibleExampleProps) {
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardContent>
        <Collapsible {...rootProps} className="rounded-md data-open:bg-muted">
          {/* 公式例と同じ Trigger 構造・class・copy を保ち、Chevron を開閉状態に連動させる。 */}
          <CollapsibleTrigger render={<Button className="w-full" variant="ghost" />}>
            {productCopy.trigger}
            <ChevronDown className="ml-auto group-data-panel-open/button:rotate-180" />
          </CollapsibleTrigger>

          {/* 公式例の Content 構造・class・copy・Button 利用方法を変更せず表示する。 */}
          <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
            <div>{productCopy.description}</div>
            <Button size="xs">{productCopy.action}</Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

/**
 * 公式 Settings Panel と同じ X/Y の入力一組を、一意な label/input 対応で描画する。
 *
 * @param props Story 内で ID を一意にする接尾辞。
 * @returns スクリーンリーダー向けラベルを持つ二つの Radius input。
 */
function RadiusFields({ idSuffix }: RadiusFieldsProps) {
  return (
    <>
      {/* X 軸の値は固有 ID へ関連付け、視覚ラベルを増やさず入力目的を伝える。 */}
      <Field>
        <FieldLabel className="sr-only" htmlFor={`radius-x-${idSuffix}`}>
          {settingsCopy.radiusX}
        </FieldLabel>
        <Input id={`radius-x-${idSuffix}`} defaultValue={0} inputMode="numeric" placeholder="0" />
      </Field>

      {/* Y 軸も別 ID へ関連付け、同名 ID を使う公式例の不整合は持ち込まない。 */}
      <Field>
        <FieldLabel className="sr-only" htmlFor={`radius-y-${idSuffix}`}>
          {settingsCopy.radiusY}
        </FieldLabel>
        <Input id={`radius-y-${idSuffix}`} defaultValue={0} inputMode="numeric" placeholder="0" />
      </Field>
    </>
  );
}

/**
 * 公式 Settings Panel を制御状態で構成し、追加の Radius input を段階的に開示する。
 *
 * @param props 初期状態と Trigger の操作可否を含む Collapsible Root props。
 * @returns Radius Card、四つの入力、状態連動アイコンを持つ Collapsible。
 */
function SettingsPanelExample({ rootProps }: CollapsibleExampleProps) {
  // defaultOpen だけを初期値へ変換し、以後は state と onOpenChange の一組で状態を管理する。
  const {
    className: _className,
    defaultOpen = false,
    open: _open,
    onOpenChange: _onOpenChange,
    ...controlledRootProps
  } = rootProps;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="mx-auto w-full max-w-xs" size="sm">
      <CardHeader>
        <CardTitle>{settingsCopy.title}</CardTitle>
        <CardDescription>{settingsCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible
          {...controlledRootProps}
          className="flex items-start gap-2"
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          {/* 二列の FieldGroup 内で、追加行も同じ列幅と間隔へ揃える。 */}
          <FieldGroup className="grid w-full grid-cols-2 gap-2">
            <RadiusFields idSuffix="primary" />
            <CollapsibleContent className="col-span-full grid grid-cols-subgrid gap-2">
              <RadiusFields idSuffix="secondary" />
            </CollapsibleContent>
          </FieldGroup>

          {/* disabled 時も操作名と状態は読めるようにし、Root の操作拒否契約へ委譲する。 */}
          <CollapsibleTrigger
            render={
              <Button
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                size="icon"
                variant="outline"
              />
            }
          >
            {isOpen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            <span className="sr-only">{settingsCopy.toggle}</span>
          </CollapsibleTrigger>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

/**
 * 公式 File Tree の一項目を、静的ファイルまたは開閉可能なフォルダーとして再帰描画する。
 *
 * @param fileItem 描画するファイル名、または子項目を持つフォルダー。
 * @param defaultOpen 各フォルダーの初期開閉状態。
 * @param disabled 各フォルダー Trigger の操作可否。
 * @returns アイコン付きファイル行、または入れ子の Collapsible フォルダー。
 */
function renderFileTreeItem(
  fileItem: FileTreeItem,
  defaultOpen: boolean,
  disabled: boolean
): ReactNode {
  // 子項目を持つ場合だけ Trigger を設け、静的ファイルを動作しない button にしない。
  if ('items' in fileItem) {
    return (
      <Collapsible key={fileItem.name} defaultOpen={defaultOpen} disabled={disabled}>
        <CollapsibleTrigger
          render={
            <Button
              className="w-full justify-start transition-none aria-disabled:pointer-events-none aria-disabled:opacity-50"
              size="sm"
              variant="ghost"
            />
          }
        >
          <ChevronRight
            aria-hidden="true"
            className="transition-transform group-data-panel-open/button:rotate-90"
          />
          <Folder aria-hidden="true" />
          <span className="truncate">{fileItem.name}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 ml-5">
          <div className="flex flex-col gap-1">
            {fileItem.items.map((child) => renderFileTreeItem(child, defaultOpen, disabled))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // ファイル行は情報表示に限定し、存在しない選択・遷移アクションを公開しない。
  return (
    <div
      key={fileItem.name}
      className="flex h-7 min-w-0 items-center gap-2 px-2 text-sm text-foreground"
    >
      <File aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">{fileItem.name}</span>
    </div>
  );
}

/**
 * 公式 File Tree の構造と順序を、狭幅へ収まる Explorer Card として描画する。
 *
 * @param props 各フォルダーへ適用する初期状態と操作可否。
 * @returns 入れ子の folder Trigger と静的 file row を持つ Project files navigation。
 */
function FileTreeExample({ rootProps }: CollapsibleExampleProps) {
  // 複数 Root を持つため、各フォルダーへ共有できる boolean 契約だけを取り出す。
  const { defaultOpen = false, disabled = false } = rootProps;

  return (
    <Card className="mx-auto w-full max-w-[16rem] gap-2" size="sm">
      <CardHeader>
        <CardTitle>Explorer</CardTitle>
      </CardHeader>
      <CardContent>
        {/* nav のラベルで、入れ子の開閉操作群がプロジェクトファイルであることを伝える。 */}
        <nav aria-label="Project files" className="flex min-w-0 flex-col gap-1">
          {fileTree.map((item) => renderFileTreeItem(item, defaultOpen, disabled))}
        </nav>
      </CardContent>
    </Card>
  );
}

/**
 * Collapsible と全サブコンポーネントを、公式の実用構成・Controls・a11y 検査へ登録する。
 */
const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  subcomponents: {
    CollapsibleTrigger,
    CollapsibleContent,
  },
  args: {
    defaultOpen: false,
    disabled: false,
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    onOpenChange: {
      control: false,
      table: {
        category: 'Events',
      },
    },
    open: {
      control: false,
    },
  },
  parameters: {
    layout: 'centered',
  },
  render: (args) => <ControlledOrderDetailsExample rootProps={args} />,
} satisfies Meta<typeof Collapsible>;

/** Storybook が Collapsible の Docs・Controls・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 Order 例で、利用者に見える開閉・内容と Trigger の focus を検証する。 */
export const DefaultClosed: Story = {
  name: 'Order details',
  play: async ({ canvasElement, step }) => {
    // Story canvas 内だけを検索し、Storybook UI 自体の button を操作対象から除外する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: orderCopy.toggle });

    await step('閉状態と注文の常時表示情報を確認する', async () => {
      // 見出しと配送状態が読め、追加情報は利用者へ表示されていないことを確認する。
      await expect(
        canvas.getByRole('heading', { level: 4, name: orderCopy.heading })
      ).toBeVisible();
      await expect(canvas.getByText(orderCopy.statusValue)).toBeVisible();
      await expect(canvas.queryByText(orderCopy.shippingValue)).not.toBeInTheDocument();
    });

    await step('クリックで注文詳細を開閉する', async () => {
      // pointer 操作で追加情報を開き、配送先と商品が利用者へ表示されることを確認する。
      await userEvent.click(trigger);
      await expect(canvas.getByText(orderCopy.shippingValue)).toBeVisible();
      await expect(canvas.getByText(orderCopy.itemsValue)).toBeVisible();

      // 同じ Trigger を再クリックし、追加情報が利用者から隠れることを確認する。
      await userEvent.click(trigger);
      await expect(canvas.queryByText(orderCopy.shippingValue)).not.toBeInTheDocument();
    });

    await step('focus を保ったまま Enter と Space で開閉する', async () => {
      // Trigger へ明示的に focus を置き、キーボード利用者の現在位置を検証する。
      trigger.focus();
      await expect(trigger).toHaveFocus();

      // Enter で開き、標準 button のキーボード操作が制御 state へ反映されることを確認する。
      await userEvent.keyboard('{Enter}');
      await expect(canvas.getByText(orderCopy.shippingValue)).toBeVisible();

      // Space で閉じても追加情報が隠れ、focus が Trigger に残ることを確認する。
      await userEvent.keyboard(' ');
      await expect(canvas.queryByText(orderCopy.shippingValue)).not.toBeInTheDocument();
      await expect(trigger).toHaveFocus();
    });
  },
};

/** 公式 Product details 構成で、非制御の `defaultOpen` と公式 Content を検証する。 */
export const DefaultOpen: Story = {
  name: 'Product details',
  args: {
    defaultOpen: true,
  },
  render: (args) => <ProductDetailsExample rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 可視の Trigger 名から、内部実装の生成 id に依存せず操作対象を取得する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: productCopy.trigger });

    await step('defaultOpen により公式 Product details Content が初期表示される', async () => {
      // Trigger と公式の説明文・CTA が利用者へ表示されていることだけを確認する。
      await expect(trigger).toBeVisible();
      await expect(canvas.getByText(productCopy.description)).toBeVisible();
      await expect(canvas.getByRole('button', { name: productCopy.action })).toBeVisible();
    });
  },
};

/** 公式 Settings Panel 構成で、disabled Root が操作を拒否し入力ラベルを保つことを検証する。 */
export const DisabledTrigger: Story = {
  name: 'Disabled settings trigger',
  args: {
    disabled: true,
  },
  render: (args) => <SettingsPanelExample rootProps={args} />,
};

/** 既存 export を保ちつつ、公式 nested File Tree の利用者に見える開閉と内容を検証する。 */
export const LongResponsiveContent: Story = {
  name: 'File tree',
  args: {
    defaultOpen: true,
  },
  parameters: {
    layout: 'padded',
  },
  render: (args) => <FileTreeExample rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 最上位 folder Trigger を利用者向けラベルから取得する。
    const canvas = within(canvasElement);
    const componentsTrigger = canvas.getByRole('button', { name: 'components' });

    await step('入れ子の File Tree が初期表示される', async () => {
      // defaultOpen により、深い階層の file と navigation が利用者へ表示されることを確認する。
      await expect(canvas.getByText('button.tsx')).toBeVisible();
      await expect(canvas.getByRole('navigation', { name: 'Project files' })).toBeVisible();
    });

    await step('folder Trigger で subtree を開閉する', async () => {
      // folder を閉じると子項目が隠れ、再度開くと同じ内容が表示されることを確認する。
      await userEvent.click(componentsTrigger);
      await expect(canvas.queryByText('button.tsx')).not.toBeInTheDocument();

      await userEvent.click(componentsTrigger);
      await expect(canvas.getByText('button.tsx')).toBeVisible();
    });
  },
};
