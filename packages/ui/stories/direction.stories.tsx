import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';
import { DirectionProvider, useDirection } from '@cfreact-template/ui/components/direction';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent, SyntheticEvent } from 'react';

/** `useDirection` の公開戻り値から導出した、Story が受け付ける文字方向。 */
type Direction = ReturnType<typeof useDirection>;

/** shadcn/ui 公式 RTL Login Card の英語・アラビア語コピーを表す。 */
interface LoginCardCopy {
  /** Card の見出しと region のアクセシブルネームに使用するログイン目的。 */
  title: string;
  /** ログインフォームの目的を補足する短い説明。 */
  description: string;
  /** 新規アカウント作成へ進む補助操作のラベル。 */
  signUp: string;
  /** メールアドレス入力の可視ラベル。 */
  email: string;
  /** メールアドレスの入力形式を示す公式プレースホルダー。 */
  emailPlaceholder: string;
  /** 現在のパスワード入力の可視ラベル。 */
  password: string;
  /** パスワード回復へ進むリンクのラベル。 */
  forgotPassword: string;
  /** native form を送信する主操作のラベル。 */
  login: string;
  /** Google 認証を開始する副操作のラベル。 */
  loginWithGoogle: string;
}

/** 一つの Provider 境界へ渡す方向、言語、固定コピー、DOM ID の組。 */
interface DirectionExampleCase {
  /** `DirectionProvider` へ渡し、子孫の論理方向を決定する値。 */
  direction: Direction;
  /** 表示コピーの自然言語を支援技術へ通知する BCP 47 言語タグ。 */
  language: 'ar' | 'en';
  /** 同一 canvas に複数 form を描画しても ID が重複しない接頭辞。 */
  idPrefix: string;
  /** 公式 Login Card から取得した対象言語の可視コピー。 */
  copy: LoginCardCopy;
}

/**
 * shadcn/ui 公式 `card-rtl.tsx` と同じ情報構造・コピーを、LTR と RTL の固定条件へ展開する。
 * 配列順は英語、アラビア語とし、DOM の読み上げ順を文字方向によって反転させない。
 */
const directionCases = [
  {
    direction: 'ltr',
    language: 'en',
    idPrefix: 'direction-english',
    copy: {
      title: 'Login to your account',
      description: 'Enter your email below to login to your account',
      signUp: 'Sign Up',
      email: 'Email',
      emailPlaceholder: 'm@example.com',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      login: 'Login',
      loginWithGoogle: 'Login with Google',
    },
  },
  {
    direction: 'rtl',
    language: 'ar',
    idPrefix: 'direction-arabic',
    copy: {
      title: 'تسجيل الدخول إلى حسابك',
      description: 'أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك',
      signUp: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'm@example.com',
      password: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      login: 'تسجيل الدخول',
      loginWithGoogle: 'تسجيل الدخول باستخدام Google',
    },
  },
] as const satisfies readonly DirectionExampleCase[];

/**
 * Story 内の form submit を受け止め、意味的に正しい submit 操作をページ遷移なしで検証可能にする。
 *
 * @param event Story のログインフォームから発生した native submit event。
 * @returns 戻り値はなく、Storybook canvas の再読み込みだけを抑止する。
 */
function preventFormSubmission(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
  // 認証先を持たない catalog で外部作用を発生させず、form と submit button の契約だけを保持する。
  event.preventDefault();
}

/**
 * 公式例の link semantics を保持しつつ、Storybook document の fragment navigation を抑止する。
 *
 * @param event パスワード回復リンクから発生したクリック event。
 * @returns 戻り値はなく、現在の Story の表示位置だけを維持する。
 */
function preventFragmentNavigation(event: MouseEvent<HTMLAnchorElement>) {
  // 実在しない回復画面を捏造せず、アクセシブルなリンクとしての操作契約だけを公開する。
  event.preventDefault();
}

/**
 * Provider から取得した現在方向を、公式 Login Card の DOM 方向と論理レイアウトへ適用する。
 *
 * @param props.example 対象言語のコピー、言語タグ、一意な ID 接頭辞。
 * @returns 見出し、説明、label、入力、主操作、副操作を備えた方向対応ログインフォーム。
 */
