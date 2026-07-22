import { Fragment } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Field, FieldError, FieldLabel } from '@cfreact-template/ui/components/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@cfreact-template/ui/components/select';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

/** SelectItem が表示する固定値、可視名、および操作可否の契約。 */
interface SelectOption {
  /** Root と Item が同じ選択肢を識別する、Story 内で一意な固定値。 */
  readonly value: string;
  /** Trigger、Item、interaction test で共通利用する可視名。 */
  readonly label: string;
  /** 指定された Item だけを選択不可にする任意の状態。 */
  readonly disabled?: boolean;
}

/** SelectGroup と SelectLabel が一つの分類として共有する固定データの契約。 */
interface SelectOptionGroup {
  /** Group の可視見出し兼アクセシブルネーム。 */
  readonly label: string;
  /** 分類内で固定順序のまま描画する選択肢。 */
  readonly options: readonly SelectOption[];
}

/**
 * 公式 Group 構成を Select Root の items 契約へ渡せる一階層の一覧へ変換する。
 *
 * @param groups 可視分類名と固定順序の選択肢を持つ公式 Example の分類一覧。
 * @returns SelectValue が選択値から公式表示名を解決するための選択肢一覧。
 */
function flattenSelectGroups(groups: readonly SelectOptionGroup[]): readonly SelectOption[] {
  // 分類内と分類間の順序を変えずに連結し、Popup と Trigger で同じ value／label 対応を共有する。
  return groups.flatMap((group) => group.options);
}

/**
 * 固定分類名とtupleの選択肢を、型を失わず公式SelectGroupデータへまとめる。
 *
 * @param label SelectLabelへ表示する分類名。
 * @param options 分類内で公式順序を保つ固定選択肢tuple。
 * @returns 末尾項目まで静的に参照できる読み取り専用group。
 */
function selectGroup<const Options extends readonly SelectOption[]>(
  label: string,
  options: Options
) {
  // 可視順序や値を変換せず、繰り返していたgroup objectの外枠だけを共通化する。
  return { label, options } as const;
}

/** 公式 Default、With Field、Disabled、Invalid で共有する fruit 選択肢。 */
const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'grapes', label: 'Grapes' },
  { value: 'pineapple', label: 'Pineapple' },
] as const satisfies readonly SelectOption[];

/** 公式 Groups Example の Fruits／Vegetables と分類間 Separator を再現する固定分類。 */
const produceGroups = [
  selectGroup('Fruits', [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'blueberry', label: 'Blueberry' },
  ]),
  selectGroup('Vegetables', [
    { value: 'carrot', label: 'Carrot' },
    { value: 'broccoli', label: 'Broccoli' },
    { value: 'spinach', label: 'Spinach' },
  ]),
] as const satisfies readonly SelectOptionGroup[];

/** Groups Story の SelectValue が produce の表示名を解決するための平坦な一覧。 */
const produceOptions = flattenSelectGroups(produceGroups);

/** 公式 Scrollable Example の地域分類と timezone を順序・文言・値まで保持する固定データ。 */
const timeZoneGroups = [
  selectGroup('North America', [
    { value: 'est', label: 'Eastern Standard Time (EST)' },
    { value: 'cst', label: 'Central Standard Time (CST)' },
    { value: 'mst', label: 'Mountain Standard Time (MST)' },
    { value: 'pst', label: 'Pacific Standard Time (PST)' },
    { value: 'akst', label: 'Alaska Standard Time (AKST)' },
    { value: 'hst', label: 'Hawaii Standard Time (HST)' },
  ]),
  selectGroup('Europe & Africa', [
    { value: 'gmt', label: 'Greenwich Mean Time (GMT)' },
    { value: 'cet', label: 'Central European Time (CET)' },
    { value: 'eet', label: 'Eastern European Time (EET)' },
    { value: 'west', label: 'Western European Summer Time (WEST)' },
    { value: 'cat', label: 'Central Africa Time (CAT)' },
    { value: 'eat', label: 'East Africa Time (EAT)' },
  ]),
  selectGroup('Asia', [
    { value: 'msk', label: 'Moscow Time (MSK)' },
    { value: 'ist', label: 'India Standard Time (IST)' },
    { value: 'cst_china', label: 'China Standard Time (CST)' },
    { value: 'jst', label: 'Japan Standard Time (JST)' },
    { value: 'kst', label: 'Korea Standard Time (KST)' },
    {
      value: 'ist_indonesia',
      label: 'Indonesia Central Standard Time (WITA)',
    },
  ]),
  selectGroup('Australia & Pacific', [
    { value: 'awst', label: 'Australian Western Standard Time (AWST)' },
    { value: 'acst', label: 'Australian Central Standard Time (ACST)' },
    { value: 'aest', label: 'Australian Eastern Standard Time (AEST)' },
    { value: 'nzst', label: 'New Zealand Standard Time (NZST)' },
    { value: 'fjt', label: 'Fiji Time (FJT)' },
  ]),
  selectGroup('South America', [
    { value: 'art', label: 'Argentina Time (ART)' },
    { value: 'bot', label: 'Bolivia Time (BOT)' },
    { value: 'brt', label: 'Brasilia Time (BRT)' },
    { value: 'clt', label: 'Chile Standard Time (CLT)' },
  ]),
] as const satisfies readonly SelectOptionGroup[];

