import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('currencies')
export class Currency {
  @PrimaryColumn({ length: 10 })
  code: string;

  @Column()
  name: string;

  @Column({ length: 10, nullable: true })
  symbol: string;

  @Column({ type: 'int', default: 2 })
  decimal_places: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
