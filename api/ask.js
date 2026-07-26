export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { prompt } = req.body;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
            process.env.GEMINI_API_KEY,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("Gemini response:", data);

        const raw =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const ans = raw.trim().toLowerCase();

        if (ans.startsWith("yes")) {
            return res.status(200).json({
                answer: "Yes"
            });
        }

        if (ans.startsWith("no")) {
            return res.status(200).json({
                answer: "No"
            });
        }

        if (ans.startsWith("probably")) {
            return res.status(200).json({
                answer: "Probably"
            });
        }

        if (ans.startsWith("unknown")) {
            return res.status(200).json({
                answer: "Unknown"
            });
        }

        return res.status(200).json({
            answer: "Unknown"
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            answer: "Unknown",
            error: error.message
        });
    }
}