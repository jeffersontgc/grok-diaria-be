import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Sorteo } from '../entities/sorteo.entity';
import {
  CreateSorteoInput,
  SuggestNumbersResponse,
  UpdateSorteoInput,
} from '../dto/crud';
import { SuccessResponse } from 'src/utils/response';
import { OpenAIService } from 'src/utils/openai';

@Injectable()
export class SorteosService {
  private pubSub: PubSub;

  constructor(
    @InjectRepository(Sorteo)
    private sorteosRepository: Repository<Sorteo>,
    private openAIService: OpenAIService,
  ) {
    this.pubSub = new PubSub();
  }

  async createSorteo(args: CreateSorteoInput): Promise<SuccessResponse> {
    try {
      const sorteo = this.sorteosRepository.create({
        ...args,
        uuid: uuidv4(), // Generar UUID manualmente
      });
      await this.sorteosRepository.save(sorteo);

      return {
        status: 'ok',
      };
    } catch (error) {
      console.error(error);
      return {
        status: 'error',
      };
    }
  }

  async findAll(): Promise<Sorteo[]> {
    const data = await this.sorteosRepository.find({});

    return data;
  }

  async findByUuid(uuid: string): Promise<Sorteo> {
    return this.sorteosRepository.findOneOrFail({ where: { uuid } });
  }

  async updateSorteo(args: UpdateSorteoInput): Promise<SuccessResponse> {
    try {
      const { uuid, ...rest } = args;

      await this.sorteosRepository.update({ uuid }, rest);
      return {
        status: 'ok',
      };
    } catch (error) {
      console.error(error);
      return {
        status: 'error',
      };
    }
  }

  async deleteSorteo(uuid: string): Promise<SuccessResponse> {
    try {
      await this.sorteosRepository.delete({ uuid });
      return {
        status: 'ok',
      };
    } catch (error) {
      console.error(error);
      return {
        status: 'error',
      };
    }
  }

  async suggestNumbersv3(drawDate: string): Promise<SuggestNumbersResponse> {
    try {
      // Validar formato de fecha
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(drawDate)) {
        return {
          status: 'error',
          numbers: [],
          message: 'Invalid date format. Use DD/MM/YYYY',
        };
      }

      // Parsear la fecha
      const [day, month, year] = drawDate.split('/').map(Number);

      // Crear fecha usando UTC para consistencia
      const targetDate = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(targetDate.getTime())) {
        return { status: 'error', numbers: [], message: 'Invalid date' };
      }

