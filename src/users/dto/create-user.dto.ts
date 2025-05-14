import { IsString, IsEmail, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User roles',
    example: ['user'],
    required: false,
    default: ['user'],
  })
  @IsArray()
  @IsOptional()
  roles?: string[];

  @ApiProperty({
    description: 'Keycloak ID',
    example: '12345678-1234-1234-1234-123456789012',
    required: false,
  })
  @IsString()
  @IsOptional()
  keycloakId?: string;
}
