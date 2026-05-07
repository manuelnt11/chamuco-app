import { Global, Module } from '@nestjs/common';
import { AssetResolverService } from './asset-resolver.service';

@Global()
@Module({
  providers: [AssetResolverService],
  exports: [AssetResolverService],
})
export class AssetsModule {}
