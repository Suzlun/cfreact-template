import { expect, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';
import { RadioGroup, RadioGroupItem } from '@cfreact-template/ui/components/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cfreact-template/ui/components/select';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** horizontal Checkbox で表示する、実際の同期設定。 */
const syncField = {
  description:
    'Your Desktop & Documents folders are being synced with iCloud Drive. You can access them from other devices.',
  id: 'field-sync-folders',
  label: 'Sync Desktop & Documents folders',
} as const;

/** 公式 responsive 例で表示する profile の氏名欄。 */
const profileField = {
  description: 'Provide your full name for identification',
  id: 'field-profile-name',
  label: 'Name',
  placeholder: 'Evil Rabbit',
} as const;

/** fieldset と RadioGroup で単一選択する固定料金プラン。 */
const planOptions = [
  { id: 'field-plan-monthly', label: 'Monthly ($9.99/month)', value: 'monthly' },
  { id: 'field-plan-yearly', label: 'Yearly ($99.99/year)', value: 'yearly' },
  { id: 'field-plan-lifetime', label: 'Lifetime ($299.99)', value: 'lifetime' },
] as const;

/** 公式 Field Group 例の Tasks で切り替える通知方法。 */
const taskNotificationOptions = [
  { id: 'field-task-push', label: 'Push notifications' },
  { id: 'field-task-email', label: 'Email notifications' },
] as const;

/** 公式 Select 例と同じ、未選択項目を含む部署一覧。 */
const departmentOptions = [
  { label: 'Choose department', value: null },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Sales', value: 'sales' },
  { label: 'Customer Support', value: 'support' },
  { label: 'Human Resources', value: 'hr' },
  { label: 'Finance', value: 'finance' },
  { label: 'Operations', value: 'operations' },
] as const;

/** 単一エラーを持つ実際の部署選択欄。 */
const departmentField = {
  description: 'Select your department or area of work.',
  error: 'Please select a department.',
  id: 'field-department',
  label: 'Department',
} as const;

/**
 * 固定 control ID から補足説明の参照先を生成する。
 *
 * @param id Story 内で一意な control ID。
 * @returns `aria-describedby` と `FieldDescription` で共有する ID。
 */
function getDescriptionId(id: string): string {
  return `${id}-description`;
}

/** `Field` を anatomy 一覧ではなく、公式構成に沿う実フォーム例として登録する。 */
const meta = {
  title: 'Forms/Field',
  component: Field,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          '公式 shadcn/ui Field の入力、補足説明、validation、選択グループ、horizontal／responsive 配置を実際の利用例として確認できます。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Field>;

/** Storybook が Field の Docs と interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から全 Field Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Input 例に沿い、username と password を一つの実フォームとして縦配置する。 */
export const Vertical: Story = {
  render: () => (
    <FieldSet className="w-full max-w-xs">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-account-username">Username</FieldLabel>
          <Input id="field-account-username" type="text" placeholder="Max Leiter" />
          <FieldDescription>Choose a unique username for your account.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="field-account-password">Password</FieldLabel>
          <FieldDescription>Must be at least 8 characters long.</FieldDescription>
          <Input id="field-account-password" type="password" placeholder="••••••••" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    // 公式例の可視ラベルが各 control のアクセシブルネームになる公開契約だけを確認する。
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(canvas.getByLabelText('Password')).toBeVisible();
  },
};

/** 公式 Checkbox 例に沿い、control とラベル・説明を横方向に揃える設定項目を示す。 */
export const Horizontal: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-xs">
      <Field orientation="horizontal">
        <Checkbox id={syncField.id} defaultChecked />
        <FieldContent>
          <FieldLabel htmlFor={syncField.id}>{syncField.label}</FieldLabel>
          <FieldDescription>{syncField.description}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    // 可視ラベルと初期選択という Checkbox の公開状態だけを確認する。
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox', { name: syncField.label });
    await expect(checkbox).toBeChecked();
  },
};