/** Scrollable Story の SelectValue が timezone の表示名を解決するための平坦な一覧。 */
const timeZoneOptions = flattenSelectGroups(timeZoneGroups);

/** 公式 Example の用途・文言・フォーム名を各 Story へ対応付ける固定データ。 */
const fruitExampleCopy = { label: 'Favorite Fruit', placeholder: 'Select a fruit' } as const;

/** 公式Exampleの用途固有ID・nameと、共有される可視copyを対応付ける固定データ。 */
const selectExamples = {
  default: { ...fruitExampleCopy, id: 'select-favorite-fruit', name: 'favoriteFruit' },
  selected: { ...fruitExampleCopy, id: 'select-selected-fruit', name: 'selectedFruit' },
  groups: {
    id: 'select-produce',
    label: 'Produce',
    name: 'produce',
    placeholder: 'Select produce',
  },
  disabled: { ...fruitExampleCopy, id: 'select-disabled-fruit', name: 'disabledFruit' },
  invalid: {
    ...fruitExampleCopy,
    error: 'Please select a valid fruit.',
    id: 'select-invalid-fruit',
    name: 'invalidFruit',
  },
  scrollable: {
    id: 'select-timezone',
    label: 'Time zone',
    name: 'timezone',
    placeholder: 'Select a timezone',
  },
} as const;

/** Trigger の展開状態を pointer・keyboard の両操作で検証する固定 ARIA 属性名。 */
const expandedAttribute = 'aria-expanded';

/** Select Root の公開イベントを Storybook spy として受け取る Story 共通 args。 */
interface SelectStoryArgs {
  /** Popup の開閉値と既存 event details を外部作用なしで観測する Story 専用 spy。 */
  onOpenChange: NonNullable<ComponentProps<typeof Select>['onOpenChange']>;
  /** 選択値と既存 event details を外部作用なしで観測する Story 専用 spy。 */
  onValueChange: NonNullable<ComponentProps<typeof Select>['onValueChange']>;
}

/** ラベル付き Select の共通構成へ渡す、既存公開 API と固定表示だけの入力。 */
interface LabeledSelectProps extends SelectStoryArgs {
  /** SelectContent 内へ正しい親子関係で配置する Item、Group、Label、Separator。 */
  readonly children: ReactNode;
  /** 非制御 Root が初期表示する任意の固定値。 */
  readonly defaultValue?: string;
  /** Root と Trigger を一括して操作不可にする状態。 */
  readonly disabled?: boolean;
  /** invalid 状態で Trigger からエラーメッセージとして参照する任意の固定説明。 */
  readonly errorMessage?: string;
  /** FieldLabel と Trigger を関連付ける Story 内で一意な固定 ID。 */
  readonly id: string;
  /** Trigger の目的を示す可視ラベル兼アクセシブルネーム。 */
  readonly label: string;
  /** Select がネイティブフォームへ公開する用途別の固定フィールド名。 */
  readonly name: string;
  /** SelectValue が未選択時に表示する固定 placeholder。 */
  readonly placeholder: string;
  /** Root が選択値から可視名を解決する固定選択肢。 */
  readonly items: readonly SelectOption[];
  /** Trigger へ既存の invalid semantics と視覚状態を適用するか。 */
  readonly invalid?: boolean;
  /** Popup の高さを既存 spacing utility で制限し、スクロール状態を表示するか。 */
  readonly scrollable?: boolean;
}

