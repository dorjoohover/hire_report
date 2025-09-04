export class CreateOtp {
  oldPassword: string;

  password: string;
}

export class CreateUserDto {
  password?: string;

  email: string;

  role?: number;

  phone?: string;

  organizationPhone?: string;

  position?: string;

  organizationRegisterNumber?: string;

  organizationName?: string;

  lastname?: string;

  firstname?: string;

  profile?: string;
  wallet?: number;
  emailVerified?: boolean;
}

export class PasswordDto {
  password: string;

  email: string;
}
export class UserDto {
  email: string;

  phone: string;

  password: string;

  lastname: string;

  firstname: string;
}

export class OrganizationDto {
  password: string;

  email: string;

  phone: string;

  organizationPhone: string;

  position: string;

  organizationRegisterNumber: string;

  organizationName: string;

  lastname: string;

  firstname: string;
}

export class PaymentUserDto {
  price: number;

  id: number;
}

export const UserExampleDto = {
  phone: '88666515',
  firstname: 'dorj',
  lastname: 'hover',
  password: 'string',
  email: 'dorjoohover@gmail.com',
};

export const OrganizationExampleDto = {
  password: 'string',
  email: 'example@hire.mn',
  phone: '88009900',
  organizationPhone: '99009900',
  position: 'string',
  organizationRegisterNumber: '0011000',
  organizationName: 'hiremn',
  lastname: 'hire',
  firstname: 'mn',
};

export class EmailSend {
  email: string;
}
export class UpdateUserDto extends CreateUserDto {
  id: number;
}
