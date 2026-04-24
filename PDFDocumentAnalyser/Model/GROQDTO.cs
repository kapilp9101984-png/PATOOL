
using System.Text.Json.Serialization;

namespace PDFDocumentAnalyser.Model
{
    public class GROQDTO
    {
        public record GroqResponse(
    [property: JsonPropertyName("choices")] List<GroqChoice> Choices,
    [property: JsonPropertyName("usage")] GroqUsage Usage
);

        public record GroqChoice(
            [property: JsonPropertyName("message")] GroqMessage Message,
            [property: JsonPropertyName("finish_reason")] string FinishReason
        );

        public record GroqMessage(
            [property: JsonPropertyName("role")] string Role,
            [property: JsonPropertyName("content")] string Content
        );

        public record GroqUsage(
            [property: JsonPropertyName("total_tokens")] int TotalTokens
        );
    }
}
