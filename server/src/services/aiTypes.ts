export interface SuggestedItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface AISuggestionResponse {
  items: SuggestedItem[];
  notes: string;
  terms: string;
}
