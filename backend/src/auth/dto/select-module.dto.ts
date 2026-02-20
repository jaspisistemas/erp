import { IsOptional, IsString } from 'class-validator';

export class SelectModuleDto {
  @IsString()
  @IsOptional()
  moduleId?: string;
}
