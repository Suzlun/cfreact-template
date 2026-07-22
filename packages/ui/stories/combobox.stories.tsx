import { Fragment } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@cfreact-template/ui/components/combobox';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式 Basic・Multiple 例で共通利用する、固定順序の framework 候補。 */
const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'] as const;

/** 公式 Groups 例と同じ Group・Label・Collection 構成へ渡す、timezone 分類の契約。 */
interface TimezoneGroup {
  /** ComboboxLabel と React key の双方に利用する、一意な分類名。 */
  readonly value: string;
  /** ComboboxCollection が固定順序のまま描画する分類内の timezone 候補。 */
  readonly items: readonly string[];
}

/** 公式 Groups 例の分類名・候補・順序をそのまま公開する timezone 候補。 */
const timezones = [
  {
    value: 'Americas',
    items: [
      '(GMT-5) New York',
      '(GMT-8) Los Angeles',
      '(GMT-6) Chicago',
      '(GMT-5) Toronto',
      '(GMT-8) Vancouver',
      '(GMT-3) São Paulo',
    ],
  },
  {
    value: 'Europe',
    items: [
      '(GMT+0) London',
      '(GMT+1) Paris',
      '(GMT+1) Berlin',
      '(GMT+1) Rome',
      '(GMT+1) Madrid',
      '(GMT+1) Amsterdam',
    ],
  },
  {
    value: 'Asia/Pacific',
    items: [
      '(GMT+9) Tokyo',
      '(GMT+8) Shanghai',
      '(GMT+8) Singapore',
      '(GMT+4) Dubai',
      '(GMT+11) Sydney',
      '(GMT+9) Seoul',
    ],
  },
] as const satisfies readonly TimezoneGroup[];

/** disabled item の公開 ARIA 契約を Groups 構成内で検証する固定候補。 */
const disabledTimezone = timezones[2].items[3];

/** 公式 Popup 例が Item の識別・表示・既定値へ利用する country 契約。 */
interface Country {
  /** Item と React key が同じ country を識別する短縮コード。 */
  readonly code: string;
  /** Root が選択値として保持する機械可読な country 名。 */
  readonly value: string;
  /** Item と Trigger に表示する利用者向け country 名。 */
  readonly label: string;
  /** 公式データが country の地域分類として保持する値。 */
  readonly continent: string;
}

/** 公式 Popup 例と同じ既定項目と country 候補を固定順序で公開する。 */
const countries = [
  { code: '', value: '', continent: '', label: 'Select country' },
  { code: 'ar', value: 'argentina', label: 'Argentina', continent: 'South America' },
  { code: 'au', value: 'australia', label: 'Australia', continent: 'Oceania' },
  { code: 'br', value: 'brazil', label: 'Brazil', continent: 'South America' },
  { code: 'ca', value: 'canada', label: 'Canada', continent: 'North America' },
  { code: 'cn', value: 'china', label: 'China', continent: 'Asia' },
  { code: 'co', value: 'colombia', label: 'Colombia', continent: 'South America' },
  { code: 'eg', value: 'egypt', label: 'Egypt', continent: 'Africa' },
  { code: 'fr', value: 'france', label: 'France', continent: 'Europe' },
  { code: 'de', value: 'germany', label: 'Germany', continent: 'Europe' },
  { code: 'it', value: 'italy', label: 'Italy', continent: 'Europe' },
  { code: 'jp', value: 'japan', label: 'Japan', continent: 'Asia' },
  { code: 'ke', value: 'kenya', label: 'Kenya', continent: 'Africa' },
  { code: 'mx', value: 'mexico', label: 'Mexico', continent: 'North America' },
  { code: 'nz', value: 'new-zealand', label: 'New Zealand', continent: 'Oceania' },
  { code: 'ng', value: 'nigeria', label: 'Nigeria', continent: 'Africa' },
  { code: 'za', value: 'south-africa', label: 'South Africa', continent: 'Africa' },
  { code: 'kr', value: 'south-korea', label: 'South Korea', continent: 'Asia' },
  { code: 'gb', value: 'united-kingdom', label: 'United Kingdom', continent: 'Europe' },
  {
    code: 'us',
    value: 'united-states',
    label: 'United States',
    continent: 'North America',
  },
] as const satisfies readonly Country[];

