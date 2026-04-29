import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("should()", async () => {
    await orchestrator.clearAllEmails();
    await email.send({
      from: "CloneTabNews <no-reply@clone-tabnews.com>",
      to: "test@example.com",
      subject: "Test Email",
      text: "This is a test email",
    });
    await email.send({
      from: "CloneTabNews <no-reply@clone-tabnews.com>",
      to: "test@example.com",
      subject: "Último email",
      text: "Esse é o último email",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<no-reply@clone-tabnews.com>");
    expect(lastEmail.recipients[0]).toBe("<test@example.com>");
    expect(lastEmail.subject).toBe("Último email");
    expect(lastEmail.size).toBe("360");
    expect(lastEmail.text).toBe("Esse é o último email\r\n");
  });
});
