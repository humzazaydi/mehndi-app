import { Injectable, signal, computed } from '@angular/core';
import { BookingWizardData } from '../../../core/models';

const PHONE_RE = /^0[0-9]{9,10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY: BookingWizardData = {
  artistId: null, packageId: null, addonIds: [], date: null, timeSlot: null,
  fullName: '', phone: '', altPhone: '', email: '', address: '',
  locationLat: null, locationLng: null, locationAddress: null,
  notes: '', totalAmount: 0, advanceAmount: 0, termsAccepted: false,
};

@Injectable({ providedIn: 'root' })
export class BookingWizardService {
  readonly data = signal<BookingWizardData>({ ...EMPTY });
  readonly currentStep = signal(0);
  readonly totalSteps = 5;

  patch(partial: Partial<BookingWizardData>): void {
    this.data.update(d => ({ ...d, ...partial }));
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
  }

  reset(): void {
    this.data.set({ ...EMPTY });
    this.currentStep.set(0);
  }

  stepValid = computed(() => {
    const d = this.data();
    const s = this.currentStep();
    switch (s) {
      case 0: return !!d.artistId && !!d.packageId;
      case 1: return !!d.date && !!d.timeSlot;
      case 2: return true;
      case 3: return (
        !!d.fullName &&
        PHONE_RE.test(d.phone) &&
        EMAIL_RE.test(d.email) &&
        !!d.address
      );
      case 4: return d.termsAccepted;
      default: return false;
    }
  });
}
