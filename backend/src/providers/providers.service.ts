import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider, ProviderType } from './provider.entity';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
  ) {}

  async findAll(): Promise<Provider[]> {
    return this.providerRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Provider | null> {
    return this.providerRepository.findOne({ where: { id } });
  }

  async create(data: CreateProviderDto): Promise<Provider> {
    const provider = this.providerRepository.create({
      ...data,
      config: data.config || {},
    });
    return this.providerRepository.save(provider);
  }

  async update(id: string, data: UpdateProviderDto): Promise<Provider> {
    const provider = await this.findById(id);
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    if (data.config) {
      provider.config = {
        ...provider.config,
        ...data.config,
      };
    }

    Object.assign(provider, data);
    return this.providerRepository.save(provider);
  }

  async delete(id: string): Promise<void> {
    const provider = await this.findById(id);
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    provider.is_active = false;
    await this.providerRepository.save(provider);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const provider = await this.findById(id);
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    if (provider.provider_type === ProviderType.REST_API) {
      return this.testRestApiConnection(provider);
    }

    return { success: true, message: 'Plugin provider - connection test not applicable' };
  }

  private async testRestApiConnection(provider: Provider): Promise<{ success: boolean; message: string }> {
    const apiUrl = provider.config?.api_url;
    if (!apiUrl) {
      return { success: false, message: 'API URL not configured' };
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.config?.api_key && { 'Authorization': `Bearer ${provider.config.api_key}` }),
        },
        signal: AbortSignal.timeout(provider.config?.timeout || 5000),
      });

      if (response.ok) {
        return { success: true, message: 'API connection successful' };
      } else {
        return { success: false, message: `API returned status ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}
