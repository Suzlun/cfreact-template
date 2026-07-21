import { Fragment } from 'react';
import { expect, within } from 'storybook/test';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cfreact-template/ui/components/breadcrumb';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent, ReactNode } from 'react';

/**
 * Story 内の一つの階層を表す固定データ。
 *
 * `kind` で遷移可能な階層、省略表示、現在地を区別し、描画側が Breadcrumb の
 * 各 subcomponent を正しい semantics で選択できるようにする。
 */
type BreadcrumbEntry =
  | {
      /** Story 内で階層を安定して識別する固定 ID。 */
      id: string;
      /** 遷移可能な過去の階層であることを示す識別子。 */
      kind: 'link';
      /** 利用者へ表示し、リンクのアクセシブルネームにもなる階層名。 */
      label: string;
      /** 外部遷移を発生させない Story 内フラグメント URL。 */
      href: `#${string}`;
    }
  | {
      /** Story 内で省略位置を安定して識別する固定 ID。 */
      id: string;
      /** 中間階層を省略していることを示す識別子。 */
      kind: 'ellipsis';
    }
  | {
      /** Story 内で現在地を安定して識別する固定 ID。 */
      id: string;
      /** 遷移しない現在地であることを示す識別子。 */
      kind: 'page';
      /** 利用者へ表示し、現在地のアクセシブルネームにもなる階層名。 */
      label: string;
    };

/** Breadcrumb の組み合わせ例へ渡す、Story 専用の固定描画契約。 */
interface BreadcrumbCatalogProps {
  /** 先頭から現在地までの表示順を保持する固定階層データ。 */
  entries: readonly BreadcrumbEntry[];
  /** 未指定時は既定 Chevron、指定時は同じ値を全区切りへ表示する。 */
  separator?: ReactNode;
}

/** 基本的な三階層と現在地を、既定 Separator で確認する固定データ。 */
const defaultEntries = [
  { href: '#breadcrumb-home', id: 'home', kind: 'link', label: 'ホーム' },
  { href: '#breadcrumb-components', id: 'components', kind: 'link', label: 'コンポーネント' },
  { id: 'breadcrumb', kind: 'page', label: 'Breadcrumb' },
] as const satisfies readonly BreadcrumbEntry[];

/** Ellipsis とカスタム Separator を含む全 subcomponent 確認用の固定データ。 */
const allSubcomponentEntries = [
  { href: '#breadcrumb-catalog-home', id: 'catalog-home', kind: 'link', label: 'ホーム' },
  { id: 'catalog-ellipsis', kind: 'ellipsis' },
  { href: '#breadcrumb-forms', id: 'forms', kind: 'link', label: 'フォーム' },
  { id: 'input-content', kind: 'page', label: '入力内容' },
] as const satisfies readonly BreadcrumbEntry[];

/** 狭い表示幅で複数行へ折り返す、深い階層と長い現在地の固定データ。 */
const longHierarchyEntries = [
  { href: '#breadcrumb-mobile-home', id: 'mobile-home', kind: 'link', label: 'ホーム' },
  { href: '#breadcrumb-management', id: 'management', kind: 'link', label: '管理' },
  {
    href: '#breadcrumb-organization-settings',
    id: 'organization-settings',
    kind: 'link',
    label: '組織設定',
  },
  {
    href: '#breadcrumb-members-and-permissions',
    id: 'members-and-permissions',
    kind: 'link',
    label: 'メンバーと権限',
  },
  {
    id: 'invited-member-access',
    kind: 'page',
    label: '招待済みメンバーのアクセス権限を確認',
  },
] as const satisfies readonly BreadcrumbEntry[];

/**
 * Story のリンク操作による URL 変更を防ぎ、外部・内部を問わず実 navigation を発生させない。
 *
 * @param event BreadcrumbLink が受け取ったネイティブなクリックイベント。
 * @returns 戻り値はなく、既定のアンカー遷移だけを抑止する。
 */
function preventBreadcrumbNavigation(event: MouseEvent<HTMLAnchorElement>): void {
  // アンカーとしての意味とキーボード到達性を保ちながら、Story canvas の現在位置は変更しない。
  event.preventDefault();
}

/**
 * 固定データの種類に対応する Breadcrumb subcomponent を一つだけ描画する。
 *
 * @param props.entry 描画対象となる一階層分の固定データ。
 * @returns Link、Ellipsis、Page のいずれか一つ。
 */
function BreadcrumbEntryContent({ entry }: { entry: BreadcrumbEntry }) {
  if (entry.kind === 'link') {
    // 過去の階層は実アンカーの semantics を維持し、共有ハンドラーで Story 上の遷移だけを止める。
    return (
      <BreadcrumbLink href={entry.href} onClick={preventBreadcrumbNavigation}>
        {entry.label}
      </BreadcrumbLink>
    );
  }

  if (entry.kind === 'ellipsis') {
    // 省略記号は BreadcrumbEllipsis の既定 icon と支援技術向け非表示契約をそのまま使用する。
    return <BreadcrumbEllipsis data-testid="breadcrumb-ellipsis" />;
  }

  // 最後の階層は遷移先を持たせず、BreadcrumbPage の aria-current と disabled semantics を使用する。
  return <BreadcrumbPage>{entry.label}</BreadcrumbPage>;
}

/**
 * 固定階層を Breadcrumb の完全な nav・list・item 構造へ変換する Story 専用コンポーネント。
 *
 * @param props.entries 表示順を保持した固定階層データ。
 * @param props.separator 全階層間へ適用する任意の区切り表示。
 * @returns 各階層間に Separator を置いた Breadcrumb navigation。
 */
