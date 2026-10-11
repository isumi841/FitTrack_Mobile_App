import type { ComponentProps } from 'react';
import type NativePicker from '@react-native-community/datetimepicker';
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export default function ProfileDatePicker({ value, minimumDate, maximumDate, onValueChange }: ComponentProps<typeof NativePicker>) {
  return <input type="date" aria-label="Date of birth" value={localDate(value)} min={minimumDate ? localDate(minimumDate) : undefined} max={maximumDate ? localDate(maximumDate) : undefined}
    style={{ width: '100%', boxSizing: 'border-box', padding: 14, color: '#e7edf3', background: '#20262d', border: '1px solid #38414a', borderRadius: 12, colorScheme: 'dark' }}
    onChange={event => {
      const date = new Date(`${event.target.value}T12:00:00`);
      if (!Number.isFinite(date.getTime())) return;
      onValueChange?.({ nativeEvent: { timestamp: date.getTime(), utcOffset: -date.getTimezoneOffset() } }, date);
    }} />;
}
