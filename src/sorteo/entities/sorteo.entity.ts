import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
@Entity('sorteo')
export class Sorteo {
  @Field(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Field(() => String)
  uuid: string;

  @Field(() => String)
  @Column()
  drawDate: string; // Formato: DD/MM/YYYY

  @Field(() => String)
  @Column()
  drawTime: string; // Ej. '11:00 AM', '3:00 PM', '6:00 PM', '9:00 PM'

  @Field(() => String)
  @Column()
  drawNumber: string; // Ej. '#11570' opcional

  @Field(() => String)
  @Column()
  winningNumber: number; // 00-99

  @Field(() => String)
  @Column()
  multiplier: string; // Ej. 'Gratis', '2x', '3x', '4x', '5x', 'JGMAS'

  @Field(() => String)
  @Column()
  multiplierValue: string; // Ej. 1 al 9 para que sepas
}
