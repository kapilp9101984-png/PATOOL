using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PDFDocumentAnalyser.Service;
using static PDFDocumentAnalyser.Model.PageIndexModels;

namespace PDFDocumentAnalyser.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentController : ControllerBase
    {
        private readonly PageIndexService _pageIndex;

        public DocumentController(PageIndexService pageIndex)
        {
            _pageIndex = pageIndex;
        }
        [HttpGet("health")] // Route: api/document/health
        public IActionResult GetHealth()
        {
            return Ok("Healthy");
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string fileName)
        {
            var tempPath = Path.GetTempFileName();
            using (var stream = System.IO.File.Create(tempPath))
                await file.CopyToAsync(stream);

            var docId = await _pageIndex.UploadDocumentAsync(tempPath, fileName);

            // Background mein wait karo (ya SignalR se notify karo)
            _ = Task.Run(() => _pageIndex.WaitForReadyAsync(docId));

            return Ok(new { docId });
        }

        // Question pucho document se
        [HttpPost("ask")]
        public async Task<IActionResult> Ask(
            [FromBody] ChatRequest request)
        {
            try
            {

                var answer = await _pageIndex.ChatAsync(
                    request.messages[request.messages.Count - 1].content, request.doc_id);
                return Ok(new { answer });
            }
            catch (Exception ex)
            {
                var answer = ex.Message;
                return Ok(new { answer });
            }
        }

        [HttpDelete("delete/{doc_id}")]
        public async Task<IActionResult> Delete(
             string doc_id)
        {
            var result = await _pageIndex.DeleteDocumentAsync(doc_id);
            return Ok(new { result });
        }

    }
}
