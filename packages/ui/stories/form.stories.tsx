import { useState, type SubmitEvent } from 'react';
import { useForm, type Control, type SubmitHandler } from 'react-hook-form';

import { Button } from '@cfreact-template/ui/components/button';
import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cfreact-template/ui/components/form';
import { Input } from '@cfreact-template/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cfreact-template/ui/components/select';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** プロフィールフォームが編集、検証、保存する全入力値の固定契約。 */
interface ProfileFormValues {
  /** アカウント通知と本人確認に使用するメールアドレス。 */
  email: string;
  /** アカウント通知とシステムメッセージに使用する言語。 */
  language: string;
  /** メールアドレスを公開プロフィールへ表示するかを示す明示的な同意。 */
  showEmail: boolean;
  /** 他の利用者に表示する公開ユーザー名。 */
  username: string;
}

/** 各 Story 内部フィールドへ同じ React Hook Form control を渡す入力。 */
interface ProfileFieldProps {
  /** 全フィールドの値、検証規則、状態を一元管理する control。 */
  control: Control<ProfileFormValues>;
  /** 保存処理中に入力値を変更できないよう、各 control の操作可否を統一する。 */
  disabled: boolean;
}

/** Select が値から可視名を一意に解決する言語選択肢の契約。 */
interface LanguageOption {
  /** SelectItem と送信値で共有する安定した言語タグ。 */
  value: string;
  /** Trigger と Popup の双方に表示する言語名。 */
  label: string;
}

/** プロフィール編集の情報階層と検証結果で共有する利用者向け文言。 */
const profileCopy = {
  description: 'This is how others will see you on the site.',
  emailDescription: 'We will use this address for account notifications.',
  emailInvalid: 'Enter a valid email address.',
  emailLabel: 'Email',
  emailRequired: 'Enter an email address.',
  languageDescription: 'Choose the language used for account emails and system messages.',
  languageLabel: 'Preferred language',
  languagePlaceholder: 'Select a language',
  languageRequired: 'Select a preferred language.',
  resetAction: 'Reset',
  saveAction: 'Save changes',
  savedMessage: 'Your profile has been saved.',
  savingAction: 'Saving…',
  savingMessage: 'Saving your profile…',
  showEmailDescription: 'Your email stays private unless you choose to display it.',
  showEmailLabel: 'Show my email address on my public profile',
  title: 'Profile',
  usernameDescription:
    'This is your public display name. It must be 3–10 characters and contain only letters, numbers, and underscores.',
  usernameInvalid: 'Use only letters, numbers, and underscores.',
  usernameLabel: 'Username',
  usernameMaximum: 'Username must be at most 10 characters.',
  usernameMinimum: 'Username must be at least 3 characters.',
  usernameRequired: 'Enter a username.',
} as const;

/** React Hook Form と controlled reset が共有する現実的で再現可能な初期値。 */
const initialProfileValues: ProfileFormValues = {
  email: 'morgan@example.com',
  language: '',
  showEmail: false,
  username: 'morgan',
};

/** Select Root と各 SelectItem が同じ値・可視名を共有する固定選択肢。 */
const languageOptions: LanguageOption[] = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'ja-JP', label: '日本語' },
];

/** ブラウザー差に依存せず、空白やドメイン区切りの欠落を拒否する固定メール形式。 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 公開ユーザー名で許可する文字を、説明文と同じ英数字および underscore に限定する。 */
const usernamePattern = /^\w+$/;

/** 外部 API を使わず、送信中 UI を知覚できる長さだけ維持する Story 専用待機時間。 */
const submissionDelayMs = 650;

/**
 * 公開ユーザー名を説明、文字数、許可文字、インラインエラーとともに構成する。
 *
 * @param props プロフィールフォーム全体と共有する React Hook Form control。
 * @returns アクセシブルな名前と説明を持つ controlled username field。
 */
