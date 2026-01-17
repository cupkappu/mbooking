import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

export enum ProviderType {
  REST_API = 'rest_api',
  JS_PLUGIN = 'js_plugin',
}

export interface ProviderConfig {
  api_url?: string;
  api_key?: string;
  timeout?: number;
  refresh_interval?: number;
  [key: string]: any;
}

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProviderType.REST_API,
  })
  provider_type: ProviderType;

  @Column({ type: 'jsonb', nullable: true })
  config: ProviderConfig;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
