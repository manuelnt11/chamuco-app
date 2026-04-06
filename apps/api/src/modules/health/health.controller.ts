import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns the health status of the application. Used by Cloud Run for readiness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'The application is healthy and ready to receive traffic',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
        info: {
          type: 'object',
          nullable: true,
        },
        error: {
          type: 'object',
          nullable: true,
        },
        details: {
          type: 'object',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'The application is unhealthy',
  })
  check(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([]);
  }
}