function UsernameField({ control, disabled }: ProfileFieldProps) {
  return (
    <FormField
      control={control}
      name="username"
      rules={{
        maxLength: { value: 10, message: profileCopy.usernameMaximum },
        minLength: { value: 3, message: profileCopy.usernameMinimum },
        pattern: { value: usernamePattern, message: profileCopy.usernameInvalid },
        required: profileCopy.usernameRequired,
      }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{profileCopy.usernameLabel}</FormLabel>
          <FormControl>
            <Input
              {...field}
              required
              autoCapitalize="none"
              autoComplete="username"
              disabled={disabled}
              maxLength={10}
              minLength={3}
              placeholder="morgan"
              spellCheck={false}
              type="text"
            />
          </FormControl>
          <FormDescription>{profileCopy.usernameDescription}</FormDescription>
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

/**
 * メールアドレスを用途に適した入力属性、形式検証、インラインエラーとともに構成する。
 *
 * @param props プロフィールフォーム全体と共有する React Hook Form control。
 * @returns アクセシブルな名前と説明を持つ controlled email field。
 */
function EmailField({ control, disabled }: ProfileFieldProps) {
  return (
    <FormField
      control={control}
      name="email"
      rules={{
        pattern: { value: emailPattern, message: profileCopy.emailInvalid },
        required: profileCopy.emailRequired,
      }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{profileCopy.emailLabel}</FormLabel>
          <FormControl>
            <Input
              {...field}
              required
              autoCapitalize="none"
              autoComplete="email"
              disabled={disabled}
              inputMode="email"
              placeholder="name@example.com"
              spellCheck={false}
              type="email"
            />
          </FormControl>
          <FormDescription>{profileCopy.emailDescription}</FormDescription>
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

/**
 * 通知言語を controlled Select、必須検証、インラインエラーとともに構成する。
 *
 * @param props プロフィールフォーム全体と共有する React Hook Form control。
 * @returns キーボード操作と支援技術の名前解決に対応した language field。
 */
function LanguageField({ control, disabled }: ProfileFieldProps) {
  return (
    <FormField
      control={control}
      name="language"
      rules={{ required: profileCopy.languageRequired }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{profileCopy.languageLabel}</FormLabel>
          <Select
            required
            disabled={disabled}
            items={languageOptions}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger
                ref={field.ref}
                aria-required="true"
                className="w-full"
                onBlur={field.onBlur}
              >
                <SelectValue placeholder={profileCopy.languagePlaceholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} label={option.label} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>{profileCopy.languageDescription}</FormDescription>
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

/**
 * メール公開への明示的な同意を、安全な未選択状態の controlled Checkbox として構成する。
 *
 * @param props プロフィールフォーム全体と共有する React Hook Form control。
 * @returns ラベルとプライバシー説明を持つ任意の email visibility field。
 */
function EmailVisibilityField({ control, disabled }: ProfileFieldProps) {
  return (
    <FormField
      control={control}
      name="showEmail"
      render={({ field }) => (
        <FormItem className="grid grid-cols-[1rem_1fr] items-start gap-x-3 gap-y-1 space-y-0 rounded-lg border p-4">
          <FormControl>
            <Checkbox
              ref={field.ref}
              checked={field.value}
              disabled={disabled}
              name={field.name}
              onBlur={field.onBlur}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1">
            <FormLabel className="leading-5">{profileCopy.showEmailLabel}</FormLabel>
            <FormDescription className="leading-5">
              {profileCopy.showEmailDescription}
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}

/**
 * 既存の Form 公開コンポーネントを、実際のプロフィール編集タスクへ構成する。
 *
 * 入力値は React Hook Form だけが管理し、送信時には文字数・形式・必須選択を決定的に検証する。
 * 成功した値は新しい reset 基準へ更新し、外部 API や永続化処理は実行しない。
 *
 * @returns ラベル、補足説明、インラインエラー、主操作と補助操作を備えたプロフィールフォーム。
 */
function ProfileFormExample() {
  // 保存結果だけを Story 内の polite live region へ保持し、外部通知基盤へ依存しない。
  const [saveMessage, setSaveMessage] = useState('');

  // 全 controlled field の初期値を一か所で定義し、検証、dirty 判定、reset の基準を一致させる。
  const form = useForm<ProfileFormValues>({
    defaultValues: initialProfileValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  /** 検証済み値を保存基準へ移し、視覚表示と live region へ完了を通知する。 */
  const handleValidSubmit: SubmitHandler<ProfileFormValues> = async (values) => {
    // Story 内だけで短い保存待機を再現し、disabled、busy、進行中ラベルを操作から確認可能にする。
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, submissionDelayMs);
    });

    // 保存済み値を reset 基準へ移し、成功後の form を未変更状態として扱えるようにする。
    form.reset(values);
    setSaveMessage(profileCopy.savedMessage);
  };

  /** submit event を React Hook Form の非同期検証境界へ安全に渡す。 */
  function handleFormSubmit(event: SubmitEvent<HTMLFormElement>) {
    // 新しい検証または保存を開始する前に以前の成功通知を消し、現在の状態だけを伝える。
    setSaveMessage('');

    // Promise を明示的に開始し、成功処理には検証済み値だけを渡す。
    void form.handleSubmit(handleValidSubmit)(event);
  }

  /** 最後に保存したプロフィールへ値と検証状態を戻し、以前の保存通知を取り除く。 */
  function handleReset() {
    // 現在の reset 基準を再利用し、DOM と React Hook Form の内部状態を同時に復元する。
    form.reset();
    setSaveMessage('');
  }

  // React Hook Form の送信状態を全 control、操作、busy 属性、live region で一貫して共有する。
  const isSubmitting = form.formState.isSubmitting;

  // 編集再開後に古い成功通知を残さず、現在進行中か直近完了の状態だけを伝える。
  const statusMessage = isSubmitting
    ? profileCopy.savingMessage
    : form.formState.isDirty
      ? ''
      : saveMessage;

  return (
    <section aria-labelledby="profile-form-title" className="w-[calc(100vw-2rem)] max-w-lg">
      {/* タスク名と目的だけを示し、フォーム API の説明や catalog 用装飾は表示しない。 */}
      <header className="border-b pb-6">
        <h1 id="profile-form-title" className="text-xl font-semibold tracking-tight text-balance">
          {profileCopy.title}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground text-pretty">
          {profileCopy.description}
        </p>
      </header>

      {/* FormProvider を一度だけ置き、分割した全フィールドへ同じ control と状態を共有する。 */}
      <Form {...form}>
        <form
          noValidate
          aria-busy={isSubmitting}
          aria-labelledby="profile-form-title"
          className="space-y-6 pt-6"
          onSubmit={handleFormSubmit}
        >
          <UsernameField control={form.control} disabled={isSubmitting} />
          <EmailField control={form.control} disabled={isSubmitting} />
          <LanguageField control={form.control} disabled={isSubmitting} />
          <EmailVisibilityField control={form.control} disabled={isSubmitting} />

          {/* 保存を唯一の主操作とし、reset は outline variant の補助操作として優先度を下げる。 */}
          <footer className="flex flex-wrap items-center gap-3 border-t pt-6">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? profileCopy.savingAction : profileCopy.saveAction}
            </Button>
            <Button disabled={isSubmitting} type="button" variant="outline" onClick={handleReset}>
              {profileCopy.resetAction}
            </Button>
            <p
              aria-live="polite"
              role="status"
              className="min-h-5 basis-full text-sm text-muted-foreground sm:basis-auto"
            >
              {statusMessage}
            </p>
          </footer>
        </form>
      </Form>
    </section>
  );
}

/** 実際のプロフィール編集タスクとして Form の構成と状態を表示する Story metadata。 */
const meta = {
  title: 'Forms/Form',
  component: ProfileFormExample,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'React Hook Form と共有 Form primitives を使用した、検証、説明、エラー、reset を備えるプロフィール編集フォームです。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof ProfileFormExample>;

/** Storybook がプロフィールフォームを描画するための既定 export。 */
export default meta;

/** metadata からプロフィールフォーム Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** API catalog ではなく、一つの完結したプロフィール編集タスクを表示する。 */
export const ProfileForm: Story = {};
