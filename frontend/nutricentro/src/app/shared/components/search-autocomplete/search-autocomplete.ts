import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-search-autocomplete',
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule
  ],
  templateUrl: './search-autocomplete.html',
  styleUrl: './search-autocomplete.css'
})
/** Reutiliza un buscador autocomplete con limpieza rapida y soporte de texto libre. */
export class SearchAutocomplete {
  private readonly generatedLabelKey = '__searchAutocompleteLabel';

  private valueModel: unknown;
  @Input()
  set value(value: unknown) {
    this.valueModel = value;
  }
  get value(): unknown {
    return this.withGeneratedLabel(this.valueModel);
  }
  private suggestionsValue: unknown[] = [];
  @Input()
  set suggestions(value: unknown[]) {
    this.suggestionsValue = value ?? [];
  }
  get suggestions(): unknown[] {
    return this.suggestionsValue.map(item => this.withGeneratedLabel(item));
  }
  @Input() placeholder = 'Buscar';
  @Input() ariaLabel = 'Buscar';
  @Input() forceSelection = false;
  @Input() optionLabel?: string;
  @Input() labelFn: (item: unknown) => string = item => String(item ?? '');
  @Input() detailFn: (item: unknown) => string = () => '';

  @Output() valueChange = new EventEmitter<unknown>();
  @Output() complete = new EventEmitter<{query: string}>();
  @Output() selected = new EventEmitter<unknown>();
  @Output() cleared = new EventEmitter<void>();

  /** Sincroniza cambios de texto o seleccion desde el autocomplete. */
  onModelChange(value: unknown): void {
    this.value = this.withGeneratedLabel(value);
    if (!this.forceSelection || typeof value !== 'string') {
      this.valueChange.emit(this.value);
    }
  }

  /** Emite la seleccion final del usuario. */
  onSelect(event: {value?: unknown}): void {
    const selectedValue = this.withGeneratedLabel(event.value ?? this.value);
    this.value = selectedValue;
    this.valueChange.emit(selectedValue);
    this.selected.emit(selectedValue);
  }

  /** Limpia el buscador desde X, ESC o clear interno. */
  clear(): void {
    this.value = '';
    this.valueChange.emit('');
    this.cleared.emit();
  }

  /** Devuelve la etiqueta principal del resultado. */
  labelOf(item: unknown): string {
    return this.labelFn(item);
  }

  /** Devuelve el detalle secundario del resultado. */
  detailOf(item: unknown): string {
    return this.detailFn(item);
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && String(this.value).trim() !== '';
  }

  get resolvedOptionLabel(): string | undefined {
    if (this.optionLabel) {
      return this.optionLabel;
    }
    return [this.valueModel, ...this.suggestionsValue].some(item => item && typeof item === 'object')
      ? this.generatedLabelKey
      : undefined;
  }

  private withGeneratedLabel(item: unknown): unknown {
    if (!item || typeof item !== 'object' || this.optionLabel) {
      return item;
    }
    const labeledItem = item as Record<string, unknown>;
    labeledItem[this.generatedLabelKey] = this.labelFn(item);
    return labeledItem;
  }
}