/** 描画factoryが各公式Exampleから受け取る、ラベル付きSelectの共通固定値。 */
type SelectExampleDefinition = Pick<LabeledSelectProps, 'id' | 'label' | 'name' | 'placeholder'>;

/** 公式Exampleごとの差分だけを描画factoryへ渡すSelectの公開状態。 */
type SelectExampleState = Pick<
  LabeledSelectProps,
  'defaultValue' | 'disabled' | 'errorMessage' | 'invalid' | 'scrollable'
>;

/** SelectContent直下の公式構成を遅延生成し、Story間で同じDOM構造を再利用する関数。 */
type SelectContentRenderer = () => ReactNode;

/**
 * 公式 Field、Trigger、Value、Content の構成を既存 Select 契約で関連付ける。
 *
 * @param props Root の固定 items・フォーム名・初期値・状態・イベント、可視ラベル、Popup の子要素。
 * @returns pointer と keyboard の双方で操作でき、名前とエラーを支援技術から解決できる Select 欄。
 */
function LabeledSelect({
  children,
  defaultValue,
  disabled = false,
  errorMessage,
  id,
  invalid = false,
  items,
  label,
  name,
  onOpenChange,
  onValueChange,
  placeholder,
  scrollable = false,
}: LabeledSelectProps) {
  // エラーが存在する Story だけ固定 ID を生成し、存在しない要素への ARIA 参照を出力しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;

  return (
    <Field
      className={scrollable ? 'w-70 max-w-full' : 'w-45 max-w-full'}
      data-disabled={disabled ? 'true' : undefined}
      data-invalid={invalid ? 'true' : undefined}
    >
      {/* 公式 FieldLabel の htmlFor と Trigger の ID を一致させ、可視名と操作対象を結び付ける。 */}
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Select
        defaultValue={defaultValue}
        disabled={disabled}
        items={items}
        name={name}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      >
        {/* Trigger を Field 幅へ追従させ、長い Value は既存 line-clamp を使って一行内に保持する。 */}
        <SelectTrigger
          id={id}
          aria-errormessage={errorId}
          aria-invalid={invalid || undefined}
          className="w-full min-w-0"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        {/* Scrollable は公式の長い一覧を既存 spacing で制限し、390px 内で横方向にも収める。 */}
        <SelectContent
          className={scrollable ? 'max-h-72 w-80 max-w-[calc(100vw-2rem)]' : undefined}
        >
          {children}
        </SelectContent>
      </Select>

      {errorMessage === undefined ? null : (
        // 公式 FieldError の alert semantics と destructive token で、色以外でも修正内容を伝える。
        <FieldError id={errorId}>{errorMessage}</FieldError>
      )}
    </Field>
  );
}

/**
 * 固定選択肢を、値・可視名・操作可否を持つ SelectItem として同じ順序で描画する。
 *
 * @param options Root の items と同じ値・表示名を持つ固定選択肢。
 * @param truncateLabels 狭い Popup 内で長い可視名を一行省略するか。
 * @returns SelectContent または SelectGroup の直下へ配置できる SelectItem 一覧。
 */
function renderSelectItems(options: readonly SelectOption[], truncateLabels = false): ReactNode {
  return options.map((option) => (
    <SelectItem
      key={option.value}
      className={
        truncateLabels
          ? 'min-w-0 overflow-hidden *:[span]:last:min-w-0 *:[span]:last:shrink'
          : undefined
      }
      disabled={option.disabled === true}
      label={option.label}
      value={option.value}
    >
      {truncateLabels ? (
        // ItemText が保持する完全な accessible text は変えず、狭い可視領域だけを省略表示する。
        <span className="block min-w-0 truncate">{option.label}</span>
      ) : (
        option.label
      )}
    </SelectItem>
  ));
}

