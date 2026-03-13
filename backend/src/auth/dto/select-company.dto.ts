import { IsInt, Min } from 'class-validator';
import { IsOptional } from 'class-validator';

export class SelectCompanyDto {
  @IsInt()
  @Min(1)
  empCod!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  filCod?: number;
}
