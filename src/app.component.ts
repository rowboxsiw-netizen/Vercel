
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ImageAnalysisComponent } from './image-analysis.component';

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
  imports: [NgOptimizedImage, ImageAnalysisComponent],
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
}
