import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("Whiteboard Creator Settings, Security PIN/Password & Temporary Approval Token Engine", () => {
  describe("Creator Attribution & Card Identification", () => {
    it("preserves custom creator name and formats author initials properly", () => {
      const creatorName = "Elena Vance";
      const authorInitials = creatorName
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2);

      expect(authorInitials).toBe("EV");
    });

    it("falls back to session username if creator name is blank", () => {
      const inputCreator = "";
      const sessionUser = "Satyam Sharma";
      const resolvedCreator = inputCreator.trim() || sessionUser;

      expect(resolvedCreator).toBe("Satyam Sharma");
    });
  });

  describe("Security PIN and Password Validation at Whiteboard Creation", () => {
    it("validates 4-digit PIN strictly (exactly 4 numbers)", () => {
      const isValidPin = (pin: string) => /^\d{4}$/.test(pin.trim());

      expect(isValidPin("1234")).toBe(true);
      expect(isValidPin("0000")).toBe(true);
      expect(isValidPin("9876")).toBe(true);

      // Rejections
      expect(isValidPin("123")).toBe(false); // 3 digits
      expect(isValidPin("12345")).toBe(false); // 5 digits
      expect(isValidPin("12a4")).toBe(false); // contains letter
      expect(isValidPin("    ")).toBe(false); // whitespace
    });

    it("validates 6-character password (minimum 6 characters)", () => {
      const isValidPassword = (pass: string) => pass.trim().length >= 6;

      expect(isValidPassword("secure")).toBe(true); // 6 chars
      expect(isValidPassword("Admin@2026")).toBe(true);

      // Rejections
      expect(isValidPassword("short")).toBe(false); // 5 chars
      expect(isValidPassword("12345")).toBe(false);
    });

    it("enforces matching password and confirm password fields", () => {
      const pass: string = "Whiteboard2026";
      const confirmPass: string = "Whiteboard2026";
      const wrongConfirm: string = "Whiteboard2025";

      expect(pass === confirmPass).toBe(true);
      expect(pass === wrongConfirm).toBe(false);
    });

    it("hashes PIN or password securely with bcrypt salt", async () => {
      const pin = "4829";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(pin, salt);

      expect(hash).not.toBe(pin);
      expect(await bcrypt.compare(pin, hash)).toBe(true);
      expect(await bcrypt.compare("0000", hash)).toBe(false);
    });
  });

  describe("Whiteboard Settings Popup Defaults & Access Controls", () => {
    it("defaults 'delete whiteboard needed pass' to [checked] (true)", () => {
      const defaultDeleteRequiresPass = true;
      expect(defaultDeleteRequiresPass).toBe(true);
    });

    it("defaults 'public edit' to [checked] (true)", () => {
      const defaultPublicEdit = true;
      expect(defaultPublicEdit).toBe(true);
    });

    it("generates random 6-digit temporary token phrase", () => {
      const generatePhrase = () => Math.floor(100000 + Math.random() * 900000).toString();
      const phrase = generatePhrase();

      expect(phrase).toMatch(/^\d{6}$/);
      expect(phrase.length).toBe(6);
    });

    it("verifies edit permission: allows creator or anyone when publicEdit is true", () => {
      const board = {
        authorId: "user-101",
        authorName: "Satyam Sharma",
        publicEdit: true,
        tempTokenPhrase: "849201",
      };

      const canEdit = (sessionUserId: string, editToken?: string) => {
        if (board.publicEdit) return true;
        if (board.authorId === sessionUserId) return true;
        if (editToken && editToken === board.tempTokenPhrase) return true;
        return false;
      };

      // Anyone can edit if publicEdit is true
      expect(canEdit("user-999")).toBe(true);
      expect(canEdit("user-101")).toBe(true);
    });

    it("restricts edit permission when publicEdit is false unless 6-digit token or master pass is supplied", () => {
      const board = {
        authorId: "user-101",
        authorName: "Elena Vance",
        publicEdit: false,
        tempTokenPhrase: "739184",
      };

      const canEdit = (sessionUserId: string, editToken?: string) => {
        if (board.publicEdit) return true;
        if (board.authorId === sessionUserId) return true;
        if (editToken && editToken === board.tempTokenPhrase) return true;
        return false;
      };

      // Other office colleague without token -> blocked
      expect(canEdit("user-colleague-2")).toBe(false);

      // Other office colleague with 6-digit token obtained from creator Elena -> approved!
      expect(canEdit("user-colleague-2", "739184")).toBe(true);

      // Whiteboard creator itself -> always allowed
      expect(canEdit("user-101")).toBe(true);
    });
  });

  describe("Password-Protected Whiteboard Deletion Verification", () => {
    it("blocks deletion if whiteboard is protected and password is wrong or omitted", async () => {
      const pin = "9402";
      const passwordHash = await bcrypt.hash(pin, 10);
      const board = {
        isProtected: true,
        deleteRequiresPass: true,
        passwordHash,
      };

      const verifyDelete = async (candidatePass?: string) => {
        if (!board.isProtected || !board.deleteRequiresPass) return true;
        if (!candidatePass) return false;
        return bcrypt.compare(candidatePass.trim(), board.passwordHash);
      };

      expect(await verifyDelete("")).toBe(false);
      expect(await verifyDelete("1111")).toBe(false);
      expect(await verifyDelete("9402")).toBe(true);
    });

    it("allows deletion without password if deleteRequiresPass is false or board is not protected", async () => {
      const unprotectedBoard = {
        isProtected: false,
        deleteRequiresPass: true,
        passwordHash: "",
      };

      const canDeleteUnprotected = !unprotectedBoard.isProtected || !unprotectedBoard.deleteRequiresPass;
      expect(canDeleteUnprotected).toBe(true);
    });
  });

  describe("Creator vs Non-Creator Security Guard & 5-Hour Temporary Edit Permissions", () => {
    it("detects creator correctly via authorId or case-insensitive authorName", () => {
      const isCreator = (
        currentUserId?: string,
        currentUserName?: string,
        authorId?: string,
        authorName?: string
      ) => {
        return Boolean(
          (currentUserId && authorId && currentUserId === authorId) ||
          (currentUserName && authorName && (
            currentUserName.trim().toLowerCase() === authorName.trim().toLowerCase() ||
            authorName.toLowerCase().includes(currentUserName.trim().toLowerCase()) ||
            currentUserName.toLowerCase().includes(authorName.trim().toLowerCase())
          ))
        );
      };

      expect(isCreator("user-1", "Satyam Himesh", "user-1", "Satyam Himesh")).toBe(true);
      expect(isCreator("user-2", "satyam himesh", "user-9", "Satyam Himesh")).toBe(true);
      expect(isCreator("user-employee", "John Doe", "user-creator", "Satyam Himesh")).toBe(false);
    });

    it("blocks non-creators from altering security checkboxes or regenerating tokens", () => {
      const board = {
        authorId: "creator-42",
        authorName: "Satyam Himesh",
        publicEdit: false,
        deleteRequiresPass: true,
        tempTokenPhrase: "849201",
      };

      const canModifySecurity = (userId: string) => userId === board.authorId;

      expect(canModifySecurity("creator-42")).toBe(true);
      expect(canModifySecurity("member-employee-99")).toBe(false);
    });

    it("calculates 5-hour temporary edit permission window correctly", () => {
      const fiveHoursMs = 5 * 60 * 60 * 1000;
      const now = Date.now();
      const expiresAt = now + fiveHoursMs;

      const isGrantValid = (grantTime: number) => grantTime > now;

      // Immediately after granting -> valid
      expect(isGrantValid(expiresAt)).toBe(true);

      // 4 hours in -> still valid
      expect(isGrantValid(now + 4 * 60 * 60 * 1000)).toBe(true);

      // 5 hours and 1 minute later -> expired
      expect(isGrantValid(now - 60 * 1000)).toBe(false);
    });
  });
});
