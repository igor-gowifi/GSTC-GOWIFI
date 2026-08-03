import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  label: string;
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
}

export default function DateRangePicker({
  label,
  startDate,
  endDate,
  onDateChange,
  onClear
}: DateRangePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    flatpickr(inputRef.current, {
      mode: 'range',
      locale: Portuguese,
      dateFormat: 'd/m/Y',
      defaultDate: startDate && endDate ? [startDate, endDate] : [],
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          const start = selectedDates[0].toISOString().split('T')[0];
          const end = selectedDates[1].toISOString().split('T')[0];
          onDateChange(start, end);
        }
      },
      plugins: []
    });
  }, []);

  // Format dates for display
  const formatDateDisplay = () => {
    if (!startDate || !endDate) return 'Selecionar período';
    const start = new Date(startDate).toLocaleDateString('pt-BR');
    const end = new Date(endDate).toLocaleDateString('pt-BR');
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs md:text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Selecionar período"
            className="w-full pl-10 pr-3 py-2 text-xs md:text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            readOnly
          />
        </div>
        {(startDate || endDate) && onClear && (
          <Button
            onClick={onClear}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
