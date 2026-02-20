import { IsInt, Min } from 'class-validator';

export class SelectCompanyDto {
  @IsInt()
  @Min(1)
  empCod!: number;
}
