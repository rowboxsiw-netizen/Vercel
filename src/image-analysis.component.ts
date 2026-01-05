
import { Component, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Component({
  selector: 'app-image-analysis',
  templateUrl: './image-analysis.component.html',
  styleUrls: ['./image-analysis.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageAnalysisComponent {
  imageUrl = input.required<string>();

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
    this.analysisResult.set(''); // Reset to empty string for streaming
    this.analysisError.set(null);

    try {
      const imagePart = await this.urlToGenerativePart(this.imageUrl(), 'image/jpeg');

      const prompt = `
        You are a web performance and security expert. Analyze this image and provide a brief,
        actionable report on its optimization for web use. Focus on aspects like compression,
        format, dimensions, and any potential security considerations for an image displayed
        on a website (e.g., sensitive metadata, steganography risks). Format the response as simple markdown.
        Use headings for different sections.`;

      const stream = await this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
      });

      for await (const chunk of stream) {
        this.analysisResult.update(currentValue => (currentValue ?? '') + chunk.text);
      }

    } catch (error) {
      console.error('Gemini API Error:', error);
      this.analysisError.set(`Failed to analyze the image. Please ensure your API key is configured correctly and check the console for more details.`);
      this.analysisResult.set(null); // Clear any partial results on error
    } finally {
      this.isLoading.set(false);
    }
  }
}
