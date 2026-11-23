import { FieldError } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BaseProps = {
  name: string;
  label: string;
  errors?: string[];
  hint?: string;
  className?: string;
};

/** Ô nhập có nhãn, gợi ý và lỗi (NFR-12: mọi ô nhập có nhãn). */
export function TextField({
  name,
  label,
  errors,
  hint,
  className,
  ...props
}: BaseProps & Omit<React.ComponentProps<"input">, "name">) {
  const id = props.id ?? `field-${name}`;
  const describedBy = [errors?.length ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} errors={errors} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  errors,
  hint,
  className,
  ...props
}: BaseProps & Omit<React.ComponentProps<"textarea">, "name">) {
  const id = props.id ?? `field-${name}`;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} errors={errors} />
    </div>
  );
}

export const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm";

export function SelectField({
  name,
  label,
  errors,
  hint,
  className,
  children,
  ...props
}: BaseProps & Omit<React.ComponentProps<"select">, "name">) {
  const id = props.id ?? `field-${name}`;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        className={selectClassName}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${id}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
      <FieldError id={`${id}-error`} errors={errors} />
    </div>
  );
}
