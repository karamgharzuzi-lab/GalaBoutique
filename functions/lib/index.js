"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewOrder = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
const db = admin.firestore();
const GMAIL_USER = (0, params_1.defineSecret)("GMAIL_USER");
const GMAIL_PASS = (0, params_1.defineSecret)("GMAIL_PASS");
exports.onNewOrder = (0, firestore_1.onDocumentCreated)({
    document: "orders/{orderId}",
    region: "me-west1",
    secrets: [GMAIL_USER, GMAIL_PASS],
}, async (event) => {
    const orderId = event.params.orderId;
    const data = event.data?.data();
    if (!data)
        return;
    const { customer, items, total } = data;
    const itemCount = items.reduce((s, i) => s + i.qty, 0);
    // ── Get all admin emails from Firestore ──────────────────────────
    const adminSnap = await db.collection("admin_emails").get();
    const adminEmails = adminSnap.docs
        .map((d) => d.data().email)
        .filter((e) => !!e);
    if (adminEmails.length === 0) {
        console.log("No admin emails found — skipping notification");
        return;
    }
    // ── Build email body ─────────────────────────────────────────────
    const itemsList = items
        .map((i) => `• ${i.nameEn} x${i.qty} (${i.size}, ${i.color})`)
        .join("\n");
    const emailBody = `
🛍️ New GalaBoutique Order!

Customer: ${customer.name}
Phone: ${customer.phone}
Items: ${itemCount}
Total: ₪${total}
Order ID: ${orderId}

Items:
${itemsList}
    `.trim();
    // ── Send email via Gmail ─────────────────────────────────────────
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: GMAIL_USER.value(),
                pass: GMAIL_PASS.value(),
            },
        });
        await transporter.sendMail({
            from: `GalaBoutique Orders <${GMAIL_USER.value()}>`,
            to: adminEmails.join(", "),
            subject: `🛍️ New Order — ${customer.name} — ₪${total}`,
            text: emailBody,
        });
        console.log(`Email sent to: ${adminEmails.join(", ")}`);
    }
    catch (err) {
        console.error("Email error:", JSON.stringify(err));
    }
});
//# sourceMappingURL=index.js.map