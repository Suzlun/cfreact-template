import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SafeHTML } from './SafeHTML.js';

describe('SafeHTML', () => {
  describe('基本的な HTML レンダリング', () => {
    it('安全な HTML を正しくレンダリングする', () => {
      const html = '<p>Hello World</p>';
      render(<SafeHTML html={html} />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('複数のタグを含む HTML をレンダリングする', () => {
      const html = '<div><h1>Title</h1><p>Content</p></div>';
      render(<SafeHTML html={html} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('テキスト装飾タグを正しくレンダリングする', () => {
      const html = '<p><strong>Bold</strong> <em>Italic</em></p>';
      const { container } = render(<SafeHTML html={html} />);

      const strong = container.querySelector('strong');
      const em = container.querySelector('em');

      expect(strong).toBeInTheDocument();
      expect(strong).toHaveTextContent('Bold');
      expect(em).toBeInTheDocument();
      expect(em).toHaveTextContent('Italic');
    });
  });

  describe('XSS 攻撃の防御', () => {
    it('script タグを削除する', () => {
      const html = '<p>Safe content</p><script>alert("XSS")</script>';
      const { container } = render(<SafeHTML html={html} />);

      expect(screen.getByText('Safe content')).toBeInTheDocument();
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('onclick などのイベントハンドラを削除する', () => {
      const html = '<button onclick="alert(\'XSS\')">Click me</button>';
      const { container } = render(<SafeHTML html={html} />);

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('onclick');
    });

    it('危険なプロトコルを含むリンクを削除する', () => {
      const dangerousProtocol = 'javascript';
      const html = `<a href="${dangerousProtocol}:alert('XSS')">Click</a>`;
      const { container } = render(<SafeHTML html={html} />);

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      // DOMPurify は危険な href を削除または無効化する
      expect(link?.getAttribute('href')).toBeNull();
    });

    it('data: プロトコルを含む画像を削除する', () => {
      const html = '<img src="data:text/html,<script>alert(\'XSS\')</script>" />';
      const { container } = render(<SafeHTML html={html} />);

      const img = container.querySelector('img');
      // DOMPurify は危険な src を削除するため、img タグが削除される
      expect(img).not.toBeInTheDocument();
    });
  });

  describe('リンクと画像', () => {
    it('安全な URL のリンクをレンダリングする', () => {
      const html = '<a href="https://example.com">Link</a>';
      const { container } = render(<SafeHTML html={html} />);

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveTextContent('Link');
    });

    it('安全な画像をレンダリングする', () => {
      const html = '<img src="https://example.com/image.jpg" alt="Test Image" />';
      const { container } = render(<SafeHTML html={html} />);

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', 'Test Image');
    });
  });

  describe('カスタムクラス名', () => {
    it('カスタムクラス名を適用する', () => {
      const html = '<p>Content</p>';
      const { container } = render(<SafeHTML html={html} className="custom-class" />);

      const div = container.querySelector('.custom-class');
      expect(div).toBeInTheDocument();
    });
  });

  describe('カスタムサニタイズ設定', () => {
    it('カスタム設定で許可タグを制限できる', () => {
      const html = '<p>Paragraph</p><strong>Bold</strong>';
      const { container } = render(
        <SafeHTML html={html} sanitizeOptions={{ ALLOWED_TAGS: ['p'] }} />
      );

      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      const strong = container.querySelector('strong');
      expect(strong).not.toBeInTheDocument();
    });

    it('カスタム設定で許可属性を制限できる', () => {
      const html = '<a href="https://example.com" title="Example">Link</a>';
      const { container } = render(
        <SafeHTML
          html={html}
          sanitizeOptions={{
            ALLOWED_TAGS: ['a'],
            ALLOWED_ATTR: ['href'], // title は許可しない
          }}
        />
      );

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).not.toHaveAttribute('title');
    });
  });

  describe('マークダウン HTML のサポート', () => {
    it('マークダウンから生成された HTML をレンダリングする', () => {
      // 典型的なマークダウンパーサーの出力
      const html = `
        <h1>Title</h1>
        <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
      const { container } = render(<SafeHTML html={html} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();

      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(2);
    });
  });
});