/** 公式 responsive 例に沿い、container 幅で縦横を切り替える profile form を示す。 */
export const Responsive: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <form>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor={profileField.id}>{profileField.label}</FieldLabel>
                <FieldDescription>{profileField.description}</FieldDescription>
              </FieldContent>
              <Input id={profileField.id} placeholder={profileField.placeholder} required />
            </Field>
            <Field orientation="responsive">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 公式 responsive 例の可視ラベルと二つの操作だけを利用者視点で確認する。
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: profileField.label })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};

/** 公式 Radio 例に沿い、legend と説明で三つの料金プランを一つにまとめる。 */
export const FieldsetAndLegend: Story = {
  render: () => (
    <FieldSet className="w-full max-w-xs">
      <FieldLegend variant="label">Subscription Plan</FieldLegend>
      <FieldDescription>Yearly and lifetime plans offer significant savings.</FieldDescription>
      <RadioGroup defaultValue={planOptions[0].value}>
        {planOptions.map((option) => (
          <Field key={option.value} orientation="horizontal">
            <RadioGroupItem id={option.id} value={option.value} />
            <FieldLabel htmlFor={option.id} className="font-normal">
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    // 可視ラベルから解決できる各 radio の初期選択だけを公開状態として確認する。
    const canvas = within(canvasElement);
    const monthly = canvas.getByRole('radio', { name: planOptions[0].label });
    const yearly = canvas.getByRole('radio', { name: planOptions[1].label });
    await expect(monthly).toBeChecked();
    await expect(yearly).not.toBeChecked();
  },
};

/** 公式 Field Group 例どおり、disabled／checked／unchecked 状態を separator で整理する。 */
export const FieldGroupStates: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-xs">
      <FieldSet>
        <FieldLabel>Responses</FieldLabel>
        <FieldDescription>
          Get notified when ChatGPT responds to requests that take time, like research or image
          generation.
        </FieldDescription>
        <FieldGroup data-slot="checkbox-group">
          <Field orientation="horizontal">
            <Checkbox id="field-response-push" defaultChecked disabled />
            <FieldLabel htmlFor="field-response-push" className="font-normal">
              Push notifications
            </FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLabel>Tasks</FieldLabel>
        <FieldDescription>
          Get notified when tasks you&apos;ve created have updates. <a href="#">Manage tasks</a>
        </FieldDescription>
        <FieldGroup data-slot="checkbox-group">
          {taskNotificationOptions.map((option) => (
            <Field key={option.id} orientation="horizontal">
              <Checkbox id={option.id} />
              <FieldLabel htmlFor={option.id} className="font-normal">
                {option.label}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    // 非ネイティブ checkbox の公開 ARIA disabled 契約と選択状態だけを確認する。
    const canvas = within(canvasElement);
    const responsePush = canvas.getByRole('checkbox', {
      checked: true,
      name: 'Push notifications',
    });
    const taskEmail = canvas.getByRole('checkbox', { name: 'Email notifications' });
    await expect(responsePush).toHaveAttribute('aria-disabled', 'true');
    await expect(responsePush).toBeChecked();
    await expect(taskEmail).not.toBeChecked();
  },
};

/** 公式 Select と Validation and Errors の構成に沿い、未選択欄へ単一エラーを関連付ける。 */
export const SelectValidation: Story = {
  render: () => (
    <Field data-invalid className="w-full max-w-xs">
      <FieldLabel htmlFor={departmentField.id}>{departmentField.label}</FieldLabel>
      <Select items={departmentOptions}>
        <SelectTrigger
          id={departmentField.id}
          aria-describedby={getDescriptionId(departmentField.id)}
          aria-errormessage={`${departmentField.id}-error`}
          aria-invalid
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {departmentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription id={getDescriptionId(departmentField.id)}>
        {departmentField.description}
      </FieldDescription>
      <FieldError id={`${departmentField.id}-error`}>{departmentField.error}</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    // SelectTrigger が公開するラベル、説明、invalid、error の関連付けだけを確認する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: departmentField.label });
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription(departmentField.description);
    await expect(trigger).toHaveAccessibleErrorMessage(departmentField.error);
  },
};
