import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto, CreateExpenseCategoryDto } from './create-expense.dto';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
export class UpdateExpenseCategoryDto extends PartialType(CreateExpenseCategoryDto) {}
