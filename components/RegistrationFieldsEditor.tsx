"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Field = {
  id: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN" | "CHECKBOX";
  required: boolean;
  options: string[] | null;
};

type RegistrationFieldsEditorProps = {
  eventId: string;
  initialFields: Field[];
};

type Status = "idle" | "loading" | "success" | "error";

export default function RegistrationFieldsEditor({
  eventId,
  initialFields,
}: RegistrationFieldsEditorProps) {
  const { pushToast } = useToast();
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [fieldType, setFieldType] = useState("TEXT");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const type = String(formData.get("type") || "TEXT");
    const optionsValue = formData.get("options");
    const optionsRaw = optionsValue ? String(optionsValue) : "";
    const options = optionsRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      label: String(formData.get("label") || ""),
      type,
      required: formData.get("required") === "on",
      options,
    };

    try {
      const response = await fetch(
        `/api/events/${eventId}/registration-fields`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("idle");
        pushToast(data?.error || "Unable to add field.", "error");
        return;
      }

      const data = (await response.json()) as { field: Field };
      setFields((prev) => [...prev, data.field]);
      setStatus("idle");
      pushToast("Field added.", "success");
      form.reset();
      setFieldType("TEXT");
    } catch (error) {
      setStatus("idle");
      pushToast("Network error. Try again.", "error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
              Fixed Fields
            </p>
            <h3 className="text-lg font-semibold text-[#1b1a18]">
              Always included on every registration
            </h3>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {["Full name", "Email", "Phone number", "Age", "Gender"].map(
            (label) => (
            <span
              key={label}
              className="rounded-full border border-[#d9c9b9] bg-[#fbf8f2] px-4 py-2 text-sm text-[#3f352c]"
            >
              {label}
            </span>
            )
          )}
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Custom Questions
          </p>
          <div className="mt-4 space-y-3">
            {fields.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9c9b9] p-6 text-sm text-[#6b5a4a]">
                No extra questions yet. Add a custom field to personalize the
                form.
              </div>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0e4d8] bg-[#fbf8f2] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1b1a18]">
                      {field.label}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#7a5b48]">
                      {field.type}
                      {field.required ? " · Required" : ""}
                    </p>
                  </div>
                  {field.options && field.options.length > 0 ? (
                    <div className="flex flex-wrap gap-2 text-xs text-[#5b4a3d]">
                      {field.options.map((option) => (
                        <span
                          key={option}
                          className="rounded-full border border-[#d9c9b9] px-3 py-1"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e3d6c8] bg-white p-6 shadow-[0_25px_60px_-45px_rgba(27,26,24,0.7)]">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#7a5b48]">
            Add Question
          </p>
          <h3 className="text-lg font-semibold text-[#1b1a18]">
            Customize this event form
          </h3>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4"
          aria-busy={status === "loading"}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
            Question label
            <input
              name="label"
              required
              placeholder="Dietary preference"
              className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
            Field type
            <select
              name="type"
              className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
              value={fieldType}
              onChange={(event) => setFieldType(event.target.value)}
            >
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="DROPDOWN">Dropdown</option>
              <option value="CHECKBOX">Checkbox</option>
            </select>
          </label>
          {fieldType === "DROPDOWN" || fieldType === "CHECKBOX" ? (
            <label className="flex flex-col gap-2 text-sm font-medium text-[#3f352c]">
              Options (comma separated)
              <input
                name="options"
                placeholder="Vegetarian, Vegan, Halal"
                className="h-11 rounded-xl border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-base text-[#1b1a18] outline-none transition focus:border-[#b35b2e] focus:ring-2 focus:ring-[#e6c1a9]"
              />
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm font-medium text-[#3f352c]">
            <input
              name="required"
              type="checkbox"
              className="h-4 w-4 rounded border-[#d9c9b9] text-[#1b1a18]"
            />
            Required field
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-2 flex h-11 items-center justify-center rounded-full bg-[#1b1a18] text-xs font-semibold uppercase tracking-[0.3em] text-[#f4efe4] transition hover:bg-[#2a2724] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Saving..." : "Add Field"}
          </button>
        </form>
      </div>
    </div>
  );
}
