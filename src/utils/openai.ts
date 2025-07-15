import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Sorteo } from '../sorteo/entities/sorteo.entity';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('config.openai.apiKey'),
    });
  }

  async suggestNumbers(sorteos: Sorteo[], drawDate: string): Promise<number[]> {
    // Máximo de intentos
    const maxRetries = 3;

    // Intento actual
    let attempt = 0;

    // Mientras el intento sea menor al máximo de intentos
    while (attempt < maxRetries) {
      try {
        // Usar el modelo gpt-4o
        const prompt = `
          You are an expert in pattern analysis for lottery number prediction. Below is a list of lottery results from the last 14 days, with fields: drawDate (DD/MM/YYYY), drawTime (e.g., '11:00 AM'), drawNumber, winningNumber (0-99), multiplier (e.g., '2x', 'Gratis'), and multiplierValue. Your task is to analyze these results and suggest up to 5 likely two-digit numbers (0-99) for the next lottery draw on ${drawDate}. Focus on:
          - Frequency of winning numbers.
          - Patterns related to drawTime (e.g., numbers more common in morning vs. evening).
          - Influence of multipliers on number trends.
          - Temporal patterns in drawDate.
          Return only a JSON array of numbers, e.g., [12, 34, 56, 78, 90].

          Recent results:
          ${JSON.stringify(sorteos, null, 2)}

          Suggest numbers for ${drawDate}:
        `;

        // Usar el modelo gpt-4o
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        });

        // Parsear la respuesta como un array de números
        const suggestedNumbers = JSON.parse(
          response.choices[0].message.content || '[]',
        ) as number[];

        // Filtrar los números para que estén entre 0 y 99
        return suggestedNumbers
          .filter((num) => num >= 0 && num <= 99)
          .slice(0, 5);
      } catch (error) {
        attempt++;
        console.error(
          `OpenAI API error (attempt ${attempt}/${maxRetries}):`,
          error,
        );
        if (attempt === maxRetries) {
          return [];
        }
        // Esperar antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return [];
  }
}
