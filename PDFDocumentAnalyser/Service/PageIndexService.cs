using Microsoft.AspNetCore.DataProtection.KeyManagement;
using System.Net.Http.Headers;
using static PDFDocumentAnalyser.Model.GROQDTO;
using static PDFDocumentAnalyser.Model.PageIndexModels;

namespace PDFDocumentAnalyser.Service
{
    public class PageIndexService
    {
        private readonly HttpClient _http;
        private const string BaseUrl = "https://api.pageindex.ai";
        private readonly string pageIndexKey;
        private readonly string GroqKey;

        public PageIndexService(HttpClient http, IConfiguration config)
        {
            _http = http;
            pageIndexKey = config["PageIndex:ApiKey"] ?? string.Empty;
            GroqKey = config["GROQ:ApiKey"] ?? string.Empty;
        }

        // 1. PDF Upload karo
        public async Task<string> UploadDocumentAsync(string filePath, string fileName)
        {
            /* using var form = new MultipartFormDataContent();
             var fileBytes = await File.ReadAllBytesAsync(filePath);
             form.Add(new ByteArrayContent(fileBytes), "file",
                      Path.GetFileName(filePath));*/

            string docID = string.Empty;

            using (var client = new HttpClient())
            using (var fileStream = File.OpenRead(filePath))
            using (var content = new MultipartFormDataContent())
            using (var fileContent = new StreamContent(fileStream))
            {
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
                content.Add(fileContent, "file", fileName + ".pdf");
                client.DefaultRequestHeaders.Add("api_key", pageIndexKey);

                HttpResponseMessage response = await client.PostAsync("https://api.pageindex.ai/doc/", content);
                string responseString = await response.Content.ReadAsStringAsync();

                var result = await response.Content
               .ReadFromJsonAsync<DocumentUploadResponse>();
                docID = result!.doc_id;
            }

            //var response = await _http.PostAsync($"{BaseUrl}/doc/", form);
            //response.EnsureSuccessStatusCode();
            return docID;

        }

        // 2. Processing status check karo
        public async Task<DocumentStatusResponse> GetDocumentStatusAsync(
            string docId, string type = "tree")
        {
            var response = await _http.GetAsync(
                $"{BaseUrl}/doc/{docId}/?type={type}");
            response.EnsureSuccessStatusCode();

            return (await response.Content
                .ReadFromJsonAsync<DocumentStatusResponse>())!;
        }

        // 3. Document ready hone tak wait karo
        public async Task WaitForReadyAsync(string docId,
            int pollIntervalMs = 3000)
        {
            while (true)
            {
                var status = await GetDocumentStatusAsync(docId);

                if (status.retrieval_ready) return;
                if (status.status == "failed")
                    throw new Exception($"Processing failed: {docId}");

                await Task.Delay(pollIntervalMs);
            }
        }

        public async Task<string> ChatAsync(string question,
        string? docId = null)
        {
            try
            {
                var request = new ChatRequest(
               messages: [new ChatMessage("user", question)],
               doc_id: docId,
               stream: false
           );

                var response = await _http.PostAsJsonAsync(
                    $"{BaseUrl}/chat/completions", request);
                response.EnsureSuccessStatusCode();

                var result = await response.Content
                    .ReadFromJsonAsync<ChatResponse>();
                var pageIndexAPIResponse = result!.choices[0].message.content;


                return await ChatReponseFormatter(pageIndexAPIResponse);
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message, ex);
            }

            //return pageIndexAPIResponse;
        }

        public async Task<string> ChatReponseFormatter(string AiNormatTextANS)
        {

            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {GroqKey}");


            var request = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
        new { role = "system", content = "Convert plain text to semantic HTML fragment. Return only HTML, no markdown fences." },
        new { role = "user",   content = AiNormatTextANS }
    },
                max_tokens = 2048
            };

            var response = await _http.PostAsJsonAsync(
                "https://api.groq.com/openai/v1/chat/completions", request
            );

            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GroqResponse>();
            var html = result?.Choices[0].Message.Content ?? AiNormatTextANS;

            // Safety cleanup
            return html.Replace("```html", "").Replace("```", "").Trim();
        }

        // 4. Remove document
        public async Task<bool> DeleteDocumentAsync(string docId)
        {
            // _http.DefaultRequestHeaders.Add("api_key", pageIndexKey);
            var response = await _http.DeleteAsync($"{BaseUrl}/doc/{docId}/");

            if (response.IsSuccessStatusCode)
            {
                return true;
            }
            else
            {
                var errorMessage = await response.Content.ReadAsStringAsync();
                throw new Exception($"Failed to delete document: {errorMessage}");
            }
        }
    }
}
