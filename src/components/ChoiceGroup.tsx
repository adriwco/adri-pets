interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChoiceGroupProps<T extends string> {
  name: string;
  legend: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export function ChoiceGroup<T extends string>({ name, legend, options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <fieldset class="space-y-2">
      <legend class="text-sm font-medium text-ink">{legend}</legend>
      <div class="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} class="choice">
            <input
              type="radio"
              class="sr-only"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