/**
 * 固定分類を Group と Label で関連付け、分類間だけに Separator を挿入する。
 *
 * @param groups 見出しと固定選択肢を持つ分類一覧。
 * @returns Group、Label、Item、Separator の公開構成を固定順序で含む Popup 内容。
 */
function renderSelectGroups(
  groups: readonly SelectOptionGroup[],
  truncateLabels = false,
  separated = false
): ReactNode {
  return groups.map((group, index) => (
    <Fragment key={group.label}>
      {/* 公式 Composition と同じ Group／Label／Item の親子関係で分類名と候補を結び付ける。 */}
      <SelectGroup>
        <SelectLabel>{group.label}</SelectLabel>
        {renderSelectItems(group.options, truncateLabels)}
      </SelectGroup>

      {/* Separator は分類間だけへ置き、先頭・末尾に意味のない境界を追加しない。 */}
      {separated && index < groups.length - 1 ? <SelectSeparator /> : null}
    </Fragment>
  ));
}

/** 公式fruit例で共通するGroup、Label、Itemを固定順序で返す副作用のない描画関数。 */
const renderFruitSelectItems = () => renderSelectGroups([selectGroup('Fruits', fruitOptions)]);

/** 公式Scrollable例の地域Groupを、長いtimezone名の省略表示付きで返す描画関数。 */
const renderTimeZoneSelectItems = () => renderSelectGroups(timeZoneGroups, true);

/**
 * 各Storyで重複していたラベル、items、状態、event argsの配線を同じ描画契約へ集約する。
 *
 * @param example 可視ラベル、フォーム名、placeholder、関連付けIDを持つ公式Example。
 * @param items Rootが選択値から可視名を解決する固定候補。
 * @param renderContent Popup直下のItem、Group、Label、Separatorを返す描画関数。
 * @param state disabled、invalid、初期値、scrollableなどStory固有の公開状態。
 * @returns Storybookから受け取るevent argsを既存LabeledSelectへ接続するrender関数。
 */
function createSelectRenderer(
  example: SelectExampleDefinition,
  items: readonly SelectOption[],
  renderContent: SelectContentRenderer,
  state: SelectExampleState = {}
): (args: SelectStoryArgs) => ReactElement {
  return (args) => (
    <LabeledSelect {...args} {...example} {...state} items={items}>
      {renderContent()}
    </LabeledSelect>
  );
}

/**
 * canvas 内の可視ラベルから Trigger を取得し、Label、ID、アクセシブルネームを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param example LabelとTriggerが共有する固定ID、および可視ラベル兼アクセシブルネーム。
 * @returns 各 Story の状態・操作 assertion で続けて使用する SelectTrigger 要素。
 */
async function getExampleSelectTrigger(
  canvasElement: HTMLElement,
  example: SelectExampleDefinition
): Promise<HTMLElement> {
  // Story の描画範囲へクエリを限定し、別 Story や Storybook UI の button を誤取得しない。
  const canvas = within(canvasElement);
  const label = canvas.getByText(example.label, { selector: 'label' });
  const trigger = canvas.getByRole('combobox', { name: example.label });

  // 明示した Label 関連付けと支援技術が解決する名前が、同じ Trigger を指すことを保証する。
  await expect(label).toHaveAttribute('for', example.id);
  await expect(trigger).toHaveAttribute('id', example.id);
  await expect(canvas.getByLabelText(example.label)).toBe(trigger);
  await expect(trigger).toHaveAccessibleName(example.label);

  return trigger;
}

/**
 * Portal 内へ描画された Select の listbox を取得し、開始 animation の完了を待つ。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns 可視状態を確認できた SelectContent 内の listbox。
 */
async function findSelectListbox(canvasElement: HTMLElement): Promise<HTMLElement> {
  // SelectContent は Portal に描画されるため、canvas ではなく同じ document の body を検索する。
  const listbox = await within(canvasElement.ownerDocument.body).findByRole('listbox');

  // transition 中の透明な状態を読まず、利用者が操作可能な表示状態まで条件で待機する。
  await waitFor(() => expect(listbox).toBeVisible());

  return listbox;
}