/** 展開・選択済み ARIA 属性を複数の interaction check で比較する標準文字列。 */
const ariaTrue = 'true';

/** Item の視覚的 checkmark と同じ選択状態を検証する ARIA 属性名。 */
const ariaSelectedAttribute = 'aria-selected';

/** framework 候補の List と interaction check が共有する公開名。 */
const frameworkOptionsLabel = 'Framework options';

/** country 候補の dialog・List・interaction check が共有する公開名。 */
const countryOptionsLabel = 'Country options';

/** timezone 候補の List と interaction check が共有する公開名。 */
const timezoneOptionsLabel = 'Timezone options';

/** framework selector の非制御初期値、入力名、Clear 表示を指定する契約。 */
interface FrameworkComboboxProps {
  /** Input が支援技術へ公開する一意な名前。 */
  readonly inputLabel: string;
  /** 公式例の非制御 Root が初期表示する任意の framework。 */
  readonly defaultValue?: (typeof frameworks)[number];
  /** 選択済みのときに公開 Clear 操作を表示するかを指定する。 */
  readonly showClear?: boolean;
}

/**
 * 公式 Basic 構成を非制御 Root で描画し、検索・選択・解除を同じ契約で提供する。
 *
 * @param props Input のアクセシブルネーム、初期値、Clear 表示条件。
 * @returns framework 候補を検索して一件選択できる Combobox。
 */
