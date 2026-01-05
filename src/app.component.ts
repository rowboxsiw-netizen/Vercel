
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { GoogleGenAI } from '@google/genai';

interface ImageInfo {
  id: number;
  src: string;
  alt: string;
  fetchpriority: 'high' | 'low' | 'auto';
  title: string;
  description: string;
  isLCP: boolean;
  codeSnippet: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class AppComponent {
  readonly images = signal<ImageInfo[]>([
    {
      id: 1,
      src: 'https://picsum.photos/seed/lcp/1200/800',
      alt: 'A stunning high-resolution landscape, prioritized for fast loading.',
      fetchpriority: 'high',
      title: 'High Priority (LCP)',
      description: 'This image is critical for the initial user experience (Largest Contentful Paint). We give it a high priority to signal the browser to download it immediately.',
      isLCP: true,
      codeSnippet: `<img ngSrc="..." priority>`
    },
    {
      id: 2,
      src: 'https://picsum.photos/seed/secondary/800/600',
      alt: 'A secondary image that is visible but not critical.',
      fetchpriority: 'auto',
      title: 'Auto Priority (Default)',
      description: 'This image is left to the browser\'s discretion. The browser will apply its own heuristics to decide when to download it, which is the default behavior.',
      isLCP: false,
      codeSnippet: `<img src="..." fetchpriority="auto">`
    },
    {
      id: 3,
      src: 'https://picsum.photos/seed/lowpriority/800/600',
      alt: 'A low-priority image, perhaps for a section further down the page.',
      fetchpriority: 'low',
      title: 'Low Priority (Deferred)',
      description: 'This image is not important for the initial view. We signal the browser to deprioritize its download, freeing up bandwidth for more critical resources.',
      isLCP: false,
      codeSnippet: `<img src="..." fetchpriority="low" loading="lazy">`
    }
  ]);

  readonly isLoading = signal(false);
  readonly analysisResult = signal<string | null>(null);
  readonly analysisError = signal<string | null>(null);

  private readonly ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

  private async urlToGenerativePart(url: string, mimeType: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };
  }

  async analyzeImage() {
    this.isLoading.set(true);
    this.analysisResult.set(null);
    this.analysisError.set(null);

    try {
      const lcpImage = this.images().find(img => img.isLCP);
      if (!lcpImage) {
        throw new Error('LCP image not found.');
      }

      const imagePart = await this.urlToGenerativePart(lcpImage.src, 'image/jpeg');

      const prompt = `
        You are a web performance and security expert. Analyze this image and provide a brief,
        actionable report on its optimization for web use. Focus on aspects like compression,
        format, dimensions, and any potential security considerations for an image displayed
        on a website (e.g., sensitive metadata, steganography risks). Format the response as simple markdown.
        Use headings for different sections.`;
      
      const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, { text: prompt }] },
      });
      
      this.analysisResult.set(response.text);

    } catch (error) {
      console.error('Gemini API Error:', error);
      this.analysisError.set(`Failed to analyze the image. Please ensure your API key is configured correctly and check the console for more details.`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