/**
 * Triggerをpointerで開き、Portalの開始animation完了後のlistboxを返す。
 *
 * @param trigger 開く対象のSelectTrigger。
 * @param canvasElement PortalとownerDocumentを共有するStory canvas。
 * @returns pointer操作後に可視となったSelect listbox。
 */
async function openSelectListbox(
  trigger: HTMLElement,
  canvasElement: HTMLElement
): Promise<HTMLElement> {
  // 各Storyで同じpointer経路を使用し、clickとPortal待機の順序を一貫させる。
  await userEvent.click(trigger);
  return await findSelectListbox(canvasElement);
}

/**
 * Portal内の公開data slotから、描画済みSelectContentを安全に取得する。
 *
 * @param canvasElement SelectContentとownerDocumentを共有するStory canvas。
 * @returns viewport境界とscroll buttonを実測できるSelectContent。
 * @throws Portal内にSelectContentが存在せず、公式Popup構成が成立しない場合。
 */
function getSelectContent(canvasElement: HTMLElement): HTMLElement {
  const popup = canvasElement.ownerDocument.querySelector<HTMLElement>(
    '[data-slot="select-content"]'
  );
  if (popup === null) {
    throw new TypeError('SelectContent が Portal 内に描画されていません。');
  }
  return popup;
}

/**
 * Popup内の全分類が可視な名前付きgroupとして公開されることを確認する。
 *
 * @param listboxCanvas Portal内listboxへ限定したTesting Library query。
 * @param groups 公式順序と可視分類名を持つ固定group一覧。
 * @returns 全groupの表示確認が完了した時点で解決するPromise。
 */
async function expectSelectGroupsVisible(
  listbox: HTMLElement,
  groups: readonly SelectOptionGroup[]
): Promise<void> {
  const listboxCanvas = within(listbox);
  for (const group of groups) {
    await expect(listboxCanvas.getByRole('group', { name: group.label })).toBeVisible();
  }
}

/**
 * Select の終了 animation が完了し、Portal 内の listbox が除去されたことを検証する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns listbox が存在しなくなった時点で解決する Promise。
 */
async function expectSelectClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間を仮定せず、既存 transition と Portal のライフサイクルが完了するまで条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(documentBody.queryByRole('listbox')).not.toBeInTheDocument();
  });
}

/** 公式 Select の実用途と状態を、比較表ではなく個別 Story として CSF3 へ登録する。 */
const meta = {
  title: 'Forms/Select',
  component: Select,
  subcomponents: {
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
  },
  args: {
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Base UI Select の Default、Groups、Disabled、Invalid、Scrollable を、既存 Field と Select の公開契約だけで確認します。light・dark と 390px の Storybook test project でも同じ構成を使用します。',
      },
    },
    layout: 'centered',
  },
  render: createSelectRenderer(selectExamples.default, fruitOptions, renderFruitSelectItems),
} satisfies Meta<SelectStoryArgs>;

/** Storybook が Select catalog の型、Docs、interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 Default／With Field 構成で fruit を pointer と keyboard の双方から選択する。 */
export const Default: Story = {
  play: async ({ args, canvasElement, step }) => {
    const example = selectExamples.default;
    const trigger = await getExampleSelectTrigger(canvasElement, example);

    await step('公式 placeholder を表示し、pointer で Apple を選択する', async () => {
      // 未選択の表示と閉状態を確認してから、利用者と同じ pointer 操作で Popup を開く。
      await expect(trigger).toHaveTextContent(example.placeholder);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      const listbox = await openSelectListbox(trigger, canvasElement);
      const firstOption = within(listbox).getByRole('option', {
        name: fruitOptions[0].label,
      });
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(firstOption).toHaveAccessibleName(fruitOptions[0].label);

      // pointer で Apple を選択し、値変更、Popup 閉鎖、Trigger への focus 復帰を一続きで保証する。
      await userEvent.click(firstOption);
      await expect(args.onValueChange).toHaveBeenCalledWith(
        fruitOptions[0].value,
        expect.anything()
      );
      await expect(trigger).toHaveTextContent(fruitOptions[0].label);
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(trigger).toHaveFocus();
    });

    await step('keyboard で開いて Pineapple を選択する', async () => {
      // focus が戻った Trigger から Enter で開き、pointer に依存しない開放経路を確認する。
      await userEvent.keyboard('{Enter}');
      const listbox = await findSelectListbox(canvasElement);
      const listboxCanvas = within(listbox);
      const selectedOption = listboxCanvas.getByRole('option', {
        name: fruitOptions[0].label,
      });
      const lastOption = listboxCanvas.getByRole('option', {
        name: fruitOptions[4].label,
      });
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

      // keyboard open が選択済み Apple へ focus を移し終えてから、実利用と同じ次のキー操作へ進む。
      await waitFor(() => expect(selectedOption).toHaveFocus());

      // End で Pineapple へ focus を移し、同期完了後に Enter で選択して Popup を閉じる標準操作を検証する。
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(lastOption).toHaveFocus());
      await userEvent.keyboard('{Enter}');
      await expect(args.onValueChange).toHaveBeenLastCalledWith(
        fruitOptions[4].value,
        expect.anything()
      );
      await expect(trigger).toHaveTextContent(fruitOptions[4].label);
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(trigger).toHaveFocus();
    });
  },
};

