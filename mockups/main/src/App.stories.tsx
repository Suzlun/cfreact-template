import { App } from './App';

import type { Meta, StoryObj } from '@storybook/react-vite';
import './styles.css';

const meta = {
  title: 'Main',
  component: App,
  parameters: { layout: 'fullscreen' },
  args: { initialPage: 'home', scenario: 'default' },
  argTypes: {
    initialPage: { control: 'select', options: ['home', 'users'] },
    scenario: {
      control: 'select',
      options: ['default', 'empty-users', 'users-loading', 'users-error', 'create-error'],
    },
  },
  // 初期条件の変更時だけ再マウントし、操作中の状態と表示例の状態を分離する。
  render: (args) => (
    <App key={`${args.initialPage ?? 'home'}:${args.scenario ?? 'default'}`} {...args} />
  ),
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ホームからユーザー管理まで操作できる統合モック。 */
export const Home: Story = {};
/** ユーザー管理の初期表示。 */
export const Users: Story = { args: { initialPage: 'users' } };
/** ユーザーがいない状態。 */
export const EmptyUsers: Story = { args: { initialPage: 'users', scenario: 'empty-users' } };
/** 一覧の読み込み中。 */
export const UsersLoading: Story = { args: { initialPage: 'users', scenario: 'users-loading' } };
/** 一覧取得の失敗と再表示。 */
export const UsersError: Story = { args: { initialPage: 'users', scenario: 'users-error' } };
/** 作成失敗後の入力修正。 */
export const CreateError: Story = { args: { initialPage: 'users', scenario: 'create-error' } };
