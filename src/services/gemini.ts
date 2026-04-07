import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CorrectionResult {
  originalText: string;
  correctedText: string;
  highlights: {
    text: string;
    error: string;
    explanation: string;
    type: "spelling" | "grammar" | "punctuation" | "vocabulary";
  }[];
  comment: string;
  stars: number;
  subject: "Vietnamese" | "English";
}

export async function analyzeText(
  input: { text?: string; imageBase64?: string; mimeType?: string },
  subject: "Vietnamese" | "English"
): Promise<CorrectionResult> {
  console.log("Starting analysis for subject:", subject);
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Bạn là một giáo viên tiểu học chuyên nghiệp, thân thiện và tận tâm.
Nhiệm vụ của bạn là chấm bài chính tả cho học sinh.
Môn học: ${subject === "Vietnamese" ? "Tiếng Việt (Bộ Kết nối tri thức)" : "Tiếng Anh (Chuẩn CEFR A1-A2)"}.

Quy trình:
1. Nếu có hình ảnh, hãy thực hiện OCR để nhận diện chữ viết tay của học sinh.
2. So sánh với chuẩn chính tả và ngữ pháp.
3. Phân tích lỗi:
   - Tiếng Việt: Sai chính tả, thiếu dấu, sai từ vựng.
   - Tiếng Anh: Sai chính tả, ngữ pháp cơ bản, từ vựng.
   - Quan trọng: Trong phần 'highlights', trường 'text' PHẢI là đoạn văn bản gốc bị lỗi (viết sai), còn trường 'error' PHẢI là văn bản ĐÃ ĐƯỢC SỬA ĐÚNG.
4. Chấm điểm sao (1-5 sao):
   - 5 sao: Đúng hoàn toàn.
   - 4 sao: Sai 1-2 lỗi nhỏ.
   - 3 sao: Sai 3-5 lỗi.
   - 1-2 sao: Sai nhiều lỗi, cần cố gắng.
5. Nhận xét:
   - Tiếng Việt: CHỈ sử dụng Tiếng Việt 100%, tuyệt đối không được có bất kỳ từ Tiếng Anh nào. Giọng cô giáo Việt Nam dịu dàng, khích lệ.
   - Tiếng Anh: Giọng giáo viên Việt Nam, khuyến khích xen kẽ 1 câu nhận xét tiếng Anh đơn giản ở cuối (ví dụ: "Good job!", "Keep it up!").

Trả về kết quả theo định dạng JSON.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      originalText: { type: Type.STRING },
      correctedText: { type: Type.STRING },
      highlights: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Đoạn văn bản gốc bị lỗi (viết sai)" },
            error: { type: Type.STRING, description: "Văn bản sau khi đã được sửa lại cho đúng" },
            explanation: { type: Type.STRING, description: "Giải thích ngắn gọn cho học sinh" },
            type: { type: Type.STRING, enum: ["spelling", "grammar", "punctuation", "vocabulary"] }
          },
          required: ["text", "error", "explanation", "type"]
        }
      },
      comment: { type: Type.STRING },
      stars: { type: Type.NUMBER },
      subject: { type: Type.STRING }
    },
    required: ["originalText", "correctedText", "highlights", "comment", "stars", "subject"]
  };

  const parts: any[] = [];
  if (input.text) parts.push({ text: `Văn bản cần chấm: ${input.text}` });
  if (input.imageBase64 && input.mimeType) {
    parts.push({
      inlineData: {
        data: input.imageBase64,
        mimeType: input.mimeType
      }
    });
    parts.push({ text: "Hãy nhận diện chữ viết từ ảnh này và chấm bài." });
  }

  const result = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  try {
    let jsonStr = result.text.trim();
    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", result.text);
    throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
  }
}

export async function generateSpeech(text: string, subject: "Vietnamese" | "English"): Promise<string> {
  const model = "gemini-2.5-flash-preview-tts";
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Đọc nhận xét sau đây với giọng giáo viên ${subject === "Vietnamese" ? "Việt Nam" : "Việt Nam xen kẽ tiếng Anh"}: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' } // Kore is good for Vietnamese
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || "";
}
