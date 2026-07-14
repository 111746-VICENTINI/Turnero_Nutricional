import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ClinicalFileResponseDTO, MedicalHistoryResponseDTO } from '../../models/history-clinical-model';
import { HistoryClinicalService } from '../../services/history-clinical-service';

@Component({
  selector: 'app-tab-files',
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule],
  templateUrl: './tab-files.html',
  styleUrl: './tab-files.css',
})
export class TabFiles implements OnChanges, OnDestroy {
  @Input({ required: true }) history!: MedicalHistoryResponseDTO;
  @Output() saved = new EventEmitter<void>();

  private historyService = inject(HistoryClinicalService);
  private messageService = inject(MessageService);
  private sanitizer = inject(DomSanitizer);

  fileTypes = [
    'Plan alimentario',
    'Registro comidas',
    'Antropometria',
    'Menu',
    'Receta',
    'Analisis',
    'Imagen'
  ];
  acceptedTypes = '.pdf,.jpg,.jpeg,.png,.docx';
  files: ClinicalFileResponseDTO[] = [];
  selectedFile?: File;
  selectedType = 'Analisis';
  comment = '';
  professional = '';
  date = new Date().toISOString().slice(0, 10);
  uploading = false;
  dragging = false;
  previewFileName = '';
  previewUrl?: SafeResourceUrl;
  previewKind: 'image' | 'pdf' | null = null;
  private previewObjectUrl?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history']) {
      this.files = [...(this.history.files ?? [])];
      this.refreshFiles();
    }
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  get groupedCounts() {
    return this.fileTypes.map((type) => ({
      type,
      count: this.files.filter((file) => file.type === type).length,
    }));
  }

  get canUpload(): boolean {
    return !!this.selectedFile && !this.uploading;
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickFile(input.files?.[0]);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(): void {
    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    this.pickFile(event.dataTransfer?.files?.[0]);
  }

  upload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploading = true;
    this.historyService
      .uploadFile(
        this.history.id,
        this.selectedFile,
        this.selectedType,
        this.comment,
        this.date,
        this.professional
      )
      .subscribe({
        next: () => {
          this.uploading = false;
          this.selectedFile = undefined;
          this.comment = '';
          this.date = new Date().toISOString().slice(0, 10);
          this.messageService.add({
            severity: 'success',
            summary: 'Archivo guardado',
            detail: 'El adjunto quedo vinculado a la historia clinica.',
          });
          this.refreshFiles();
          this.saved.emit();
        },
        error: () => {
          this.uploading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo subir',
            detail: 'Revisa el tipo de archivo o intenta nuevamente.',
          });
        },
      });
  }

  preview(file: ClinicalFileResponseDTO): void {
    if (!file.previewable) {
      this.messageService.add({
        severity: 'info',
        summary: 'Vista previa no disponible',
        detail: 'Este tipo de archivo puede descargarse para revisarlo.',
      });
      return;
    }

    this.historyService.previewFile(file.id).subscribe({
      next: (blob) => {
        this.revokePreview();
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
        this.previewFileName = file.originalName;
        this.previewKind = file.contentType.startsWith('image/') ? 'image' : 'pdf';
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo abrir',
          detail: 'Intenta descargar el archivo.',
        });
      },
    });
  }

  download(file: ClinicalFileResponseDTO): void {
    this.historyService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo descargar',
          detail: 'Intenta nuevamente en unos segundos.',
        });
      },
    });
  }

  delete(file: ClinicalFileResponseDTO): void {
    this.historyService.deleteFile(file.id).subscribe({
      next: () => {
        this.files = this.files.filter((item) => item.id !== file.id);
        this.saved.emit();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: 'Intenta nuevamente en unos segundos.',
        });
      },
    });
  }

  closePreview(): void {
    this.previewFileName = '';
    this.previewKind = null;
    this.revokePreview();
  }

  formatSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private refreshFiles(): void {
    if (!this.history?.id) {
      return;
    }

    this.historyService.listFiles(this.history.id).subscribe({
      next: (files) => {
        this.files = files;
      },
    });
  }

  private pickFile(file?: File): void {
    if (!file) {
      return;
    }

    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowed.includes(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formato no permitido',
        detail: 'Usa PDF, JPG, PNG o DOCX.',
      });
      return;
    }

    this.selectedFile = file;
  }

  private revokePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = undefined;
    }
    this.previewUrl = undefined;
  }
}
