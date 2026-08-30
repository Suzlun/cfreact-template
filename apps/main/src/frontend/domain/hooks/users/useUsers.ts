import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { FrontendApiError, usersApi } from '@cfreact-template/main/frontend/api';
import type { CreateUserPayload, User } from '@cfreact-template/main/frontend/api/types';

/**
 * ユーザー管理画面へ公開する失敗状態。
 *
 * @remarks
 * APIやReact Queryの内部情報を隠し、利用者が現在の状態と次の操作を理解できる文言だけを渡す。
 */
interface UsersError {
  title: string;
  message: string;
  field?: 'email';
}

/**
 * ユーザー管理画面へ公開する表示状態。
 *
 * @remarks
 * 一覧取得とユーザー作成の失敗を分離し、画面が空一覧と取得失敗を混同しないようにする。
 */
interface UsersData {
  list: User[];
  isLoading: boolean;
  isSubmitting: boolean;
  listError?: UsersError;
  createError?: UsersError;
  form: CreateUserPayload & { isValid: boolean };
}

/**
 * ユーザー管理画面へ公開する操作。
 *
 * @remarks
 * API、キャッシュ、送信状態の更新をドメイン層へ閉じ込め、画面には利用者操作だけを公開する。
 */
interface UsersActions {
  reload: () => void;
  updateName: (value: string) => void;
  updateEmail: (value: string) => void;
  submit: () => Promise<void>;
}

/**
 * ユーザー一覧と作成フォームの完全なドメイン契約を提供する。
 *
 * @returns 一覧、読み込み・送信状態、操作別の失敗状態、フォーム、利用者操作をまとめた契約。
 * @throws API呼び出しの失敗は表示状態へ変換するため、このフックからは送出しない。
 *
 * @example
 * ```tsx
 * const { data, actions } = useUsers();
 * ```
 */
function useUsers(): { data: UsersData; actions: UsersActions } {
  const queryClient = useQueryClient();
  const formState = useState<CreateUserPayload>({ name: '', email: '' });
  const [form] = formState;

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const createUser = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const isValid = form.name.trim() !== '' && form.email.trim() !== '';

  // APIや通信層の詳細を画面へ渡さず、一覧が未表示であることと回復手順を明示する。
  const listError: UsersError | undefined =
    usersQuery.error === null
      ? undefined
      : {
          title: 'Users could not be loaded',
          message:
            'The user list is not displayed. Check your connection, then select Refresh List. Your form entries are preserved.',
        };

  // 作成失敗は既定の安全な案内へ変換し、入力が保持されていることと再試行手順を伝える。
  let createError: UsersError | undefined;
  if (createUser.error !== null) {
    createError = {
      title: 'User could not be created',
      message: 'The request could not be completed. Try again. Your current entries are preserved.',
    };
  }

  // 契約済みの重複コードだけを、利用者が修正できる具体的な案内へ置き換える。
  if (
    createUser.error instanceof FrontendApiError &&
    createUser.error.code === 'USER_EMAIL_ALREADY_EXISTS'
  ) {
    createError = {
      title: 'User could not be created',
      message:
        'A user with this email address already exists. Enter a different email address and try again. Your current entries are preserved.',
      field: 'email',
    };
  }

  const data: UsersData = {
    list: usersQuery.data ?? [],
    isLoading: usersQuery.isPending,
    isSubmitting: createUser.isPending,
    listError,
    createError,
    form: { ...form, isValid },
  };

  const actions: UsersActions = {
    reload: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    updateName: (value: string) => {
      // 入力の修正を新しい作成試行として扱い、以前の作成失敗だけを解除する。
      if (createUser.error !== null) {
        createUser.reset();
      }
      formState[1]((prev) => ({ ...prev, name: value }));
    },
    updateEmail: (value: string) => {
      // メールアドレスを修正した時点で、以前の重複案内を現在状態から取り除く。
      if (createUser.error !== null) {
        createUser.reset();
      }
      formState[1]((prev) => ({ ...prev, email: value }));
    },
    submit: async () => {
      if (!isValid) {
        return;
      }

      try {
        // React Query に失敗状態を保持させつつ、画面側の void 呼び出しへ拒否済み Promise を漏らさない。
        await createUser.mutateAsync(formState[0]);
      } catch {
        // 利用者が修正できるよう入力を保持し、作成失敗はdata.createErrorから安全に表示する。
        return;
      }

      // 作成に成功した場合だけ入力を消去し、失敗後の再送に必要な値を失わない。
      formState[1]({ name: '', email: '' });
    },
  };

  return {
    data,
    actions,
  };
}

export type { UsersActions, UsersData };
export { useUsers };