function BreadcrumbCatalog({ entries, separator }: BreadcrumbCatalogProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* 固定配列の順序を保ち、各 entry と直後の Separator を同じ Fragment で管理する。 */}
        {entries.map((entry, index) => (
          <Fragment key={entry.id}>
            {/* 各階層を list item として公開し、play 関数から表示順と折り返し位置を特定可能にする。 */}
            <BreadcrumbItem data-testid={`breadcrumb-entry-${entry.id}`}>
              <BreadcrumbEntryContent entry={entry} />
            </BreadcrumbItem>

            {/* 現在地の後ろには不要な区切りを置かず、隣接する階層間だけを視覚的に分離する。 */}
            {index < entries.length - 1 ? (
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            ) : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Breadcrumb の全 subcomponent と固定表示条件を定義する CSF3 metadata。
 *
 * Controls は無効化し、各 Story が現在地、区切り、省略、狭幅折り返しの意図した状態を
 * 常に同じデータで再現できるようにする。
 */
const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  subcomponents: {
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '階層 navigation の基本構造、現在地、区切り、省略表示、長い階層のモバイル折り返しを固定データで確認します。',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

/** Storybook が Breadcrumb catalog を構築するための既定 metadata。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 既定 Chevron Separator と現在地を含む、基本的な三階層の Breadcrumb。 */
export const Default: Story = {
  render: () => <BreadcrumbCatalog entries={defaultEntries} />,
};

/**
 * カスタム Separator と Ellipsis を含め、全 subcomponent と nav semantics を検証する Breadcrumb。
 */
export const AllSubcomponents: Story = {
  render: () => <BreadcrumbCatalog entries={allSubcomponentEntries} separator="/" />,
  play: async ({ canvasElement, step }) => {
    // Story canvas に検索範囲を限定し、Storybook 自体の navigation を誤って取得しないようにする。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: 'breadcrumb' });
    const navigationContent = within(navigation);

    await step('nav と ordered list の Breadcrumb 構造を公開する', async () => {
      // Breadcrumb root が暗黙の navigation role と既定のアクセシブルネームを保持することを確認する。
      await expect(navigation.tagName).toBe('NAV');
      await expect(navigation).toHaveAttribute('aria-label', 'breadcrumb');

      // BreadcrumbList が階層順を表す ordered list として支援技術へ公開されることを確認する。
      const list = navigationContent.getByRole('list');
      await expect(list.tagName).toBe('OL');
    });

    await step('現在地と遷移可能な過去階層を区別する', async () => {
      // 現在地はリンクとして命名されつつ、遷移不可かつ現在ページであることを ARIA で示す。
      const currentPage = navigationContent.getByRole('link', { name: '入力内容' });
      await expect(currentPage.tagName).toBe('SPAN');
      await expect(currentPage).toHaveAttribute('aria-current', 'page');
      await expect(currentPage).toHaveAttribute('aria-disabled', 'true');

      // 過去階層の実アンカーは Story 内フラグメントだけを指し、外部 URL を一切持たないことを確認する。
      const anchors = navigation.querySelectorAll('a');
      await expect(anchors).toHaveLength(2);
      for (const anchor of anchors) {
        await expect(anchor.getAttribute('href')).toMatch(/^#/);
      }
    });

    await step('Separator と Ellipsis を読み上げ順から除外する', async () => {
      // 各階層間の Separator が presentation role と aria-hidden を持つことを全件確認する。
      const separators = navigation.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separators).toHaveLength(allSubcomponentEntries.length - 1);
      for (const separator of separators) {
        await expect(separator).toHaveAttribute('role', 'presentation');
        await expect(separator).toHaveAttribute('aria-hidden', 'true');
      }

      // Ellipsis も視覚表示だけに限定し、支援技術へ重複した階層名として公開しないことを確認する。
      const ellipsis = canvas.getByTestId('breadcrumb-ellipsis');
      await expect(ellipsis).toHaveAttribute('role', 'presentation');
      await expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

/**
 * 深い階層と長い現在地をモバイル相当の狭幅へ収め、複数行の折り返しを検証する Breadcrumb。
 */
export const LongHierarchyMobileWrapping: Story = {
  render: () => (
    // 16rem をモバイル相当の確認幅とし、さらに狭い canvas では利用可能幅を超えないよう制限する。
    <div className="w-64 max-w-full" data-testid="mobile-breadcrumb-frame">
      <BreadcrumbCatalog entries={longHierarchyEntries} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 狭幅 frame と Breadcrumb 内部を取得し、表示位置と横方向の収まりをブラウザ寸法で検証する。
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('mobile-breadcrumb-frame');
    const navigation = canvas.getByRole('navigation', { name: 'breadcrumb' });
    const list = within(navigation).getByRole('list');
    const firstItem = canvas.getByTestId('breadcrumb-entry-mobile-home');
    const currentItem = canvas.getByTestId('breadcrumb-entry-invited-member-access');

    await step('長い階層を複数行へ折り返す', async () => {
      // 最初と最後の項目の上端差から、狭幅で後続階層が次の行へ移動したことを確認する。
      await expect(currentItem.offsetTop).toBeGreaterThan(firstItem.offsetTop);
    });

    await step('折り返した内容をモバイル幅の内側へ収める', async () => {
      // BreadcrumbList の横スクロール幅が frame を超えず、長い現在地も水平方向にはみ出さないことを確認する。
      await expect(list.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    });
  },
};