function FrameworkCombobox({
  inputLabel,
  defaultValue,
  showClear = false,
}: FrameworkComboboxProps) {
  return (
    <Combobox items={frameworks} defaultValue={defaultValue}>
      {/* 公式 Basic と同様に Input 自体を anchor とし、内蔵 Trigger と Clear を状態に応じて表示する。 */}
      <ComboboxInput
        aria-label={inputLabel}
        className="w-64 max-w-full"
        placeholder="Select a framework"
        showClear={showClear}
      />
      <ComboboxContent>
        {/* Empty は常時マウントし、Base UI が絞り込み結果なしのときだけ可視化する。 */}
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        {/* Content は presentation になるため、候補一覧の名前は実際の listbox へ直接付与する。 */}
        <ComboboxList aria-label={`${inputLabel} options`}>
          {(framework: (typeof frameworks)[number]) => (
            <ComboboxItem key={framework} value={framework}>
              {framework}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * 公式 Popup 構成どおり、Button trigger と Popup 内の検索 Input で country を選択する。
 *
 * @returns 非制御の既定値を Trigger 内へ表示する country selector。
 */
function CountryPopupCombobox() {
  return (
    <Combobox items={countries} defaultValue={countries[0]}>
      {/* role=combobox は author-provided name を要するため、Value の可視文字列と同じ操作名を Trigger へ明示する。 */}
      <ComboboxTrigger
        aria-label="Select country"
        render={
          <Button className="w-64 max-w-full justify-between font-normal" variant="outline" />
        }
      >
        <ComboboxValue />
      </ComboboxTrigger>
      <ComboboxContent aria-label={countryOptionsLabel}>
        {/* 外部 Trigger を使うため、検索 Input は Popup 内へ移して二重 Trigger を表示しない。 */}
        <ComboboxInput aria-label="Search countries" placeholder="Search" showTrigger={false} />
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        {/* dialog と、その内部で候補を所有する listbox の双方を同じ文脈名で識別可能にする。 */}
        <ComboboxList aria-label={countryOptionsLabel}>
          {(country: Country) => (
            <ComboboxItem key={country.code} value={country}>
              {country.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * 公式 Groups 構成へ timezone 分類、分類間 Separator、disabled item を組み合わせる。
 *
 * @returns 検索可能な三分類と一件の無効候補を持つ非制御 Combobox。
 */
function GroupedTimezoneCombobox() {
  return (
    <Combobox items={timezones}>
      <ComboboxInput
        aria-label="Timezone"
        className="w-64 max-w-full"
        placeholder="Select a timezone"
      />
      <ComboboxContent>
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        {/* presentation の Content ではなく、timezone option を所有する listbox 自体へ名前を渡す。 */}
        <ComboboxList aria-label={timezoneOptionsLabel}>
          {(group: TimezoneGroup, groupIndex: number) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              {/* Collection が Root の filter 結果を受け取り、分類内の Item と checkmark 状態を描画する。 */}
              <ComboboxCollection>
                {(timezone: string) => (
                  <ComboboxItem
                    key={timezone}
                    disabled={timezone === disabledTimezone}
                    value={timezone}
                  >
                    {timezone}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
              {/* 公式 Groups 例どおり、末尾以外の Group の後だけを Separator で区切る。 */}
              {groupIndex < timezones.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * 公式 Multiple 構成どおり、Value の render 値を Chip と検索 Input へ公開する。
 *
 * @returns 初期選択一件へ候補を追加・解除できる複数選択 Combobox。
 */
function MultipleFrameworkCombobox() {
  // Chips と Content が同じ幅・位置基準を共有できるよう、公開 anchor Hook を一度だけ生成する。
  const anchor = useComboboxAnchor();

  return (
    <Combobox autoHighlight defaultValue={[frameworks[0]]} items={frameworks} multiple>
      <ComboboxChips ref={anchor} className="w-full max-w-xs">
        <ComboboxValue>
          {(values: string[]) => (
            <Fragment>
              {/* render が受け取る各選択値を、既定の accessible remove 操作を持つ Chip として描画する。 */}
              {values.map((framework) => (
                <ComboboxChip key={framework}>{framework}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-label="Search frameworks" />
            </Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        {/* Chips 外部 Input が制御する候補一覧を、実際の listbox 上の公開名で特定できるようにする。 */}
        <ComboboxList aria-label={frameworkOptionsLabel}>
          {(framework: (typeof frameworks)[number]) => (
            <ComboboxItem key={framework} value={framework}>
              {framework}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * Portal 内の候補一覧を Story canvas と同じ document から取得する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument の特定に利用する。
 * @param accessibleName List が支援技術へ公開する、候補一覧固有の名前。
 * @returns 表示された listbox が見つかった時点で解決する Promise。
 */
async function findListbox(
  canvasElement: HTMLElement,
  accessibleName: string
): Promise<HTMLElement> {
  // Popup は Portal へ描画されるため、canvas 内ではなく同じ document の body を検索する。
  const listbox = await within(canvasElement.ownerDocument.body).findByRole('listbox', {
    name: accessibleName,
  });

  await waitFor(async () => {
    // 開始トランジションが終わるまで待ち、操作と可視性検証が透明な中間状態を読まないようにする。
    await expect(listbox).toBeVisible();
  });

  return listbox;
}

/**
 * 終了トランジション後に listbox が公開ツリーから除去された状態を待つ。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns 公開 role の listbox が存在しなくなった時点で解決する Promise。
 */
async function expectListboxClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間や生成 DOM 属性へ依存せず、利用者へ公開される role の消滅を終了状態として待つ。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(documentBody.queryByRole('listbox')).not.toBeInTheDocument();
  });
}

/** 公式 Basic・Multiple・Groups・Popup pattern と既存の操作契約を CSF3 catalog へ登録する。 */
const meta = {
  title: 'Forms/Combobox',
  component: Combobox,
  subcomponents: {
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxCollection,
    ComboboxEmpty,
    ComboboxSeparator,
    ComboboxChips,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxTrigger,
    ComboboxValue,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式の framework Basic・Clear・Multiple、timezone Groups、country Popup 構成で、disabled・filter・accessibility 契約を確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Combobox>;

/** Storybook が Combobox catalog の Docs と interaction checks を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 Basic selector で pointer 選択、checkmark、keyboard filter、非制御値を検証する。 */
export const SingleSelect: Story = {
  render: () => <FrameworkCombobox inputLabel="Framework" />,
  play: async ({ canvasElement, step }) => {
    // Input は canvas、候補一覧は Portal にあるため、操作対象ごとに検索範囲を分離する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Framework' });

    await step('pointer で開いて framework を選択する', async () => {
      // 内蔵 Trigger を持つ Input をクリックし、公式候補と展開 ARIA 状態を確認する。
      await userEvent.click(input);
      const listbox = await findListbox(canvasElement, frameworkOptionsLabel);
      await expect(input).toHaveAttribute('aria-expanded', ariaTrue);
      await expect(within(listbox).getAllByRole('option')).toHaveLength(frameworks.length);

      // Item の pointer 選択が Input 値へ反映されることを、利用者に表示される文字列で確認する。
      await userEvent.click(within(listbox).getByRole('option', { name: 'Next.js' }));
      await expect(input).toHaveValue('Next.js');
      await expectListboxClosed(canvasElement);

      // 再展開した Item の aria-selected は、内蔵 ItemIndicator の checkmark と同じ選択状態を表す。
      await userEvent.click(input);
      const reopenedListbox = await findListbox(canvasElement, frameworkOptionsLabel);
      await expect(
        within(reopenedListbox).getByRole('option', { name: 'Next.js' })
      ).toHaveAttribute(ariaSelectedAttribute, ariaTrue);
      await userEvent.keyboard('{Escape}');
      await expectListboxClosed(canvasElement);
    });

    await step('keyboard で解除し、絞り込み、framework を選択する', async () => {
      // 選択値を全選択して削除し、keyboard だけで値を空へ戻す。
      await userEvent.click(input);
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
      await expect(input).toHaveValue('');

      // ArrowDown で展開して文字列を入力し、Base UI の filter が一致候補だけを残すことを確認する。
      await userEvent.keyboard('{ArrowDown}');
      const listbox = await findListbox(canvasElement, frameworkOptionsLabel);
      await userEvent.type(input, 'Nuxt');
      await expect(within(listbox).getByRole('option', { name: 'Nuxt.js' })).toBeVisible();
      await expect(
        within(listbox).queryByRole('option', { name: 'Next.js' })
      ).not.toBeInTheDocument();

      // 絞り込み後の一件を ArrowDown で強調し、Enter で非制御値へ確定する。
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect(input).toHaveValue('Nuxt.js');
      await expectListboxClosed(canvasElement);
    });
  },
};

/** 公式 Popup selector で、Trigger、Popup 内検索、検索結果なしの通知を検証する。 */
export const SearchableEmptyState: Story = {
  render: () => <CountryPopupCombobox />,
  play: async ({ canvasElement, step }) => {
    // Button trigger は canvas、Popup 内 Input と Empty は Portal にあるため検索範囲を分離する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Select country' });

    await step('Popup 内検索で empty state を表示する', async () => {
      // Trigger の pointer 操作で開き、Popup 内 Input が検索用途の名前を公開することを確認する。
      await userEvent.click(trigger);
      const listbox = await findListbox(canvasElement, countryOptionsLabel);
      const documentBody = within(canvasElement.ownerDocument.body);
      const searchInput = documentBody.getByRole('combobox', { name: 'Search countries' });
      await expect(trigger).toHaveAttribute('aria-expanded', ariaTrue);

      // 存在しない country を入力し、可視 option がなく Empty の説明だけが表示されることを確認する。
      await userEvent.type(searchInput, 'Atlantis');
      await expect(documentBody.getByText('No items found.')).toBeVisible();
      await expect(within(listbox).queryAllByRole('option')).toHaveLength(0);
    });
  },
};

/** 公式 Basic selector の Clear 操作が、選択値を安全に解除することを検証する。 */
export const ClearSelection: Story = {
  render: () => (
    <FrameworkCombobox defaultValue={frameworks[0]} inputLabel="Clear framework" showClear />
  ),
  play: async ({ canvasElement, step }) => {
    // Clear は公開 Input の showClear により描画されるため、利用者へ公開される操作名で特定する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Clear framework' });
    const clearButton = canvas.getByRole('button', { name: 'Clear selection' });

    await step('Clear 操作で選択値を解除する', async () => {
      await expect(input).toHaveValue('Next.js');
      await userEvent.click(clearButton);
      await expect(input).toHaveValue('');
    });
  },
};

/** 公式 Groups pattern の分類・Separator・disabled item と有効候補の pointer 選択を検証する。 */
export const GroupedAndDisabledOption: Story = {
  render: () => <GroupedTimezoneCombobox />,
  play: async ({ canvasElement, step }) => {
    // 可視 Input のアクセシブルネームから主要操作を一意に取得する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Timezone' });

    await step('分類と disabled timezone を表示する', async () => {
      await userEvent.click(input);
      const listbox = await findListbox(canvasElement, timezoneOptionsLabel);
      const listboxCanvas = within(listbox);
      const disabledOption = listboxCanvas.getByRole('option', { name: disabledTimezone });

      // GroupLabel、分類間 Separator、disabled option の ARIA 状態を同じ Popup 内で確認する。
      await expect(listboxCanvas.getByText('Americas')).toBeVisible();
      await expect(listboxCanvas.getByText('Europe')).toBeVisible();
      await expect(listboxCanvas.getByText('Asia/Pacific')).toBeVisible();
      await expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    });

    await step('有効 timezone を pointer で選択する', async () => {
      // 同じ分類一覧の有効 Item を選択し、Input に表示される timezone を確認する。
      const listbox = await findListbox(canvasElement, timezoneOptionsLabel);
      await userEvent.click(within(listbox).getByRole('option', { name: '(GMT+0) London' }));
      await expect(input).toHaveValue('(GMT+0) London');
      await expectListboxClosed(canvasElement);
    });
  },
};

/** 公式 Multiple pattern の非制御 Chips、選択 checkmark、候補追加を検証する。 */
export const MultipleWithChips: Story = {
  render: () => <MultipleFrameworkCombobox />,
  play: async ({ canvasElement, step }) => {
    // Chips と ChipsInput は canvas、候補一覧は Portal にあるため、選択前後で検索範囲を分ける。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Search frameworks' });

    await step('非制御の初期値を Chip と選択状態で表示する', async () => {
      // 公式 defaultValue の一件が Chip として利用者へ表示されることを確認する。
      await expect(canvas.getByText('Next.js')).toBeVisible();

      // Popup の aria-selected は各 Item の内蔵 checkmark と同じ複数選択状態を支援技術へ公開する。
      await userEvent.click(input);
      const listbox = await findListbox(canvasElement, frameworkOptionsLabel);
      await expect(within(listbox).getByRole('option', { name: 'Next.js' })).toHaveAttribute(
        ariaSelectedAttribute,
        ariaTrue
      );
      await expect(within(listbox).getByRole('option', { name: 'Nuxt.js' })).toHaveAttribute(
        ariaSelectedAttribute,
        'false'
      );
    });

    await step('候補を pointer で選択して Chip を追加する', async () => {
      // Multiple は Popup を開いたまま選択を追加し、非制御の選択値と Chip 表示を同期する。
      const listbox = await findListbox(canvasElement, frameworkOptionsLabel);
      await userEvent.click(within(listbox).getByRole('option', { name: 'Nuxt.js' }));
      await expect(canvas.getByText('Nuxt.js')).toBeVisible();
      await expect(within(listbox).getByRole('option', { name: 'Nuxt.js' })).toHaveAttribute(
        ariaSelectedAttribute,
        ariaTrue
      );
    });
  },
};