function DirectionLoginCard({ example }: { example: DirectionExampleCase }) {
  // 公開 Hook の値を DOM の `dir` と検証用 data 属性へ反映し、Provider とブラウザ方向を一致させる。
  const direction = useDirection();
  const { copy, idPrefix, language } = example;

  // 各意味要素を一意に関連付け、Docs で両言語が同時描画されても label と form の衝突を防ぐ。
  const formId = `${idPrefix}-form`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="w-full max-w-sm"
      data-direction={direction}
      dir={direction}
      lang={language}
    >
      {/* Header は公式例と同じ順序で目的、説明、アカウント作成操作を提示する。 */}
      <CardHeader>
        <CardTitle id={titleId} role="heading" aria-level={2} className="min-w-0 break-words">
          {copy.title}
        </CardTitle>
        <CardDescription id={descriptionId} className="min-w-0 break-words">
          {copy.description}
        </CardDescription>
        <CardAction>
          {/* 補助操作は Header の論理終端へ配置され、RTL では視覚位置だけが自然に反転する。 */}
          <Button type="button" variant="link">
            {copy.signUp}
          </Button>
        </CardAction>
      </CardHeader>

      {/* Content は native form、入力型、autocomplete、required 制約を公式構成へ補完する。 */}
      <CardContent>
        <form
          id={formId}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onSubmit={preventFormSubmission}
        >
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor={emailId}>{copy.email}</Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Label htmlFor={passwordId}>{copy.password}</Label>
                {/* `ms-auto` によりリンクを物理的な左右ではなく各言語の論理終端へ送る。 */}
                <a
                  href="#"
                  className="ms-auto min-w-0 shrink text-sm underline-offset-4 hover:underline"
                  onClick={preventFragmentNavigation}
                >
                  {copy.forgotPassword}
                </a>
              </div>
              <Input
                id={passwordId}
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>
        </form>
      </CardContent>

      {/* Footer の操作は form 属性で Content 内の form と結び、視覚構造と submit semantics を両立する。 */}
      <CardFooter className="flex-col gap-2">
        <Button form={formId} type="submit" className="w-full">
          {copy.login}
        </Button>
        <Button type="button" variant="outline" className="w-full">
          {copy.loginWithGoogle}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * 指定方向の Provider 境界を作り、子孫の Login Card へ公開コンテキストを供給する。
 *
 * @param props.example Provider の方向と対象言語の表示契約。
 * @returns `DirectionProvider` 直下で公開 Hook を利用するローカライズ済み Login Card。
 */
function DirectionExample({ example }: { example: DirectionExampleCase }) {
  return (
    <DirectionProvider direction={example.direction}>
      <DirectionLoginCard example={example} />
    </DirectionProvider>
  );
}

/** DirectionProvider の公式 LTR/RTL 利用例を登録する CSF 3 metadata。 */
const meta = {
  title: 'Utilities/Direction',
  component: DirectionProvider,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'DirectionProvider と useDirection を、shadcn/ui 公式 Login Card の英語 LTR・アラビア語 RTL 構成へ適用します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof DirectionProvider>;

/** Storybook が Direction catalog の Docs と interaction test を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 英語 LTR とアラビア語 RTL の実用的な Login Card を並べ、方向、意味構造、focus 順序を検証する。
 */
export const LeftToRightAndRightToLeft: Story = {
  render: () => (
    <div className="flex w-full max-w-4xl flex-col items-center gap-8 lg:flex-row lg:items-stretch">
      {directionCases.map((example) => (
        // 各 Card に独立した Provider を与え、同一 canvas 上で LTR と RTL のコンテキストを混在させる。
        <DirectionExample key={example.direction} example={example} />
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas へ検索範囲を限定し、Storybook UI の同名操作を誤って取得しない。
    const canvas = within(canvasElement);

    for (const { copy, direction, idPrefix, language } of directionCases) {
      // ローカライズされた見出しから各 region を特定し、可視でない技術ラベルへ依存しない。
      const region = canvas.getByRole('region', { name: copy.title });
      const regionCanvas = within(region);
      const form = regionCanvas.getByRole('form', { name: copy.title });
      const heading = regionCanvas.getByRole('heading', { level: 2, name: copy.title });
      const description = regionCanvas.getByText(copy.description);
      const emailInput = regionCanvas.getByRole('textbox', { name: copy.email });
      const passwordInput = regionCanvas.getByLabelText(copy.password);
      const forgotPasswordLink = regionCanvas.getByRole('link', { name: copy.forgotPassword });
      const signUpButton = regionCanvas.getByRole('button', { name: copy.signUp });
      const loginButton = regionCanvas.getByRole('button', { name: copy.login });
      const googleButton = regionCanvas.getByRole('button', { name: copy.loginWithGoogle });
      const formId = `${idPrefix}-form`;

      await step(`${language} の Provider、DOM 方向、言語を一致させる`, async () => {
        // Hook 由来の方向と明示的な言語属性を同時に確認し、表示と支援技術の不一致を防ぐ。
        await expect(region).toHaveAttribute('data-direction', direction);
        await expect(region).toHaveAttribute('dir', direction);
        await expect(region).toHaveAttribute('lang', language);
      });

      await step(`${language} の Login Card が完全な意味構造を持つ`, async () => {
        // 見出し、説明、form、label、入力制約、操作種別を検証し、方向変更による意味論の欠落を防ぐ。
        await expect(heading).toBeVisible();
        await expect(description).toBeVisible();
        await expect(form).toHaveAttribute('id', formId);
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(emailInput).toHaveAttribute('autocomplete', 'email');
        await expect(emailInput).toBeRequired();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
        await expect(passwordInput).toBeRequired();
        await expect(forgotPasswordLink).toHaveAttribute('href', '#');
        await expect(forgotPasswordLink).toHaveClass('ms-auto');
        await expect(signUpButton).toHaveAttribute('type', 'button');
        await expect(loginButton).toHaveAttribute('type', 'submit');
        await expect(loginButton).toHaveAttribute('form', formId);
        await expect(googleButton).toHaveAttribute('type', 'button');
      });

      await step(`${language} で論理方向に依存しない focus 順序を保つ`, async () => {
        // 視覚位置だけを dir と論理 CSS に委ね、DOM の操作順は両言語で同じ意味順序に維持する。
        await userEvent.click(emailInput);
        await expect(emailInput).toHaveFocus();
        await userEvent.tab();
        await expect(forgotPasswordLink).toHaveFocus();
        await userEvent.tab();
        await expect(passwordInput).toHaveFocus();
        await userEvent.tab();
        await expect(loginButton).toHaveFocus();
      });
    }
  },
};
