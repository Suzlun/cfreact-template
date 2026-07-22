import { cn } from '@cfreact-template/ui/lib/utils';

/**
 * キーボードから入力する単一キーまたはキー表記を、意味的な `kbd` 要素として表示する。
 *
 * @param props native `kbd` 要素へ渡す属性と、既定の外観へ追加する `className`。
 * @returns light／dark の両テーマでキー表記を判読できる `kbd` 要素。
 * @example
 * <Kbd>Ctrl</Kbd>
 */
function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  );
}

/**
 * 複数のキー表記を、公式構成と同じ一つの意味的な `kbd` グループへまとめる。
 *
 * @param props 実際に描画する native `kbd` 要素の属性と、配置を調整する `className`。
 * @returns 子の `Kbd` を同一キー操作として並べる `kbd` 要素。
 * @example
 * <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>
 */
function KbdGroup({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
