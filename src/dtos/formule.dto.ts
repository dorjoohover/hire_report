export class FormuleDto {
  name: string;

  formula: string;
  variables: number[];
  groupBy: string[];
  aggregations: {
    field: string;
    operation: string;
  }[];
  filters?: {
    [key: string]: any;
  };

  limit?: number;

  order?: string;

  sort: boolean;
  category?: number;
}
