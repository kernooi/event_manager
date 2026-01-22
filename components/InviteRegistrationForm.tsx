"use client";

import { useState } from "react";

type Field = {
  id: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DROPDOWN" | "CHECKBOX";
  required: boolean;
  options: string[] | null;
};

type InviteRegistrationFormProps = {
  token: string;
  eventName: string;
  fields: Field[];
};

type Status = "idle" | "loading" | "success" | "error";

export default function InviteRegistrationForm({
  token,
  eventName,
  fields,
}: InviteRegistrationFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const answers: Record<string, string | string[]> = {};
    const ageRaw = String(formData.get("age") || "").trim();
    const gender = String(formData.get("gender") || "").trim();

    fields.forEach((field) => {
      const key = `field_${field.id}`;
      if (field.type === "CHECKBOX") {
        const values = formData
          .getAll(key)
          .map((value) => String(value).trim())
          .filter(Boolean);
        if (values.length > 0) {
          answers[field.id] = values;
        }
        return;
      }

      const value = String(formData.get(key) || "").trim();
      if (value) {
        answers[field.id] = value;
      }
    });

    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      age: ageRaw,
      gender,
      answers,
    };

    try {
      const response = await fetch(`/api/invites/${token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("error");
        setMessage(data?.error || "Registration failed.");
        return;
      }

      setStatus("success");
      setMessage(
        "Registration successful. A QR code will be sent to your email."
      );
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-[#d6dbe7] bg-white p-8 text-center shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
          Registration Complete
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#0f172a]">
          You are confirmed for {eventName}
        </h2>
        <p className="mt-3 text-sm text-[#64748b]">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#d6dbe7] bg-white p-8 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.6)]"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
          Registration
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#0f172a]">
          Complete your RSVP
        </h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Fill out the form below to confirm your attendance.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
          Full name
          <input
            name="fullName"
            required
            className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
          Age
          <input
            name="age"
            type="number"
            min={0}
            required
            className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
          Gender
          <select
            name="gender"
            required
            className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
          >
            <option value="">Select a gender</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="NON_BINARY">Non-binary</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
          Email
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]">
          Phone
          <input
            name="phone"
            type="tel"
            required
            className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </label>
      </div>

      {fields.length > 0 ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-[#4c5b78]">
            Additional Questions
          </p>
          {fields.map((field) => {
            const fieldName = `field_${field.id}`;

            if (field.type === "DROPDOWN") {
              return (
                <label
                  key={field.id}
                  className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]"
                >
                  {field.label}
                  <select
                    name={fieldName}
                    required={field.required}
                    className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                  >
                    <option value="">Select an option</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }

            if (field.type === "CHECKBOX") {
              return (
                <fieldset key={field.id} className="space-y-2">
                  <legend className="text-sm font-medium text-[#1f2937]">
                    {field.label}
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {(field.options ?? []).map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-[#1f2937]"
                      >
                        <input
                          type="checkbox"
                          name={fieldName}
                          value={option}
                          className="h-4 w-4 rounded border-[#d6dbe7] text-[#0f172a]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            }

            return (
              <label
                key={field.id}
                className="flex flex-col gap-2 text-sm font-medium text-[#1f2937]"
              >
                {field.label}
                <input
                  name={fieldName}
                  type={field.type === "NUMBER" ? "number" : "text"}
                  required={field.required}
                  className="h-11 rounded-xl border border-[#d6dbe7] bg-[#f8fafc] px-4 text-base text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
                />
              </label>
            );
          })}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-8 flex h-11 w-full items-center justify-center rounded-full bg-[#0f172a] text-xs font-semibold uppercase tracking-[0.3em] text-[#f5f7fb] transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Submitting..." : "Complete Registration"}
      </button>

      {message ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            status === "error"
              ? "bg-[#fef2f2] text-[#991b1b]"
              : "bg-[#eff6ff] text-[#166534]"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}


