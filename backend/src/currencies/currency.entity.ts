import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

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

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
