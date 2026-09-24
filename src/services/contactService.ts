const MOCK_MODE = false;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const contactService = {
  async sendMessage(data: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; message: string }> {
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 1000));
      console.log("Contact form submission (mock):", data);
      return { success: true, message: "Message sent successfully! (Mock mode)" };
    }

    const res = await fetch(`${API_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to send message");
    return result;
  },
};