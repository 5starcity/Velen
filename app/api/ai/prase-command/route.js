export async function POST(request) {
    try {
      const body = await request.json();
      const { command, location } = body;
  
      if (!command || typeof command !== "string" || !command.trim()) {
        return Response.json({ error: "Missing command" }, { status: 400 });
      }
  
      const today = new Date().toISOString().split("T")[0];
  
      const systemPrompt = `You are the intent parser for Rezidence, a Nigerian housing and home-life app.
  
  Given a user's free-text command, return ONLY a JSON object (no markdown, no prose) with this exact shape:
  
  {
    "intent": one of ["FIND_SERVICE","CREATE_TRIP","CREATE_DAY_PLAN","FIND_PRODUCT","CREATE_HOME_PLAN","CREATE_GOAL","FIND_FOOD","UNKNOWN"],
    "service": string or null,
    "destination": string or null,
    "date": string or null (e.g. "Today", "Tomorrow", "Tonight", or a plain description),
    "arrivalTime": string or null (e.g. "9:00 AM"),
    "budget": number or null (in Naira, no currency symbol),
    "amount": number or null (in Naira, no currency symbol),
    "product": string or null,
    "title": short human-readable title of what the user wants to do,
    "description": one short sentence describing what Rezidence will do next
  }
  
  Rules:
  - Today's date is ${today}. The user is based in ${location || "Port Harcourt, Nigeria"}.
  - Only fill fields relevant to the detected intent; leave the rest null.
  - Amounts like "300k" = 300000, "1.5m" = 1500000.
  
  - If the command doesn't clearly match any intent, return "UNKNOWN" with a helpful title/description asking for more detail.
  - Never include any text outside the JSON object.`;
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: command },
          ],
        }),
      });
  
      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI error:", errText);
        return Response.json({ error: "AI parsing failed" }, { status: 502 });
      }
  
      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
  
      let parsed;
      try {
        parsed = JSON.parse(raw);
  
      } catch (e) {
        console.error("Failed to parse AI JSON:", raw);
        return Response.json({ error: "Invalid AI response" }, { status: 502 });
      }
  
      return Response.json(parsed);
    } catch (err) {
      console.error("parse-command error:", err);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
  }