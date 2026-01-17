import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { JournalLine } from './journal-line.entity';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column()
  description: string;

  @Column({ nullable: true })
  reference_id: string;

  @Column({ default: false })
  is_pending: boolean;

  @Column()
  created_by: string;

  @OneToMany(() => JournalLine, (line) => line.journal_entry, { cascade: true })
  lines: JournalLine[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
