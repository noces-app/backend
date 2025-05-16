import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event title',
    example: 'Tech Conference 2025',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: 'A conference about the latest technology trends',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Event date',
    example: '2025-06-15T09:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'Event location',
    example: 'Conference Center, New York',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Is the event public?',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic: boolean = false;
}