/** 公式 Item Aligned Example と同じ Banana の初期選択を Trigger と Item の双方で示す。 */
export const SelectedValue: Story = {
  render: createSelectRenderer(selectExamples.selected, fruitOptions, renderFruitSelectItems, {
    defaultValue: fruitOptions[1].value,
  }),
  play: async ({ canvasElement }) => {
    const example = selectExamples.selected;
    const trigger = await getExampleSelectTrigger(canvasElement, example);

    // Root の Banana 値を公式表示名へ解決し、Popup 内でも同じ Item だけを選択済みにする。
    await expect(trigger).toHaveTextContent(fruitOptions[1].label);
    const selectedOption = within(await openSelectListbox(trigger, canvasElement)).getByRole(
      'option',
      {
        name: fruitOptions[1].label,
      }
    );
    await expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  },
};

/** 公式 Groups Example の Fruits／Vegetables、Label、Separator から produce を選択する。 */
export const Groups: Story = {
  render: createSelectRenderer(selectExamples.groups, produceOptions, () =>
    renderSelectGroups(produceGroups, false, true)
  ),
  play: async ({ canvasElement, step }) => {
    const example = selectExamples.groups;
    const trigger = await getExampleSelectTrigger(canvasElement, example);
    const listbox = await openSelectListbox(trigger, canvasElement);
    const listboxCanvas = within(listbox);

    await step('公式分類と Separator を同じ Popup 内へ表示する', async () => {
      // GroupLabel が各 Group の名前として解決され、分類間に Separator が一つだけ存在することを確認する。
      await expectSelectGroupsVisible(listbox, produceGroups);
      await expect(listbox.querySelectorAll('[data-slot="select-separator"]')).toHaveLength(1);
      await expect(listboxCanvas.getAllByRole('option')).toHaveLength(produceOptions.length);
    });

    await step('Vegetables から Carrot を選択する', async () => {
      // pointer で実際の produce を選択し、分類内の値が Trigger の公式表示名へ戻ることを確認する。
      const carrot = listboxCanvas.getByRole('option', { name: 'Carrot' });
      await userEvent.click(carrot);
      await expect(trigger).toHaveTextContent('Carrot');
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveFocus();
    });
  },
};

/** 公式 Disabled Example と同じ Root 全体の操作不可状態を可視ラベル付きで示す。 */
export const Disabled: Story = {
  render: createSelectRenderer(selectExamples.disabled, fruitOptions, renderFruitSelectItems, {
    disabled: true,
  }),
  play: async ({ canvasElement, step }) => {
    const example = selectExamples.disabled;
    const trigger = await getExampleSelectTrigger(canvasElement, example);

    await step('disabled Trigger は pointer で Popup を開かない', async () => {
      // ネイティブ button の disabled 契約を確認し、pointer 操作後も Portal が生成されないことを保証する。
      await expect(trigger).toBeDisabled();
      await userEvent.click(trigger);
      await expect(
        within(canvasElement.ownerDocument.body).queryByRole('listbox')
      ).not.toBeInTheDocument();
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
    });

    await step('disabled Trigger は keyboard の Tab 順序へ入らない', async () => {
      // 無効状態が opacity だけでなく focus 移動にも反映され、選択操作の対象にならないことを確認する。
      await userEvent.tab();
      await expect(trigger).not.toHaveFocus();
    });
  },
};

