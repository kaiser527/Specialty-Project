import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVnPayPaymentDto {
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  ipAddr: string;
}

export class VerifyReturnUrlDto {
  @IsNotEmpty()
  @IsString()
  vnp_TxnRef: string;

  @IsNotEmpty()
  @IsString()
  vnp_OrderInfo: string;

  @IsNotEmpty()
  @IsNumberString()
  vnp_Amount: string;

  @IsOptional()
  @IsString()
  vnp_TmnCode?: string;

  @IsOptional()
  @IsString()
  vnp_BankCode?: string;

  @IsOptional()
  @IsString()
  vnp_BankTranNo?: string;

  @IsOptional()
  @IsString()
  vnp_CardType?: string;

  @IsOptional()
  @IsNumberString()
  vnp_PayDate?: string;

  @IsOptional()
  @IsNumberString()
  vnp_TransactionNo?: string;

  @IsNotEmpty()
  @IsNumberString()
  vnp_ResponseCode: string;

  @IsOptional()
  @IsNumberString()
  vnp_TransactionStatus?: string;

  @IsOptional()
  @IsString()
  vnp_SecureHashType?: string;

  @IsNotEmpty()
  @IsString()
  vnp_SecureHash: string;
}
