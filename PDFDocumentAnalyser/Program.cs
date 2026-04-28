using PDFDocumentAnalyser.Service;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Add services to the container.
builder.Services.AddHttpClient<PageIndexService>(client =>
{
    client.DefaultRequestHeaders.TryAddWithoutValidation("api_key",
        builder.Configuration["PageIndex:ApiKey"]);
});

builder.Services.AddControllers();

var app = builder.Build();

app.UseHttpsRedirection();
// Configure the HTTP request pipeline.
app.UseCors(); // Add this line before app.Run()
app.UseAuthorization();
app.MapControllers();
app.Run();
