import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field, Input } from "./Field";

describe("Field accessibility", () => {
  it("associates the label with the control via htmlFor/id", () => {
    render(<Field label="Email">{(props) => <Input {...props} />}</Field>);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  it("links an error message with aria-describedby and role=alert", () => {
    render(
      <Field label="Email" error="Required">
        {(props) => <Input {...props} />}
      </Field>
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Required");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("marks required fields with aria-required", () => {
    render(
      <Field label="Name" required>
        {(props) => <Input {...props} />}
      </Field>
    );
    expect(screen.getByLabelText(/Name/)).toHaveAttribute("aria-required", "true");
  });
});
