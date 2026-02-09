import { Hono } from "hono";

interface SMSApiResponse {
  status?: string;
  message?: string;
  request_id?: string;
  balance?: number;
}

const smsRouter = new Hono();

/**
 * Send SMS via BestBulkSMS API
 * This endpoint acts as a proxy to avoid CORS issues on web
 */
smsRouter.post("/send", async (c) => {
  try {
    const { to, body, from, api_key, api_url } = await c.req.json();

    if (!to || !body) {
      return c.json({ success: false, error: "Missing required fields: to, body" }, 400);
    }

    const smsApiUrl = api_url || process.env.BULKSMS_API_URL || "https://www.bestbulksms.com.ng/api/sms/send";
    const smsApiKey = api_key || process.env.BESTBULKSMS_API_KEY;

    if (!smsApiKey) {
      console.error("[SMS] No API key configured");
      return c.json({ success: false, error: "SMS API key not configured" }, 500);
    }

    // BestBulkSMS requires a registered sender ID
    // If no valid sender ID, try sending without one (API will use default)
    const requestBody: { to: string; body: string; from?: string } = {
      to,
      body,
    };

    // Only add sender ID if it looks valid and is provided
    if (from && from.length >= 3 && from.length <= 11) {
      requestBody.from = from;
    }

    console.log(`[SMS] Sending to: ${to}, body: ${body.substring(0, 30)}...`);
    console.log(`[SMS] Request body:`, JSON.stringify(requestBody));

    const response = await fetch(smsApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${smsApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as SMSApiResponse;
    console.log("[SMS] API Response:", JSON.stringify(data));

    if (!response.ok || data.status !== "ok") {
      return c.json({
        success: false,
        error: data.message || "Failed to send SMS",
        status_code: data.status,
        response: data,
      });
    }

    return c.json({
      success: true,
      message: "SMS sent successfully",
      request_id: data.request_id,
      balance: data.balance,
      response: data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[SMS] Error:", errorMessage);
    return c.json({ success: false, error: `SMS sending failed: ${errorMessage}` }, 500);
  }
});

export { smsRouter };
