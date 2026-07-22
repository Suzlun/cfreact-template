import { expect, fn, userEvent, within } from 'storybook/test';

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
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';
import { cn } from '@cfreact-template/ui/lib/utils';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, MouseEvent, SyntheticEvent } from 'react';

/** shadcn/ui 公式 Login Card の可視コピーを一つの実用途として保持する。 */
interface LoginCardCopy {
  /** CardTitle と region のアクセシブルネームに使用するログイン見出し。 */
  title: string;
  /** CardDescription と region のアクセシブル説明に使用する案内文。 */
  description: string;
  /** CardAction のアカウント作成操作に表示するラベル。 */
  signUp: string;
  /** Password field と同じ行に置く回復操作のラベル。 */
  forgotPassword: string;
  /** form を送信する主操作のラベル。 */
  login: string;
  /** Google 認証を開始する副操作のラベル。 */
  loginWithGoogle: string;
}

/** 公式ページ先頭の Login Card と同じ情報構造とコピー。 */
const officialLoginCopy: LoginCardCopy = {
  title: 'Login to your account',
  description: 'Enter your email below to login to your account',
  signUp: 'Sign Up',
  forgotPassword: 'Forgot your password?',
  login: 'Login',
  loginWithGoogle: 'Login with Google',
};

/** Story の操作を外部作用なしで観測できる spy の組。 */
function createLoginStoryActions() {
  return {
    forgotPassword: fn((event: MouseEvent<HTMLAnchorElement>) => {
      // 公式例の link semantics を保ちつつ、Storybook document の fragment navigation は発生させない。
      event.preventDefault();
    }),
    googleLogin: fn(),
    login: fn((event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
      // Storybook document の遷移を防ぎ、native form submit の発生だけを検証可能にする。
      event.preventDefault();
    }),
    signUp: fn(),
  };
}

/** Login Card の各 Story が独立して操作回数を検証するための spy 型。 */
type LoginStoryActions = ReturnType<typeof createLoginStoryActions>;

/** Card の公開 size 値を Story の期待値にも再利用する。 */
type CardSize = NonNullable<ComponentProps<typeof Card>['size']>;

/** 公式 Login Card を Story 固有 ID、コピー、操作 spy とともに描画する入力。 */
type LoginCardProps = ComponentProps<typeof Card> & {
  /** 同一 Docs ページに複数 Story が並んでも重複しない form と label の接頭辞。 */
  idPrefix: string;
  /** Story が表示する公式 Login Card の可視コピー。 */
  copy: LoginCardCopy;
  /** 画面遷移を行わず、利用者操作を play test へ通知する spy。 */
  actions: LoginStoryActions;
};

/** Default Story 専用の操作履歴。 */
const defaultActions = createLoginStoryActions();

/** Small Story 専用の操作履歴。 */
const smallActions = createLoginStoryActions();

/**
 * shadcn/ui 公式 Login Card を、Card の全 subcomponent と有効な form 関連付けで描画する。
 *
 * @param props Card の公開属性、Story 固有 ID、表示コピー、操作 spy。
 * @returns Header、Title、Description、Action、Content、Footer を含むログインフォーム。
 * @remarks 入力値は Story 内だけで管理され、送信と各操作は spy へ通知した後に外部作用を起こさない。
 * @example
 * ```tsx
 * <LoginCard
 *   idPrefix="login-default"
 *   copy={officialLoginCopy}
 *   actions={defaultActions}
 *   size="default"
 * />
 * ```
 */
function LoginCard({ actions, className, copy, idPrefix, ...cardProps }: LoginCardProps) {
  // form と入力の ID を Story 固有接頭辞から決定し、Docs の複数描画でも関連付けを一意に保つ。
  const formId = `${idPrefix}-form`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;

  // Small Card では Card と操作部品の密度を同時に揃え、公式 size 例の一貫性を保つ。
  const buttonSize = cardProps.size === 'sm' ? 'sm' : 'default';

  return (
    <Card
      {...cardProps}
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn('w-full max-w-sm', className)}
    >
      {/* Header はログイン目的、短い説明、アカウント作成操作を公式と同じ順序でまとめる。 */}
      <CardHeader>
        <CardTitle id={titleId} role="heading" aria-level={2} className="min-w-0 break-words">
          {copy.title}
        </CardTitle>
        <CardDescription id={descriptionId} className="min-w-0 break-words">
          {copy.description}
        </CardDescription>
        <CardAction>
          {/* 実在しない遷移先を作らず、公式の link variant と可視ラベルを操作可能な button で保つ。 */}
          <Button type="button" variant="link" size={buttonSize} onClick={actions.signUp}>
            {copy.signUp}
          </Button>
        </CardAction>
      </CardHeader>

      {/* Content は native label、入力型、autocomplete、required 制約を持つ実用的な認証入力を提供する。 */}
      <CardContent>
        <form id={formId} aria-describedby={descriptionId} onSubmit={actions.login}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Label htmlFor={passwordId}>Password</Label>
                {/* 公式例と同じ link semantics と可視コピーを保ち、狭い幅では利用可能領域内で折り返す。 */}
                <a
                  href="#"
                  className="ml-auto min-w-0 shrink text-sm underline-offset-4 hover:underline"
                  onClick={actions.forgotPassword}
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

      {/* Footer は form 属性で外側の submit button を正しく関連付け、主操作と副操作を縦に並べる。 */}
      <CardFooter className="flex-col gap-2">
        <Button form={formId} type="submit" size={buttonSize} className="w-full">
          {copy.login}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={buttonSize}
          className="w-full"
          onClick={actions.googleLogin}
        >
          {copy.loginWithGoogle}
        </Button>
      </CardFooter>
    </Card>
  );
}

