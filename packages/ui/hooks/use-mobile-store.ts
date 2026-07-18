const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`;

/**
 * useIsMobile が Hook インスタンスごとに保持する外部ストア契約。
 * store 生成時にはブラウザ API へ触れず、購読開始時だけ MediaQueryList と同期する。
 *
 * @internal useIsMobile とその契約テストだけが利用する package 非公開型。
 */
interface MobileViewportStore {
  /** 現在保持しているモバイル判定をブラウザ API へ触れずに返す。 */
  getSnapshot: () => boolean;
  /** MediaQueryList を購読し、保持値が変化した場合だけ React へ通知する。 */
  subscribe: (onStoreChange: () => void) => () => void;
}

/**
 * SSR 用の固定モバイル判定を返す。
 * window や matchMedia を参照しないため、サーバー環境でも安全に呼び出せる。
 *
 * @returns 既存の初回描画契約を表す false。
 * @internal useIsMobile の getServerSnapshot と契約テストだけが利用する。
 */
function getServerMobileViewportSnapshot(): boolean {
  return false;
}

/**
 * 初期 snapshot が false のモバイル viewport store を生成する。
 * 生成処理と getSnapshot は window を参照せず、subscribe が呼ばれた時点で初めて
 * MediaQueryList を作成して現在値と change 通知を取り込む。
 *
 * @returns Hook インスタンス内で安定して保持できる外部ストア。
 * @internal useIsMobile とその契約テストだけが利用する package 非公開 factory。
 * @example
 * ```ts
 * const store = createMobileViewportStore();
 * const unsubscribe = store.subscribe(onStoreChange);
 * ```
 */
function createMobileViewportStore(): MobileViewportStore {
  // 旧 Hook と同じ初回描画を保証し、store 生成中は viewport を読み取らない。
  let snapshot = false;

  const getSnapshot = (): boolean => snapshot;
  const subscribe = (onStoreChange: () => void): (() => void) => {
    // 購読開始後にだけ MediaQueryList を生成し、SSR と render 中の window 参照を防ぐ。
    const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);

    const updateSnapshot = () => {
      // 同じ値では React へ通知せず、実際に分岐結果が変わる場合だけ snapshot を更新する。
      const nextSnapshot = mediaQueryList.matches;
      if (snapshot === nextSnapshot) return;

      snapshot = nextSnapshot;
      onStoreChange();
    };

    // 現在値の取り込み前に listener を登録し、登録と同期の間に発生する change を失わない。
    mediaQueryList.addEventListener('change', updateSnapshot);
    updateSnapshot();

    return () => {
      // 登録時と同じ MediaQueryList と listener を使い、破棄後の通知を確実に停止する。
      mediaQueryList.removeEventListener('change', updateSnapshot);
    };
  };

  return { getSnapshot, subscribe };
}

export { createMobileViewportStore, getServerMobileViewportSnapshot, type MobileViewportStore };
