// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// ⚠️ Make sure you set this with:
// firebase functions:config:set stripe.secret="sk_test_123..."
const stripe = require("stripe")(functions.config().stripe.secret);

/**
 * createCheckoutSession
 *
 * Callable from the frontend.
 * Expects:
 *   data = {
 *     items: [
 *       { name: "Chakra Water", price: 24.99, qty: 2 },
 *       { name: "Protection Candle", price: 12.99, qty: 1 }
 *     ],
 *     successUrl: "https://your-site.com/success.html",
 *     cancelUrl: "https://your-site.com/cart.html"
 *   }
 *
 * Returns:
 *   { url: "https://checkout.stripe.com/..." }
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    const items = data.items;
    const successUrl = data.successUrl;
    const cancelUrl = data.cancelUrl;

    if (!Array.isArray(items) || items.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No items provided in cart."
      );
    }

    if (!successUrl || !cancelUrl) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "successUrl and cancelUrl are required."
      );
    }

    // Build Stripe line items
    const lineItems = items.map((item) => {
      if (
        !item.name ||
        typeof item.price !== "number" ||
        typeof item.qty !== "number" ||
        item.qty <= 0
      ) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Each cart item must have name (string), price (number), qty (number > 0)."
        );
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          // Stripe amount is in cents
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      };
    });

    // Optional: create a "pending order" in Firestore so you have a record
    const pendingOrderRef = await db.collection("orders_pending").add({
      items,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        pendingOrderId: pendingOrderRef.id,
      },
    });

    return { url: session.url };
  } catch (err) {
    console.error("Error creating checkout session:", err);
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Unable to create Stripe Checkout session."
    );
  }
});
