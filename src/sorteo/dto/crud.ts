import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class CreateSorteoInput {
  @Field()
  drawDate: string;

  @Field()
  drawTime: string;

  @Field()
  drawNumber: string;

  @Field(() => Int)
  winningNumber: number;

  @Field()
  multiplier: string;

  @Field(() => String)
  multiplierValue: string; // 1 al 9 para que sepas
}

@InputType()
export class UpdateSorteoInput {
  @Field(() => String)
  uuid: string;

  @Field({ nullable: true })
  drawDate?: string;

  @Field({ nullable: true })
  drawTime?: string;

  @Field({ nullable: true })
  drawNumber?: string;

  @Field(() => Int, { nullable: true })
  winningNumber?: number;

  @Field({ nullable: true })
  multiplier?: string;

  @Field(() => String, { nullable: true })
  multiplierValue?: string; // 1 al 9 para que sepas
}

@ObjectType()
export class HitRate {
  @Field(() => String)
  source: string;

  @Field(() => Int)
  hitRate: number;

  @Field(() => Int)
  hits: number;

  @Field(() => Int)
  totalSuggested: number;
}

@ObjectType()
export class Metrics {
  @Field(() => HitRate)
  aiMetrics: HitRate;

  @Field(() => HitRate)
  grokMetrics: HitRate;

  @Field(() => HitRate)
  crossMetrics: HitRate;
}

@ObjectType()
export class SuggestNumbersResponse {
  @Field()
  status: string;

  @Field(() => [Int])
  numbers: number[];

  @Field({ nullable: true })
  message?: string;

  @Field(() => Metrics, { nullable: true })
  metrics?: Metrics;
}
