import { IsNotEmpty , IsString  } from "class-validator";
export class RegisterClientDto {
  @IsString()
  @IsNotEmpty()
  appName!:string

  @IsString()
  @IsNotEmpty()
  clientSecret!:string

  @IsString()
  @IsNotEmpty()
  clientUrl!:string

  @IsString()
  description?:string

  @IsString()
  cookieName?:string
}
