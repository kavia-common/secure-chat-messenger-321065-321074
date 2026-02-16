import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login screen when unauthenticated", () => {
  render(<App />);
  const title = screen.getByText(/welcome back/i);
  expect(title).toBeInTheDocument();
});