/** 公式 Invalid Example の Field、aria-invalid、具体的なエラー回復文を一つの項目で示す。 */
export const Invalid: Story = {
  render: createSelectRenderer(selectExamples.invalid, fruitOptions, renderFruitSelectItems, {
    errorMessage: selectExamples.invalid.error,
    invalid: true,
  }),
  play: async ({ canvasElement, step }) => {
    const example = selectExamples.invalid;
    const trigger = await getExampleSelectTrigger(canvasElement, example);
    const alert = within(canvasElement).getByRole('alert');

    await step('invalid Trigger と FieldError をアクセシブルに関連付ける', async () => {
      // destructive の視覚状態に加え、ARIA error message と alert で同じ修正内容を通知する。
      await expect(trigger).toHaveAttribute('aria-invalid', 'true');
      await expect(trigger).toHaveAccessibleErrorMessage(example.error);
      await expect(trigger).toBeEnabled();
      await expect(alert).toHaveTextContent(example.error);
    });

    await step('invalid 状態でも keyboard focus を受け取る', async () => {
      // validation error は操作不可を意味しないため、Tab で Trigger へ到達できることを確認する。
      await userEvent.tab();
      await expect(trigger).toHaveFocus();

      // 既存 focus-visible ring が light／dark の双方で実際の box-shadow として描画されることを確認する。
      const focusedStyle = trigger.ownerDocument.defaultView?.getComputedStyle(trigger);
      await expect(focusedStyle).toBeDefined();
      await expect(focusedStyle?.boxShadow).not.toBe('none');
    });
  },
};

/** 公式 Scrollable Example の timezone 全分類を、上下スクロール操作付きで示す。 */
export const Scrollable: Story = {
  render: createSelectRenderer(
    selectExamples.scrollable,
    timeZoneOptions,
    renderTimeZoneSelectItems,
    { scrollable: true }
  ),
  play: async ({ canvasElement, step }) => {
    const example = selectExamples.scrollable;
    const trigger = await getExampleSelectTrigger(canvasElement, example);

    await step('公式 timezone placeholder を 390px 内へ保持する', async () => {
      // Trigger は Field 幅へ追従し、狭い viewport でも自身の領域から横方向へはみ出さないことを確認する。
      await expect(trigger).toHaveTextContent(example.placeholder);
      await expect(trigger).toHaveClass('w-full', 'min-w-0');
      await expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
    });

    await step('Popup を viewport 内へ開き、公式の地域分類を表示する', async () => {
      // pointer で timezone Popup を開き、分類と候補数を公式データのまま公開する。
      const listbox = await openSelectListbox(trigger, canvasElement);
      const listboxCanvas = within(listbox);
      await expectSelectGroupsVisible(listbox, timeZoneGroups);
      await expect(listboxCanvas.getAllByRole('option')).toHaveLength(timeZoneOptions.length);

      // Popup の実測境界が viewport を越えず、長い timezone 名でも 390px の横幅を守ることを保証する。
      const popup = getSelectContent(canvasElement);
      const popupRect = popup.getBoundingClientRect();
      const viewportWidth = canvasElement.ownerDocument.documentElement.clientWidth;
      await expect(popupRect.left).toBeGreaterThanOrEqual(0);
      await expect(popupRect.right).toBeLessThanOrEqual(viewportWidth);

      // 初期位置では下方向の公開 ScrollDownArrow が表示され、一覧に未表示の続きがあることを伝える。
      await waitFor(async () => {
        await expect(popup.querySelector('[data-slot="select-scroll-down-button"]')).toBeVisible();
      });

      // Escape で選択値を変えずに閉じ、Trigger へ focus と公式 placeholder が戻るまでを確認する。
      await userEvent.keyboard('{Escape}');
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveTextContent(example.placeholder);
    });
  },
};
