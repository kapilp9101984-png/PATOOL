namespace PDFDocumentAnalyser.Model
{
    public class PageIndexModels
    {
        public record DocumentUploadResponse(string doc_id);
        public record TreeNode(
            string title,
            string node_id,
            int? page_index,
            string? text,
            string? summary,
            List<TreeNode>? nodes
            );

        public record DocumentStatusResponse(
    string doc_id,
    string status,
    bool retrieval_ready,
    List<TreeNode>? result
);

        public record ChatMessage(string role, string content);

        public record ChatRequest(
            List<ChatMessage> messages,
            string? doc_id = null,
            bool stream = false,
            bool enable_citations = false
        );

        public record ChatChoice(ChatMessage message, string finish_reason);

        public record ChatResponse(
            string id,
            List<ChatChoice> choices
        );

    }
}