      // Validar que la fecha sea futura o de hoy (usando UTC)
      const currentDate = new Date();
      const todayUTC = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate(),
        ),
      );

      if (targetDate < todayUTC) {
        return {
          status: 'error',
          numbers: [],
          message: 'Date must be in the future',
        };
      }

      // --- FUNCIÓN para convertir DD/MM/YYYY a YYYYMMDD para comparación ---
      function toYYYYMMDD(dateStr: string): string {
        const [d, m, y] = dateStr.split('/');
        return `${y}${m.padStart(2, '0')}${d.padStart(2, '0')}`;
      }

      // Obtener sorteos de los últimos 14 días antes de drawDate
      const fourteenDaysAgo = new Date(targetDate);
      fourteenDaysAgo.setUTCDate(targetDate.getUTCDate() - 14);

      // Calcular rangos para comparación
      let startDateStr: string;
      let endDateStr: string;

      try {
        startDateStr = this.toDDMMYYYY(fourteenDaysAgo);
        endDateStr = this.toDDMMYYYY(targetDate);
      } catch (error) {
        console.error('Error formatting dates:', error);
        return {
          status: 'error',
          numbers: [],
          message: 'Error processing date format',
        };
      }

      const allSorteos = await this.sorteosRepository.find();

      const startNum = Number(toYYYYMMDD(startDateStr));
      const endNum = Number(toYYYYMMDD(endDateStr));

      const recentSorteos = allSorteos.filter((s) => {
        const sorteoDateNum = Number(toYYYYMMDD(s.drawDate));
        return sorteoDateNum >= startNum && sorteoDateNum < endNum;
      });

      if (recentSorteos.length === 0) {
        return {
          status: 'error',
          numbers: [],
          message: 'No historical data available for the last 14 days',
        };
      }

      // Obtener sugerencias de OpenAI
      const aiSuggestions = await this.openAIService.suggestNumbers(
        recentSorteos,
        drawDate,
      );

      // Algoritmo original
      const dateDigits = [
        ...String(day || 0)
          .padStart(2, '0')
          .split(''),
        ...String(month || 0)
          .padStart(2, '0')
          .split(''),
        ...String(year || 0)
          .slice(-2)
          .split(''),
      ].map(Number);
      const seed = dateDigits.reduce((a, b) => a + b, 0) % 100;

      const winningNumbers = recentSorteos.map((s) => s.winningNumber);
      const digitCounts: Record<number, number> = {};
      winningNumbers.forEach((num) => {
        const digits = String(num).padStart(2, '0').split('').map(Number);
        digits.forEach((d) => (digitCounts[d] = (digitCounts[d] || 0) + 1));
      });
      const frequentDigits = Object.entries(digitCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([digit]) => Number(digit));

      const combinedDigits = [...dateDigits, ...frequentDigits];
      const candidates: number[] = [];
      for (let i = 0; i < combinedDigits.length - 1; i++) {
        const pair = Number(`${combinedDigits[i]}${combinedDigits[i + 1]}`);
        if (pair <= 99) candidates.push(pair);
      }

      const dynamicNumbers = winningNumbers
        .map((num) => {
          const sum = String(num)
            .split('')
            .reduce((a, b) => Number(a) + Number(b), 0);
          return (sum + seed) % 100;
        })
        .filter((num) => num <= 99);

      const originalSuggestions = [
        ...winningNumbers
          .sort(
            (a, b) =>
              winningNumbers.filter((n) => n === b).length -
              winningNumbers.filter((n) => n === a).length,
          )
          .slice(0, 3),
        Number(`${day}`.padStart(2, '0')),
        Number(`${month}`.padStart(2, '0')),
        Number(String(year).slice(-2)),
        ...candidates.slice(0, 2),
        ...dynamicNumbers.slice(0, 2),
      ]
        .filter((num, index, arr) => arr.indexOf(num) === index)
        .slice(0, 9);

      // Generar Cruz de la Suerte según numerología
      const calculateCross = () => {
        // Números interiores
        const arriba = String(day)
          .split('')
          .reduce((a, b) => Number(a) + Number(b), 0); // Suma dígitos del día
        const derecha =
          String(month + year)
            .split('')
            .reduce((a, b) => Number(a) + Number(b), 0) % 10; // Suma dígitos de mes y año, último dígito
        const abajo =
          String(day + month)
            .split('')
            .reduce((a, b) => Number(a) + Number(b), 0) % 10; // Suma día + mes, reducir a 1 dígito
        const izquierda =
          String(day + month + year)
            .split('')
            .reduce((a, b) => Number(a) + Number(b), 0) % 10; // Suma todos, reducir a 1 dígito

        // Números exteriores
        const exteriorArribaIzquierda = (arriba + izquierda) % 10;
        const exteriorArribaDerecha = (arriba + derecha) % 10;
        const exteriorAbajoDerecha = (abajo + derecha) % 10;
        const exteriorAbajoIzquierda = (izquierda + abajo) % 10;

        // Escalar a rango 0-99 (puede ajustarse según reglas de Loto Nicaragua)
        const scaleNumber = (num: number) => num * 10 + (month % 10);

        return [
          scaleNumber(arriba), // Centro (usamos "arriba" como guía central por simplicidad)
          scaleNumber(derecha), // Derecha
          scaleNumber(abajo), // Abajo
          scaleNumber(izquierda), // Izquierda
          scaleNumber(exteriorArribaIzquierda), // Exterior arriba-izquierda
          scaleNumber(exteriorArribaDerecha), // Exterior arriba-derecha
          scaleNumber(exteriorAbajoDerecha), // Exterior abajo-derecha
          scaleNumber(exteriorAbajoIzquierda), // Exterior abajo-izquierda
        ].filter((n) => n <= 99);
      };

      const luckyCross = calculateCross();

      // Calcular hit rate por fuente basado en datos históricos
      const calculateHitRate = (suggestions: number[], sourceName: string) => {
        let totalHits = 0;
        let totalSuggestions = 0;

        // Verificar cada sugerencia contra TODOS los números ganadores históricos
        suggestions.forEach((suggestion) => {
          const hitsForThisSuggestion = allSorteos.filter(
            (sorteo) => sorteo.winningNumber === suggestion,
          ).length;

          totalHits += hitsForThisSuggestion;
          totalSuggestions += 1;
        });

        const hitRate =
          totalSuggestions > 0
            ? Math.round((totalHits / totalSuggestions) * 100)
            : 0;
        return {
          source: sourceName,
          hitRate,
          hits: totalHits,
          totalSuggested: totalSuggestions,
        };
      };

      const aiMetrics = calculateHitRate(aiSuggestions, 'Sugerencias de IA');
      const grokMetrics = calculateHitRate(
        originalSuggestions,
        'Algoritmo Grok',
      );
      const crossMetrics = calculateHitRate(luckyCross, 'Cruz de la Suerte');

      // Combinar sugerencias
      const finalSuggestions = [
        ...(aiSuggestions.length > 0 ? aiSuggestions : []),
        ...originalSuggestions,
        ...luckyCross,
      ]
        .filter(
          (num, index, arr) =>
            arr.indexOf(num) === index && num >= 0 && num <= 99,
        )
        .slice(0, 9);

      return {
        status: 'ok',
        numbers: finalSuggestions,
        metrics: { aiMetrics, grokMetrics, crossMetrics },
      };
    } catch (error) {
      console.error('Error in suggestNumbers:', error);
      return {
        status: 'error',
        numbers: [],
        message: 'Failed to generate suggestions',
      };
    }
  }

  toDDMMYYYY(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid date provided to toDDMMYYYY');
    }

    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  getPubSub() {
    return this.pubSub;
  }
}
