import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SuccessResponse {
  @Field()
  status: string;
}

@ObjectType()
export class SuggestNumbersResponse {
  @Field()
  status: string;

  @Field(() => [Number])
  numbers: number[];

  @Field({ nullable: true })
  message?: string;
}
