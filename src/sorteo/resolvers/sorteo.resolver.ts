import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SorteosService } from '../services/sorteo.service';
import { Sorteo } from '../entities/sorteo.entity';
import {
  CreateSorteoInput,
  SuggestNumbersResponse,
  UpdateSorteoInput,
} from '../dto/crud';
import { SuccessResponse } from 'src/utils/response';

@Resolver(() => Sorteo)
export class SorteosResolver {
  constructor(private sorteosService: SorteosService) {}

  @Mutation(() => SuccessResponse)
  async createSorteo(
    @Args('args') args: CreateSorteoInput,
  ): Promise<SuccessResponse> {
    return this.sorteosService.createSorteo(args);
  }

  @Query(() => [Sorteo], { name: 'sorteos' })
  async sorteos(): Promise<Sorteo[]> {
    return this.sorteosService.findAll();
  }

  @Query(() => Sorteo)
  async sorteoByUuid(@Args('uuid') uuid: string): Promise<Sorteo> {
    return this.sorteosService.findByUuid(uuid);
  }

  @Mutation(() => SuccessResponse)
  async updateSorteo(
    @Args('args') args: UpdateSorteoInput,
  ): Promise<SuccessResponse> {
    return this.sorteosService.updateSorteo(args);
  }

  @Mutation(() => SuccessResponse)
  async deleteSorteo(@Args('uuid') uuid: string): Promise<SuccessResponse> {
    return this.sorteosService.deleteSorteo(uuid);
  }

  @Query(() => SuggestNumbersResponse)
  async suggestNumbers(
    @Args('drawDate') drawDate: string,
  ): Promise<SuggestNumbersResponse> {
    return this.sorteosService.suggestNumbersv3(drawDate);
  }
}
