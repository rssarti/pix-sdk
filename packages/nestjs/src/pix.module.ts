import { type DynamicModule, Global, Module, type InjectionToken } from '@nestjs/common';
import { PixSDK, type PixPlugin, type PixProvider } from '@rssarti/pix-core';
import { PixService } from './pix.service.js';
import { PIX_PROVIDER, PIX_SDK } from './tokens.js';

export interface PixModuleOptions {
  provider: PixProvider;
  plugins?: PixPlugin[];
  webhookSecret?: string;
}

export interface PixModuleAsyncOptions {
  useFactory: (...args: unknown[]) => PixModuleOptions | Promise<PixModuleOptions>;
  inject?: InjectionToken[];
}

@Global()
@Module({})
export class PixModule {
  static forRoot(options: PixModuleOptions): DynamicModule {
    return {
      module: PixModule,
      providers: [
        { provide: PIX_SDK, useValue: new PixSDK(options) },
        { provide: PIX_PROVIDER, useValue: options.provider },
        PixService,
      ],
      exports: [PixService, PIX_SDK],
    };
  }

  static forRootAsync(options: PixModuleAsyncOptions): DynamicModule {
    return {
      module: PixModule,
      providers: [
        {
          provide: PIX_SDK,
          useFactory: async (...args: unknown[]) => {
            const config = await options.useFactory(...args);
            return new PixSDK(config);
          },
          inject: options.inject ?? [],
        },
        PixService,
      ],
      exports: [PixService, PIX_SDK],
    };
  }
}
