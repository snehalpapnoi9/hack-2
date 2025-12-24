
import { WebhookResponse } from '../types';

const WEBHOOK_URL = 'https://testmxv1.app.n8n.cloud/webhook/06eab1a8-31c8-464c-8e4f-c75df8514f71';

/**
 * Sends a message to the n8n webhook and returns the response content.
 * This version is designed to be extremely resilient to different n8n response formats
 * (JSON, Text, Arrays, Objects with custom keys).
 */
export const sendToWebhook = async (question: string): Promise<string> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    // We read the body as text first to handle both JSON and non-JSON responses gracefully
    // and avoid "Unexpected end of JSON input" errors.
    const responseText = await response.text().catch(() => '');

    if (!response.ok) {
      let displayMessage = `Server Error (${response.status})`;
      
      try {
        const parsedError = JSON.parse(responseText);
        displayMessage = parsedError.message || responseText || displayMessage;
      } catch (e) {
        if (responseText) displayMessage = responseText;
      }

      // Specific troubleshooting for the common n8n "Unused Respond to Webhook" error
      if (displayMessage.includes("Unused Respond to Webhook")) {
        displayMessage = `n8n Configuration Error: ${displayMessage}. (Tip: This usually means your n8n workflow isn't 'Active' or the execution path didn't reach a 'Respond to Webhook' node. Please check your n8n workflow connections.)`;
      }
      
      throw new Error(displayMessage);
    }

    // If the response is OK but empty
    if (!responseText.trim()) {
      throw new Error("The server returned an empty successful response. Ensure your n8n 'Respond to Webhook' node has a body defined.");
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If it's not JSON, n8n might be returning raw text (common in simple workflows)
      return responseText.trim();
    }

    // If we have JSON, it might be an array (n8n default) or a single object/string
    const target = Array.isArray(data) ? data[0] : data;

    if (target === undefined || target === null) {
      throw new Error("The server returned an empty data object.");
    }

    // Case 1: The JSON is just a string
    if (typeof target === 'string') {
      return target.trim();
    }

    // Case 2: Standard n8n/AI response keys
    const responseContent = target.answer || target.output || target.text || target.response;
    if (typeof responseContent === 'string' && responseContent.trim() !== '') {
      return responseContent.trim();
    }

    // Case 3: Resiliency - Look for ANY key that contains a non-empty string value
    // This handles cases where n8n uses custom names or dynamic property names
    for (const key of Object.keys(target)) {
      const val = target[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }

    // Case 4: Edge case - If no string values, but exactly one key exists and it looks like a message
    const keys = Object.keys(target);
    if (keys.length === 1 && keys[0].length > 20 && keys[0].includes(' ')) {
       return keys[0];
    }

    // Fallback if we really can't figure out the structure
    const availableFields = keys.join(', ') || 'none';
    throw new Error(`Could not find a valid response field. Available fields: ${availableFields}`);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(msg);
  }
};
