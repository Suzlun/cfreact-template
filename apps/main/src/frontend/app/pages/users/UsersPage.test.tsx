import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { UsersPage } from '@cfreact-template/main/frontend/app/pages/users/UsersPage';

import { server } from '../../tests/mocks/server';
import { render, screen, waitFor } from '../../tests/utils/test-utils';

describe('UsersPage', () => {
  describe('データ取得', () => {
    it('ローディング中にスピナーが表示される', () => {
      render(<UsersPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('ユーザー一覧が正しく表示される', async () => {
      render(<UsersPage />);

      // ローディングが完了するまで待つ
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // テーブルが表示されることを確認
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // ヘッダーの確認
      expect(screen.getByRole('columnheader', { name: /id/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /created at/i })).toBeInTheDocument();

      // ユーザーデータの確認
      const rows = screen.getAllByRole('row');
      // ヘッダー行 + 2データ行 = 3行
      expect(rows).toHaveLength(3);

      // 1人目のユーザー
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();

      // 2人目のユーザー
      expect(screen.getByText('Test User 2')).toBeInTheDocument();
      expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    });

    it('ユーザーが0件の場合、メッセージが表示される', async () => {
      // 空の配列を返すようにモックを上書き
      server.use(
        http.get('/api/v1/users', () => {
          return HttpResponse.json([]);
        })
      );

      render(<UsersPage />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('一覧取得エラー時に回復案内を表示して空状態を隠す', async () => {
      const user = userEvent.setup();
      // エラーを返すようにモックを上書き
      server.use(
        http.get('/api/v1/users', () => {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' },
            { status: 500 }
          );
        })
      );

      render(<UsersPage />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Users could not be loaded');
      expect(alert).toHaveTextContent(
        'The user list is not displayed. Check your connection, then select Refresh List. Your form entries are preserved.'
      );
      expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(nameInput, 'Preserved User');
      await user.type(emailInput, 'preserved@example.com');

      // 通信回復後は既定Handlerへ戻し、画面内の再取得操作だけで一覧を復旧する。
      server.resetHandlers();
      await user.click(screen.getByRole('button', { name: /refresh list/i }));

      expect(await screen.findByRole('table')).toBeInTheDocument();
      expect(nameInput).toHaveValue('Preserved User');
      expect(emailInput).toHaveValue('preserved@example.com');
    });
  });

  describe('ユーザー作成', () => {
    beforeEach(() => {
      render(<UsersPage />);
    });

    it('フォームが正しく表示される', async () => {
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // フォーム要素の確認
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    it('新しいユーザーを作成できる', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // フォームに入力
      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');
      const submitButton = screen.getByRole('button', { name: /create user/i });

      await user.type(nameInput, 'New Test User');
      await user.type(emailInput, 'newuser@example.com');
      await user.click(submitButton);

      // ローディング状態の確認
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /create user/i });
        expect(button).toHaveAttribute('data-loading', 'true');
      });

      // フォームがクリアされることを確認
      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        expect(emailInput).toHaveValue('');
      });

      // 新しいユーザーが一覧に表示される
      await waitFor(() => {
        expect(screen.getByText('New Test User')).toBeInTheDocument();
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
      });
    });

    it('メール重複時に修正案内と入力内容を保持し、入力変更時に案内を解除する', async () => {
      const user = userEvent.setup();
      server.use(
        http.post('/api/v1/users', () => {
          return HttpResponse.json(
            { code: 'USER_EMAIL_ALREADY_EXISTS', message: 'User email already exists' },
            { status: 409 }
          );
        })
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(nameInput, 'Duplicate User');
      await user.type(emailInput, 'duplicate@example.com');
      await user.click(screen.getByRole('button', { name: /create user/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('User could not be created');
      expect(alert).toHaveTextContent(
        'A user with this email address already exists. Enter a different email address and try again. Your current entries are preserved.'
      );
      expect(nameInput).toHaveValue('Duplicate User');
      expect(emailInput).toHaveValue('duplicate@example.com');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'user-create-error-description');
      expect(screen.getByText('Test User 1')).toBeInTheDocument();

      await user.clear(emailInput);
      await user.type(emailInput, 'available@example.com');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(emailInput).not.toHaveAttribute('aria-invalid');
      expect(emailInput).not.toHaveAttribute('aria-describedby');
    });

    it('作成時の内部失敗を安全に案内し、入力と既存一覧を保持する', async () => {
      const user = userEvent.setup();
      server.use(
        http.post('/api/v1/users', () => {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Sensitive internal failure details' },
            { status: 500 }
          );
        })
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(nameInput, 'Retry User');
      await user.type(emailInput, 'retry@example.com');
      await user.click(screen.getByRole('button', { name: /create user/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('User could not be created');
      expect(alert).toHaveTextContent(
        'The request could not be completed. Try again. Your current entries are preserved.'
      );
      expect(alert).not.toHaveTextContent('Sensitive internal failure details');
      expect(nameInput).toHaveValue('Retry User');
      expect(emailInput).toHaveValue('retry@example.com');
      expect(screen.getByText('Test User 1')).toBeInTheDocument();
      expect(emailInput).not.toHaveAttribute('aria-invalid');
    });

    it('空のフォームは送信できない', async () => {
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create user/i });

      // 入力が無効な場合は送信ボタンが disabled になる
      expect(submitButton).toBeDisabled();

      // required属性によりブラウザの検証が働くため、実際には送信されない
      // この動作はブラウザの機能なので、ここではフォームの検証属性を確認
      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');

      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });
});