const meta = {
  title: 'Components/Card',
  component: Card,
  subcomponents: {
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
  },
  parameters: {
    controls: {
      include: ['size'],
    },
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
  },
  render: (args) => (
    <LoginCard
      {...args}
      idPrefix="login-default"
      copy={officialLoginCopy}
      actions={defaultActions}
    />
  ),
} satisfies Meta<typeof Card>;

/** Storybook が Card の CSF3 metadata と全 subcomponent の関連を読み取るための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Login Card の意味構造、size、全操作、native form submit を Story ごとに検証する play 関数を生成する。
 *
 * @param actions 対象 Story だけの操作履歴を保持する spy。
 * @param copy Story に表示されるログインコピー。
 * @param expectedSize Card root に期待する公開 size 値。
 * @returns Storybook browser project で実行する非同期 play 関数。
 */
function createLoginCardPlay(
  actions: LoginStoryActions,
  copy: LoginCardCopy,
  expectedSize: CardSize
): NonNullable<Story['play']> {
  return async ({ canvasElement, step }) => {
    // theme・viewport 別の再実行履歴を除き、この Story で発生した通知だけを検証対象にする。
    actions.forgotPassword.mockClear();
    actions.googleLogin.mockClear();
    actions.login.mockClear();
    actions.signUp.mockClear();

    // Story canvas 内へ検索を限定し、Storybook 管理 UI の同名操作を取得しない。
    const canvas = within(canvasElement);
    const card = canvas.getByRole('region', { name: copy.title });
    const email = canvas.getByRole('textbox', { name: 'Email' });
    const password = canvas.getByLabelText('Password');
    const login = canvas.getByRole('button', { name: copy.login });

    await step('Card の情報階層、size、form 制約を公開する', async () => {
      // 見出しと説明を Card の名前・説明へ接続し、見た目だけに依存しない情報階層を保証する。
      await expect(card).toHaveAttribute('data-size', expectedSize);
      await expect(card).toHaveAccessibleDescription(copy.description);
      await expect(canvas.getByRole('heading', { level: 2, name: copy.title })).toBeVisible();

      // 入力目的と必須制約、および Footer の submit button と form の関連付けを確認する。
      await expect(email).toHaveAttribute('type', 'email');
      await expect(email).toBeRequired();
      await expect(password).toHaveAttribute('type', 'password');
      await expect(password).toBeRequired();
      await expect(login).toHaveAttribute('form', expect.stringMatching(/-form$/));
    });

    await step('Header と Content と Footer の副操作を個別に通知する', async () => {
      // 公式構成にある三つの副操作を実利用と同じクリックで送り、相互に混線しないことを保証する。
      await userEvent.click(canvas.getByRole('button', { name: copy.signUp }));
      await userEvent.click(canvas.getByRole('link', { name: copy.forgotPassword }));
      await userEvent.click(canvas.getByRole('button', { name: copy.loginWithGoogle }));

      await expect(actions.signUp).toHaveBeenCalledTimes(1);
      await expect(actions.forgotPassword).toHaveBeenCalledTimes(1);
      await expect(actions.googleLogin).toHaveBeenCalledTimes(1);
    });

    await step('有効な認証入力から native form submit を通知する', async () => {
      // browser validation を満たす実データを入力し、Footer の form-associated button から送信する。
      await userEvent.clear(email);
      await userEvent.type(email, 'person@example.com');
      await userEvent.clear(password);
      await userEvent.type(password, 'correct-horse-battery-staple');
      await userEvent.click(login);

      await expect(actions.login).toHaveBeenCalledTimes(1);
    });
  };
}

/** 公式 Login Card を `size="default"` で描画し、全 subcomponent と操作契約を確認する Story。 */
export const Default: Story = {
  args: {
    size: 'default',
  },
  play: createLoginCardPlay(defaultActions, officialLoginCopy, 'default'),
};

/** 同じ公式 Login Card を `size="sm"` で描画し、コンパクトな余白と操作寸法を確認する Story。 */
export const Small: Story = {
  args: {
    size: 'sm',
  },
  render: (args) => (
    <LoginCard {...args} idPrefix="login-small" copy={officialLoginCopy} actions={smallActions} />
  ),
  play: createLoginCardPlay(smallActions, officialLoginCopy, 'sm'),
};
